<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\Academic\StudentAcademicRecognition;
use App\Models\College;
use App\Models\Program;
use App\Models\Student\StudentInfo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RecognitionController extends Controller
{
    public function index(Request $request)
    {
        $filter = $request->validate([
            'academic_year' => 'required|string',
            'college'       => 'required|integer',
            'program'       => 'required|integer',
            'year_level'    => 'required|integer',
            'semester'      => 'required|string',
            'section'       => 'required|string',
        ]);

        $college = College::where('college_id', $filter['college'])->first();
        $program = Program::where('program_id', $filter['program'])->first();
        $filter['college_name'] = $college ? $college->name : 'N/A';
        $filter['program_name'] = $program ? $program->name : 'N/A';

        $query = StudentInfo::whereHas('sections', function ($q) use ($filter) {
            $q->where('academic_year', $filter['academic_year'])
              ->where('program_id', $filter['program'])
              ->where('year_level', $filter['year_level'])
              ->where('semester', $filter['semester'])
              ->where('section', $filter['section'])
              ->where('is_active', 1);
        })->with(['college', 'program']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('student_info.student_number', 'LIKE', "%{$search}%")
                  ->orWhereRaw("CONCAT(student_info.student_lname, ', ', student_info.student_fname) LIKE ?", ["%{$search}%"]);
            });
        }

        $sortColumn = $request->get('sort', 'student_info.student_id');
        $sortDirection = $request->get('direction', 'desc');
        $query->orderBy($sortColumn, $sortDirection === 'asc' ? 'asc' : 'desc');

        $students = $query->paginate(10)->withQueryString();

        $recognitions = StudentAcademicRecognition::whereIn('student_number', $students->pluck('student_number'))
            ->where('is_active', 1)->get()->keyBy('student_number');

        $students->getCollection()->transform(function ($student) use ($recognitions) {
            $record = $recognitions->get($student->student_number);
            return [
                'id' => $student->student_id,
                'student_number' => $student->student_number,
                'name' => "{$student->student_lname}, {$student->student_fname}",
                'recognition_count' => $record ? $record->award_count : 0,
            ];
        });

        return Inertia::render('Academic/AcademicRecognition', [
            'students' => $students,
            'filter'   => $filter,
            'search'   => $request->search ?? '',
            'sort'     => $sortColumn,
            'direction'=> $sortDirection,
        ]);
    }

    public function edit(Request $request)
    {
        $student = StudentInfo::findOrFail($request->query('student_id'));
        $record = StudentAcademicRecognition::where('student_number', $student->student_number)
            ->where('is_active', 1)->first();

        return Inertia::render('Academic/RecognitionEntry', [
            'student' => $student,
            'awardCount' => $record ? $record->award_count : 0,
        ]);
    }

    public function update(Request $request, $studentId)
    {
        $validated = $request->validate([
            'student_number' => 'required|exists:student_info,student_number',
            'award_count'    => 'required|integer|min:0',
        ]);

        StudentAcademicRecognition::updateOrCreate(
            ['student_number' => $validated['student_number']],
            [
                'award_count'  => $validated['award_count'],
                'date_created' => now(),
                'is_active'    => 1
            ]
        );

        return redirect()->back()->with('success', 'Recognition record updated.');
    }

    public function export(Request $request)
    {
        // 1. Validate ALL necessary filters
        $filter = $request->validate([
            'academic_year' => 'required|string',
            'program'       => 'required|integer',
            'year_level'    => 'required|integer',
            'semester'      => 'required|string',
            'section'       => 'required|string',
        ]);

        // 2. Apply the EXACT same query as your index method
        $students = StudentInfo::whereHas('sections', function ($q) use ($filter) {
            $q->where('academic_year', $filter['academic_year'])
            ->where('program_id', $filter['program'])
            ->where('year_level', $filter['year_level'])
            ->where('semester', $filter['semester'])
            ->where('section', $filter['section'])
            ->where('is_active', 1);
        })->get();

        $records = StudentAcademicRecognition::whereIn('student_number', $students->pluck('student_number'))
            ->where('is_active', 1)->get()->keyBy('student_number');

        $headers = ['Student Number', 'Student Name', 'Dean\'s List Count'];

        $callback = function() use ($students, $records, $headers) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);
            foreach ($students as $student) {
                $rec = $records->get($student->student_number);
                fputcsv($file, [
                    $student->student_number,
                    "{$student->student_lname}, {$student->student_fname}",
                    $rec ? $rec->award_count : 0
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, [
            "Content-type" => "text/csv", 
            "Content-Disposition" => "attachment; filename=AcademicRecognition_Export.csv"
        ]);
    }

    public function import(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt']);
        $handle = fopen($request->file('file')->getRealPath(), 'r');
        fgetcsv($handle); // Skip headers

        $processed = 0;
        while (($row = fgetcsv($handle)) !== false) {
            $sNum = $row[0] ?? null;
            $count = $row[2] ?? 0; // Assuming format: student_number, name, count

            if ($sNum && StudentInfo::where('student_number', $sNum)->exists()) {
                StudentAcademicRecognition::updateOrCreate(
                    ['student_number' => $sNum],
                    ['award_count' => (int)$count, 'date_created' => now(), 'is_active' => 1]
                );
                $processed++;
            }
        }
        fclose($handle);
        return response()->json(['success' => true, 'message' => 'Imported ' . $processed . ' recognition records.']);
    }
}