<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\Academic\GeneralSubject;
use App\Models\Academic\StudentBackSubject;
use App\Models\College;
use App\Models\Program;
use App\Models\Student\StudentInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BackSubjectsController extends Controller
{
    /**
     * Display list of students with retake counts per subject.
     */
    // Inside App\Http\Controllers\Academic\BackSubjectsController.php

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

        $subjects = GeneralSubject::where('program_id', $filter['program'])
            ->where('is_active', 1)
            ->get();
        $subjectHeaders = $subjects->pluck('general_subject_name')->toArray();

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
            $query->where(function ($q) use ($search) {
                $q->where('student_info.student_number', 'LIKE', "%{$search}%")
                    ->orWhereRaw("CONCAT(student_info.student_lname, ', ', student_info.student_fname) LIKE ?", ["%{$search}%"]);
            });
        }

        $sortColumn = $request->get('sort', 'student_info.student_id');
        $sortDirection = $request->get('direction', 'desc');
        $query->orderBy($sortColumn, $sortDirection === 'asc' ? 'asc' : 'desc');

        $students = $query->paginate(10)->withQueryString();

        $retakes = StudentBackSubject::whereIn('student_number', $students->pluck('student_number'))
            ->where('is_active', 1)
            ->get()
            ->groupBy('student_number');

        $students->getCollection()->transform(function ($student) use ($retakes, $subjects) {
            $studentRetakes = $retakes->get($student->student_number) ?? collect();
            $grades = [];
            foreach ($subjects as $subject) {
                $record = $studentRetakes->firstWhere('general_subject_id', $subject->general_subject_id);
                $grades[$subject->general_subject_name] = $record ? $record->terms_repeated : 0;
            }

            return [
                'id'              => $student->student_id,
                'student_number'  => $student->student_number,
                'name'            => "{$student->student_lname}, {$student->student_fname}",
                'grades'          => $grades,
            ];
        });

        return Inertia::render('Academic/RetakesInfo', [
            // FIXED: Separate the paginator from the headers to match your TableContainer usage
            'students' => $students,
            'subjects' => $subjectHeaders,
            'filter'   => $filter,
            'search'   => $request->search ?? '',
            'sort'     => $sortColumn,
            'direction'=> $sortDirection,
        ]);
    }

    /**
     * Show the edit form for a single student.
     */
    public function edit(Request $request)
    {
        $student = StudentInfo::findOrFail($request->query('student_id'));

        // Get all general subjects for the student's program
        $subjectOptions = GeneralSubject::where('program_id', $student->program_id)
            ->where('is_active', 1)
            ->get()
            ->map(fn($subj) => [
                'value' => $subj->general_subject_id,
                'label' => $subj->general_subject_name,
            ]);

        // Get existing retake counts for this student
        $currentRetakes = StudentBackSubject::where('student_number', $student->student_number)
            ->where('is_active', 1)
            ->pluck('terms_repeated', 'general_subject_id')
            ->toArray();

        return Inertia::render('Academic/RetakesEntry', [
            'student'         => $student,
            'subjectOptions'  => $subjectOptions,
            'currentRetakes'  => $currentRetakes,
        ]);
    }

    /**
     * Update or create a retake record for a student.
     */
    public function update(Request $request, $studentId)
    {
        $validated = $request->validate([
            'student_number'      => 'required|exists:student_info,student_number',
            'general_subject_id'  => 'required|integer|exists:general_subjects,general_subject_id',
            'terms_repeated'      => 'required|integer|min:0',
        ]);

        StudentBackSubject::updateOrCreate(
            [
                'student_number'     => $validated['student_number'],
                'general_subject_id' => $validated['general_subject_id'],
            ],
            [
                'terms_repeated' => $validated['terms_repeated'],
                'date_created'   => now(),
                'is_active'      => true,
            ]
        );

        return redirect()->back()->with('success', 'Retake count updated successfully.');
    }

    /**
     * Export current filtered data to CSV.
     */
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

        // Get subjects for this program
        $subjects = GeneralSubject::where('program_id', $filter['program'])
            ->where('is_active', 1)
            ->get();

        // Get students
        $students = StudentInfo::whereHas('sections', function ($q) use ($filter) {
            $q->where('academic_year', $filter['academic_year'])
                ->where('program_id', $filter['program'])
                ->where('year_level', $filter['year_level'])
                ->where('semester', $filter['semester'])
                ->where('section', $filter['section'])
                ->where('is_active', 1);
        })->get();

        // Fetch all retakes for these students
        $retakes = StudentBackSubject::whereIn('student_number', $students->pluck('student_number'))
            ->where('is_active', 1)
            ->get()
            ->groupBy('student_number');

        // Prepare CSV headers
        $headers = ['Student Number', 'Student Name'];
        foreach ($subjects as $subject) {
            $headers[] = $subject->general_subject_name;
        }

        $callback = function () use ($students, $retakes, $subjects, $headers) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);

            foreach ($students as $student) {
                $studentRetakes = $retakes->get($student->student_number) ?? collect();
                $row = [
                    $student->student_number,
                    "{$student->student_lname}, {$student->student_fname}",
                ];
                foreach ($subjects as $subject) {
                    $record = $studentRetakes->firstWhere('general_subject_id', $subject->general_subject_id);
                    $row[] = $record ? $record->terms_repeated : 0;
                }
                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename=Retakes_Export.csv',
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ]);
    }

    /**
     * Import retake data from CSV.
     * Expected columns: student_number, SubjectName1, SubjectName2, ...
     */
    public function import(Request $request)
    {
        // Decode filter if sent as JSON string
        if (is_string($request->filter)) {
            $request->merge(['filter' => json_decode($request->filter, true)]);
        }

        $request->validate([
            'file'   => 'required|file|mimes:csv,txt',
            'filter' => 'required|array',
            'filter.program' => 'required|integer',
        ]);

        $handle = fopen($request->file('file')->getRealPath(), 'r');
        $headers = fgetcsv($handle);
        if (!$headers) {
            return response()->json(['success' => false, 'message' => 'Empty file'], 422);
        }

        // Get all active subjects for this program
        $subjects = GeneralSubject::where('program_id', $request->filter['program'])
            ->where('is_active', 1)
            ->get();

        // Build map: subject_name -> subject_id
        $subjectMap = [];
        foreach ($subjects as $subject) {
            $subjectMap[strtolower(trim($subject->general_subject_name))] = $subject->general_subject_id;
        }

        // Identify which CSV columns correspond to subjects
        $subjectColumns = [];
        foreach ($headers as $index => $header) {
            $cleanHeader = strtolower(trim($header));
            if (isset($subjectMap[$cleanHeader])) {
                $subjectColumns[] = [
                    'subject_id' => $subjectMap[$cleanHeader],
                    'index'      => $index,
                ];
            }
        }

        if (empty($subjectColumns)) {
            return response()->json([
                'success' => false,
                'message' => 'No matching subject columns found in CSV headers.'
            ], 422);
        }

        $recordsProcessed = 0;
        $now = now();

        while (($row = fgetcsv($handle)) !== false) {
            $studentNumber = $row[0] ?? null;
            if (!$studentNumber || !StudentInfo::where('student_number', $studentNumber)->exists()) {
                continue;
            }

            foreach ($subjectColumns as $col) {
                $termsRepeated = $row[$col['index']] ?? null;
                if ($termsRepeated !== null && $termsRepeated !== '') {
                    StudentBackSubject::updateOrCreate(
                        [
                            'student_number'     => $studentNumber,
                            'general_subject_id' => $col['subject_id'],
                        ],
                        [
                            'terms_repeated' => (int) $termsRepeated,
                            'date_created'   => $now,
                            'is_active'      => true,
                        ]
                    );
                    $recordsProcessed++;
                }
            }
        }

        fclose($handle);

        return response()->json([
            'success'           => true,
            'message'           => 'Import completed successfully.',
            'records_processed' => $recordsProcessed,
        ]);
    }
}