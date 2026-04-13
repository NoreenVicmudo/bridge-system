<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\Academic\BoardSubject;
use App\Models\Academic\StudentBoardGrade; 
use App\Models\College;
use App\Models\Program;
use App\Models\Student\StudentInfo;
use App\Services\AuditService;
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

        $boardSubjects = BoardSubject::where('program_id', $filter['program'])
            ->where('is_active', 1)
            ->get();
            
        $subjectHeaders = $boardSubjects->pluck('subject_name')->toArray();

        $query = StudentInfo::whereHas('sections', function ($q) use ($filter) {
            $q->where('academic_year', $filter['academic_year'])
              ->where('program_id', $filter['program'])
              ->where('year_level', $filter['year_level'])
              ->where('semester', $filter['semester'])
              ->where('section', $filter['section'])
              ->where('is_active', 1);
        });

        $search = $request->get('search');
        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $q->where('student_info.student_number', 'LIKE', "%{$search}%")
                  ->orWhereRaw("CONCAT(student_info.student_lname, ', ', student_info.student_fname) LIKE ?", ["%{$search}%"]);
            });
        }

        $sortColumn = $request->get('sort', 'student_info.student_id');
        $sortDirection = $request->get('direction', 'desc');
        $query->orderBy($sortColumn, $sortDirection === 'asc' ? 'asc' : 'desc');

        $students = $query->paginate(10)->withQueryString();

        $grades = StudentBoardGrade::whereIn('student_number', $students->pluck('student_number'))
            ->where('is_active', 1)
            ->get()
            ->groupBy('student_number');

        $students->getCollection()->transform(function ($student) use ($grades, $boardSubjects) {
            $studentGrades = $grades->get($student->student_number) ?? collect();
            
            $gradeMap = [];
            foreach ($boardSubjects as $subject) {
                $record = $studentGrades->where('subject_id', $subject->subject_id)->first();
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
        $programId = $request->query('program_id');

        $student = StudentInfo::findOrFail($studentId);

        // 🔒 THE BOUNCER
        $this->authorizeStudentAccess($request->user(), $student, $programId);

        $targetProgram = $programId ?? $student->activeProgram->first()?->program_id;
        
        $subjects = BoardSubject::where('program_id', $targetProgram)
            ->where('is_active', 1)
            ->get()
            ->map(function ($sub) {
                return ['value' => $sub->subject_id, 'label' => $sub->subject_name];
            });

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
            'subject_grade'  => 'required|numeric|min:0|max:100', 
        ]);

        $student = StudentInfo::findOrFail($studentId);
        
        // Fetch the subject to securely grab its program_id context
        $subject = BoardSubject::findOrFail($validated['subject_id']);

        // 🔒 THE BOUNCER ensures the user can access this specific program's grades
        $this->authorizeStudentAccess($request->user(), $student, $subject->program_id);

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

        // 📝 AUDIT LOG
        AuditService::logStudentAcademic($student->student_number, "Updated Board Grade for {$subject->subject_name}: {$validated['subject_grade']}");

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

        $boardSubjects = BoardSubject::where('program_id', $filter['program'])
            ->where('is_active', 1)
            ->get();

        $students = StudentInfo::whereHas('sections', function ($q) use ($filter) {
            $q->where('academic_year', $filter['academic_year'])
              ->where('program_id', $filter['program'])
              ->where('year_level', $filter['year_level'])
              ->where('semester', $filter['semester'])
              ->where('section', $filter['section'])
              ->where('is_active', 1);
        })->get();

        $grades = StudentBoardGrade::whereIn('student_number', $students->pluck('student_number'))
            ->where('is_active', 1)
            ->get()
            ->groupBy('student_number');

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
        
        if (!$headers) return response()->json(['success' => false, 'message' => 'Empty file'], 422);

        $boardSubjects = BoardSubject::where('program_id', $request->filter['program'])
            ->where('is_active', 1)
            ->get();
            
        $subjectMap = [];
        foreach ($boardSubjects as $sub) {
            $subjectMap[strtolower(trim($sub->subject_name))] = $sub->subject_id;
        }

        $subjectColumns = [];
        foreach ($headers as $index => $header) {
            $cleanHeader = strtolower(trim($header));
            if (isset($subjectMap[$cleanHeader])) {
                $subjectColumns[] = [
                    'subject_id' => $subjectMap[$cleanHeader],
                    'index' => $index
                ];
            }
        }

        if (empty($subjectColumns)) {
            return response()->json(['success' => false, 'message' => 'No matching board subjects found in headers. Ensure your column names match the subjects.'], 422);
        }

        $now = now();
        $recordsProcessed = 0;
        
        $targetProgram = $request->filter['program']; // Make sure you have this variable defined above the loop!

        while (($row = fgetcsv($handle)) !== false) {
            $studentNumber = $row[0] ?? null;
            if (!$studentNumber) continue;

            // 1. Fetch the actual student model
            $student = StudentInfo::where('student_number', $studentNumber)->first();
            if (!$student) continue;

            // 2. 🔒 THE BOUNCER: Test the student against the user's permissions and the target program
            try {
                $this->authorizeStudentAccess($request->user(), $student, $targetProgram);
            } catch (\Exception $e) {
                // If the user doesn't have access, or the student was never in this program, SKIP them!
                continue; 
            }

            foreach ($subjectColumns as $col) {
                $gradeValue = $row[$col['index']] ?? null;
                
                if ($gradeValue !== null && $gradeValue !== '') {
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
                    // 📝 AUDIT LOG PER SUBJECT
                    AuditService::logStudentAcademic($studentNumber, "Imported CSV Board Grade for Subject ID: {$col['subject_id']}");
                    $recordsProcessed++;
                }
            }
        }
        fclose($handle);

        return response()->json(['success' => true, 'message' => 'Import completed successfully.', 'records_processed' => $recordsProcessed]);
    }

    /**
     * Prevent IDOR: Check if the logged-in user is allowed to access this student.
     */
    private function authorizeStudentAccess($user, $student, $requestedProgramId = null)
    {
        if (!$user->college_id && !$user->program_id) return;

        if ($user->college_id) {
            $hasCollegeRecord = $student->programs()
                ->join('programs as p', 'student_programs.program_id', '=', 'p.program_id')
                ->where('p.college_id', $user->college_id)
                ->exists();
            if (!$hasCollegeRecord) abort(403, 'Unauthorized: Student has no historical or active records in your College.');
        }

        if ($user->program_id) {
            $hasProgramRecord = DB::table('student_programs')
                ->where('student_number', $student->student_number)
                ->where('program_id', $user->program_id)
                ->exists();
            if (!$hasProgramRecord) abort(403, 'Unauthorized: Student has no historical or active records in your Program.');
        }

        if ($requestedProgramId) {
            $isValidRequest = DB::table('student_programs')
                ->where('student_number', $student->student_number)
                ->where('program_id', $requestedProgramId)
                ->exists();
            if (!$isValidRequest) abort(404, 'Invalid Context: Student has never been enrolled in the requested program.');
        }
    }
}