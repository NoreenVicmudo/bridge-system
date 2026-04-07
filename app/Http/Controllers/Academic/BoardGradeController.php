<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\Academic\BoardSubject;
use App\Models\Academic\StudentBoardGrade; // <-- Matching your exact model name
use App\Models\College;
use App\Models\Program;
use App\Models\Student\StudentInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BoardGradeController extends Controller
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

        // 1. Get Board Subjects dynamically for this specific program
        $boardSubjects = BoardSubject::where('program_id', $filter['program'])
            ->where('is_active', 1)
            ->get();
            
        $subjectHeaders = $boardSubjects->pluck('subject_name')->toArray();

        // 2. Fetch Filtered Students
        $query = StudentInfo::whereHas('sections', function ($q) use ($filter) {
            $q->where('academic_year', $filter['academic_year'])
              ->where('program_id', $filter['program'])
              ->where('year_level', $filter['year_level'])
              ->where('semester', $filter['semester'])
              ->where('section', $filter['section'])
              ->where('is_active', 1);
        })->with(['college', 'program']);

        // Handle Search
        $search = $request->get('search');
        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $q->where('student_info.student_number', 'LIKE', "%{$search}%")
                  ->orWhereRaw("CONCAT(student_info.student_lname, ', ', student_info.student_fname) LIKE ?", ["%{$search}%"]);
            });
        }

        // Handle Sort
        $sortColumn = $request->get('sort', 'student_info.student_id');
        $sortDirection = $request->get('direction', 'desc');
        $query->orderBy($sortColumn, $sortDirection === 'asc' ? 'asc' : 'desc');

        $students = $query->paginate(10)->withQueryString();

        // 3. Fetch Grades using your exact model
        $grades = StudentBoardGrade::whereIn('student_number', $students->pluck('student_number'))
            ->where('is_active', 1)
            ->get()
            ->groupBy('student_number');

        $students->getCollection()->transform(function ($student) use ($grades, $boardSubjects) {
            $studentGrades = $grades->get($student->student_number) ?? collect();
            
            $gradeMap = [];
            foreach ($boardSubjects as $subject) {
                $record = $studentGrades->where('subject_id', $subject->subject_id)->first();
                // Matching your specific column: subject_grade
                $gradeMap[$subject->subject_name] = $record ? $record->subject_grade : null; 
            }

            return [
                'id' => $student->student_id,
                'student_number' => $student->student_number,
                'name' => "{$student->student_lname}, {$student->student_fname}",
                'grades' => $gradeMap,
            ];
        });

        return Inertia::render('Academic/BoardSubjectGrades', [
            'students' => [
                'data' => $students,
                'subjects' => $subjectHeaders 
            ],
            'filter' => $filter,
            'search' => $search ?? '',
            'sort' => $sortColumn,
            'direction' => $sortDirection,
        ]);
    }

    public function edit(Request $request)
    {
        $studentId = $request->query('student_id');
        $student = StudentInfo::findOrFail($studentId);
        
        $subjects = BoardSubject::where('program_id', $student->program_id)
            ->where('is_active', 1)
            ->get()
            ->map(function ($sub) {
                return ['value' => $sub->subject_id, 'label' => $sub->subject_name];
            });

        // Pluck the 'subject_grade' mapped to 'subject_id'
        $grades = StudentBoardGrade::where('student_number', $student->student_number)
            ->where('is_active', 1)
            ->pluck('subject_grade', 'subject_id');

        return Inertia::render('Academic/BoardGradesEntry', [
            'student' => $student,
            'subjectOptions' => $subjects,
            'currentGrades' => $grades,
        ]);
    }

    public function update(Request $request, $studentId)
    {
        $validated = $request->validate([
            'student_number' => 'required|exists:student_info,student_number',
            'subject_id'     => 'required|integer|exists:board_subjects,subject_id',
            'subject_grade'  => 'required|numeric|min:0|max:100', // Adjust max depending on your grading scale
        ]);

        StudentBoardGrade::updateOrCreate(
            [
                'student_number' => $validated['student_number'],
                'subject_id'     => $validated['subject_id'],
            ],
            [
                'subject_grade' => $validated['subject_grade'],
                'date_created'  => now(),
                'is_active'     => 1,
            ]
        );

        return redirect()->back()->with('success', 'Board subject grade updated successfully.');
    }

    public function export(Request $request)
    {
        $filter = $request->validate([
            'academic_year' => 'required|string',
            'college'       => 'required|integer',
            'program'       => 'required|integer',
            'year_level'    => 'required|integer',
            'semester'      => 'required|string',
            'section'       => 'required|string',
        ]);

        // 1. Get exact board subjects for this program
        $boardSubjects = BoardSubject::where('program_id', $filter['program'])
            ->where('is_active', 1)
            ->get();

        // 2. Fetch Students (No pagination)
        $students = StudentInfo::whereHas('sections', function ($q) use ($filter) {
            $q->where('academic_year', $filter['academic_year'])
              ->where('program_id', $filter['program'])
              ->where('year_level', $filter['year_level'])
              ->where('semester', $filter['semester'])
              ->where('section', $filter['section'])
              ->where('is_active', 1);
        })->get();

        // 3. Fetch all grades
        $grades = StudentBoardGrade::whereIn('student_number', $students->pluck('student_number'))
            ->where('is_active', 1)
            ->get()
            ->groupBy('student_number');

        // 4. Set Headers dynamically based on subjects
        $headers = ['Student Number', 'Student Name'];
        foreach ($boardSubjects as $sub) {
            $headers[] = $sub->subject_name;
        }

        $callback = function() use ($students, $grades, $boardSubjects, $headers) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);

            foreach ($students as $student) {
                $studentGrades = $grades->get($student->student_number) ?? collect();
                
                $row = [
                    $student->student_number,
                    "{$student->student_lname}, {$student->student_fname}"
                ];

                // Append grades matching the header order
                foreach ($boardSubjects as $sub) {
                    $record = $studentGrades->where('subject_id', $sub->subject_id)->first();
                    $row[] = $record ? $record->subject_grade : '';
                }
                fputcsv($file, $row);
            }
            fclose($file);
        };

        $fileName = "BoardGrades_Export_{$filter['section']}_{$filter['academic_year']}.csv";

        return response()->stream($callback, 200, [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ]);
    }

    /**
     * Import CSV and dynamically map headers to subjects (Case-Insensitive)
     */
    public function import(Request $request)
    {
        if (is_string($request->filter)) {
            $request->merge(['filter' => json_decode($request->filter, true)]);
        }

        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
            'filter' => 'required|array',
            'filter.program' => 'required|integer',
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');
        $headers = fgetcsv($handle);
        
        if (!$headers) {
            return response()->json(['success' => false, 'message' => 'Empty file'], 422);
        }

        // 1. Get valid subjects for this program
        $boardSubjects = BoardSubject::where('program_id', $request->filter['program'])
            ->where('is_active', 1)
            ->get();
            
        // NEW: Create a LOWERCASE lookup map: ['microbiology' => 12, 'genetics' => 13]
        $subjectMap = [];
        foreach ($boardSubjects as $sub) {
            $subjectMap[strtolower(trim($sub->subject_name))] = $sub->subject_id;
        }

        // 2. Identify which CSV columns contain grades by matching lowercase header names
        $subjectColumns = [];
        foreach ($headers as $index => $header) {
            // NEW: Convert the CSV header to lowercase before checking
            $cleanHeader = strtolower(trim($header));
            
            if (isset($subjectMap[$cleanHeader])) {
                $subjectColumns[] = [
                    'subject_id' => $subjectMap[$cleanHeader],
                    'index' => $index
                ];
            }
        }

        if (empty($subjectColumns)) {
            return response()->json([
                'success' => false, 
                'message' => 'No matching board subjects found in headers. Ensure your column names match the subjects.'
            ], 422);
        }

        $now = now();
        
        // 3. Process records and use updateOrCreate to guarantee no duplicates
        $recordsProcessed = 0;
        
        while (($row = fgetcsv($handle)) !== false) {
            $studentNumber = $row[0] ?? null;
            if (!$studentNumber) continue;

            $studentExists = StudentInfo::where('student_number', $studentNumber)->exists();
            if (!$studentExists) continue;

            foreach ($subjectColumns as $col) {
                $gradeValue = $row[$col['index']] ?? null;
                
                if ($gradeValue !== null && $gradeValue !== '') {
                    // Eloquent will safely check if this specific student and subject exist.
                    // If yes, it updates. If no, it inserts. No database unique keys required!
                    StudentBoardGrade::updateOrCreate(
                        [
                            'student_number' => $studentNumber,
                            'subject_id'     => $col['subject_id'],
                        ],
                        [
                            'subject_grade' => (float)$gradeValue,
                            'date_created'  => $now,
                            'is_active'     => 1,
                        ]
                    );
                    $recordsProcessed++;
                }
            }
        }
        fclose($handle);

        return response()->json([
            'success' => true, 
            'message' => 'Import completed successfully.', 
            'records_processed' => $recordsProcessed
        ]);
    }
}