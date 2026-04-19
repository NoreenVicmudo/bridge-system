<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\Academic\GeneralSubject;
use App\Models\Academic\StudentBackSubject;
use App\Models\College;
use App\Models\Program;
use App\Models\Student\StudentInfo;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BackSubjectsController extends Controller
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
        });

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
            'students' => $students,
            'subjects' => $subjectHeaders,
            'filter'   => $filter,
            'search'   => $request->search ?? '',
            'sort'     => $sortColumn,
            'direction'=> $sortDirection,
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

        $subjectOptions = GeneralSubject::where('program_id', $targetProgram)
            ->where('is_active', 1)
            ->get()
            ->map(fn($subj) => [
                'value' => $subj->general_subject_id,
                'label' => $subj->general_subject_name,
            ]);

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

    public function update(Request $request, $studentId)
    {
        $validated = $request->validate([
            'student_number'      => 'required|exists:student_info,student_number',
            'general_subject_id'  => 'required|integer|exists:general_subjects,general_subject_id',
            'terms_repeated'      => 'required|integer|min:0',
        ]);

        $student = StudentInfo::findOrFail($studentId);
        
        // 1. Fetch the subject to find out what Program it belongs to
        $subject = GeneralSubject::findOrFail($validated['general_subject_id']);

        // 2. 🔒 THE BOUNCER: Check if the student has EVER been in that program!
        $this->authorizeStudentAccess($request->user(), $student, $subject->program_id);

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
        // 📝 AUDIT LOG
        AuditService::logStudentAcademic($student->student_number, "Updated Retake Count for {$subject->general_subject_name}: {$validated['terms_repeated']} times");

        return redirect()->back()->with('success', 'Retake count updated successfully.');
    }

    public function export(Request $request)
    {
        $filter = $request->validate([
            'academic_year' => 'required|string', 'college' => 'required|integer', 'program' => 'required|integer',
            'year_level' => 'required|integer', 'semester' => 'required|string', 'section' => 'required|string',
        ]);

        $sortColumn = $request->get('sort', 'student_info.student_id');
        $sortDirection = $request->get('direction', 'asc');
        $sortColumn = $sortColumn === 'name' ? 'student_info.student_lname' : $sortColumn;

        $subjects = GeneralSubject::where('program_id', $filter['program'])->where('is_active', 1)->get();

        $students = StudentInfo::whereHas('sections', function ($q) use ($filter) {
            $q->where('academic_year', $filter['academic_year'])->where('program_id', $filter['program'])
                ->where('year_level', $filter['year_level'])->where('semester', $filter['semester'])
                ->where('section', $filter['section'])->where('is_active', 1);
        })->orderBy($sortColumn, $sortDirection)->get();

        $retakes = StudentBackSubject::whereIn('student_number', $students->pluck('student_number'))
            ->where('is_active', 1)->get()->groupBy('student_number');

        $headers = ['Student Number', 'Student Name'];
        foreach ($subjects as $subject) $headers[] = $subject->general_subject_name;

        $callback = function () use ($students, $retakes, $subjects, $headers) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);
            foreach ($students as $student) {
                $studentRetakes = $retakes->get($student->student_number) ?? collect();
                $row = [$student->student_number, "{$student->student_lname}, {$student->student_fname}"];
                foreach ($subjects as $subject) {
                    $record = $studentRetakes->firstWhere('general_subject_id', $subject->general_subject_id);
                    $row[] = $record ? $record->terms_repeated : 0;
                }
                fputcsv($file, $row);
            }
            fclose($file);
        };

        $timestamp = now()->format('Y-m-d_H-i');
        $fileName = "Retakes_{$filter['section']}_{$timestamp}.csv";

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv', 'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache', 'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0', 'Expires' => '0',
        ]);
    }

    public function import(Request $request)
    {
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
        if (!$headers) return response()->json(['success' => false, 'message' => 'Empty file'], 422);

        $subjects = GeneralSubject::where('program_id', $request->filter['program'])
            ->where('is_active', 1)
            ->get();

        $subjectMap = [];
        foreach ($subjects as $subject) {
            $subjectMap[strtolower(trim($subject->general_subject_name))] = $subject->general_subject_id;
        }

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

        if (empty($subjectColumns)) return response()->json(['success' => false, 'message' => 'No matching subject columns found in CSV headers.'], 422);

        $recordsProcessed = 0;
        $now = now();

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
                    // 📝 AUDIT LOG
                    AuditService::logStudentAcademic($studentNumber, "Imported CSV Retake count for Subject ID: {$col['subject_id']}");
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