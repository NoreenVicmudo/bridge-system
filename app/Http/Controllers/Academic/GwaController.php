<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\Academic\StudentGwa;
use App\Models\Program;
use App\Models\Student\StudentInfo;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class GwaController extends Controller
{
    public function index(Request $request)
    {
        $filter = $request->validate([
            'academic_year' => 'required|string',
            'college' => 'required|integer',
            'program' => 'required|integer',
            'year_level' => 'required|integer',
            'semester' => 'required|string',
            'section' => 'required|string',
        ]);

        $college = \App\Models\College::where('college_id', $filter['college'])->first();
        $program = \App\Models\Program::where('program_id', $filter['program'])->first();

        $filter['college_name'] = $college ? $college->name : 'N/A';
        $filter['program_name'] = $program ? $program->name : 'N/A';

        $semesterMap = ['1st' => '1', '2nd' => '2', 'summer' => 'summer'];
        $dbSemester = $semesterMap[$filter['semester']] ?? $filter['semester'];

        $students = StudentInfo::whereHas('sections', function ($q) use ($filter) {
            $q->where('academic_year', $filter['academic_year'])
                ->where('program_id', $filter['program'])
                ->where('year_level', $filter['year_level'])
                ->where('semester', $filter['semester'])
                ->where('section', $filter['section'])
                ->where('is_active', 1);
        })
        ->paginate(10)
        ->withQueryString();

        $allGwaRecords = StudentGwa::whereIn('student_number', $students->pluck('student_number'))
            ->where('is_active', 1)
            ->get()
            ->groupBy('student_number');

        $students->getCollection()->transform(function ($student) use ($allGwaRecords, $filter, $dbSemester) {
            $studentGwas = $allGwaRecords->get($student->student_number) ?? collect();
            
            $currentGwa = $studentGwas->where('year_level', $filter['year_level'])
                                    ->where('semester', $dbSemester)
                                    ->first();

            return [
                'id' => $student->student_id,
                'student_number' => $student->student_number,
                'name' => $student->student_lname . ', ' . $student->student_fname,
                'gwa' => $currentGwa ? $currentGwa->gwa : null,
                'all_gwas' => $studentGwas, 
            ];
        });

        $program = Program::find($filter['program']);
        
        return Inertia::render('Academic/GWAInfo', [
            'students' => $students,
            'filter' => $filter,
            'maxYears' => $program->years ?? 4,
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

        $gwaRecords = StudentGwa::where('student_number', $student->student_number)
                    ->where('program_id', $targetProgram) // Fetch historical GWA!
                    ->where('is_active', 1)
                    ->get();

        return Inertia::render('Academic/GWAEntry', [
            'student' => $student,
            'gwaRecords' => $gwaRecords,
        ]);
    }

    public function update(Request $request, $studentId)
    {
        $validated = $request->validate([
            'student_number' => 'required|exists:student_info,student_number',
            'year_level'     => 'required|integer|min:1|max:6',
            'semester'       => 'required|string', 
            'gwa'            => 'required|numeric|min:1.0|max:5.0', 
            'program_id'     => 'nullable|integer' 
        ]);

        $semesterMap = ['1ST' => '1', '2ND' => '2', '1' => '1', '2' => '2', 'summer' => 'summer'];
        $dbSemester = $semesterMap[$validated['semester']] ?? $validated['semester'];

        $student = StudentInfo::findOrFail($studentId);
        
        $targetProgram = $validated['program_id'] ?? $student->activeProgram->first()?->program_id;

        // 🔒 THE BOUNCER
        $this->authorizeStudentAccess($request->user(), $student, $targetProgram);

        StudentGwa::updateOrCreate(
            [
                'student_number' => $validated['student_number'],
                'year_level'     => $validated['year_level'],
                'semester'       => $dbSemester,
                'program_id'     => $targetProgram
            ],
            ['gwa' => $validated['gwa'], 'date_created' => now(), 'is_active' => 1]
        );

        // 📝 AUDIT LOG
        AuditService::logStudentAcademic($student->student_number, "Updated GWA for Year {$validated['year_level']} Sem {$dbSemester}: {$validated['gwa']}");

        return redirect()->back()->with('success', 'GWA updated successfully.');
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

        $gwaColumns = [];
        foreach ($headers as $index => $header) {
            if (preg_match('/^(\d+)Y-(\d+)S$/', $header, $matches)) {
                $gwaColumns[] = [
                    'year' => (int)$matches[1], 
                    'semester' => (string)$matches[2], 
                    'index' => $index
                ];
            }
        }

        $filterData = is_string($request->filter) ? json_decode($request->filter, true) : $request->filter;
        $program = Program::find($filterData['program'] ?? null);

        if (!$program) return response()->json(['success' => false, 'message' => 'Invalid program selected.'], 422);

        $maxYears = $program->years ?? 4;

        $invalidYears = collect($gwaColumns)->filter(fn($col) => $col['year'] > $maxYears);
        if ($invalidYears->isNotEmpty()) {
            return response()->json([
                'success' => false,
                'message' => "Years exceed program duration (max {$maxYears}): " . $invalidYears->pluck('year')->implode(', ')
            ], 422);
        }

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

            foreach ($gwaColumns as $col) {
                $gwaValue = $row[$col['index']] ?? null;
                
                if ($gwaValue !== null && $gwaValue !== '') {
                    StudentGwa::updateOrCreate(
                        [
                            'student_number' => $studentNumber,
                            'year_level'     => $col['year'],
                            'semester'       => $col['semester'],
                            'program_id'     => $filterData['program']
                        ],
                        [
                            'gwa'          => (float)$gwaValue,
                            'date_created' => $now,
                            'is_active'    => 1,
                        ]
                    );
                    // 📝 AUDIT LOG
                    AuditService::logStudentAcademic($studentNumber, "Imported CSV GWA for Y{$col['year']} S{$col['semester']}");
                    $recordsProcessed++;
                }
            }
        }
        fclose($handle);

        return response()->json(['success' => true, 'message' => 'Import completed successfully.', 'records_processed' => $recordsProcessed]);
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

        $students = StudentInfo::whereHas('sections', function ($q) use ($filter) {
            $q->where('academic_year', $filter['academic_year'])->where('program_id', $filter['program'])
            ->where('year_level', $filter['year_level'])->where('semester', $filter['semester'])
            ->where('section', $filter['section'])->where('is_active', 1);
        })->orderBy($sortColumn, $sortDirection)->get();

        $gwaRecords = StudentGwa::whereIn('student_number', $students->pluck('student_number'))
            ->where('program_id', $filter['program'])->where('is_active', 1)->get()->groupBy('student_number');

        $program = Program::find($filter['program']);
        $maxYears = $program->years ?? 4;

        $headers = ['Student Number', 'Student Name'];
        for ($y = 1; $y <= $maxYears; $y++) {
            $headers[] = "{$y}Y-1S";
            $headers[] = "{$y}Y-2S";
        }

        $callback = function() use ($students, $gwaRecords, $headers, $maxYears) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);
            foreach ($students as $student) {
                $studentGwas = $gwaRecords->get($student->student_number) ?? collect();
                $row = [$student->student_number, "{$student->student_lname}, {$student->student_fname}"];
                for ($y = 1; $y <= $maxYears; $y++) {
                    foreach (['1', '2'] as $sem) {
                        $record = $studentGwas->where('year_level', $y)->where('semester', $sem)->first();
                        $row[] = $record ? $record->gwa : '';
                    }
                }
                fputcsv($file, $row);
            }
            fclose($file);
        };

        $timestamp = now()->format('Y-m-d_H-i');
        $fileName = "GWA_{$filter['section']}_{$timestamp}.csv";

        return response()->stream($callback, 200, [
            "Content-type" => "text/csv", "Content-Disposition" => "attachment; filename=\"{$fileName}\"",
            "Pragma" => "no-cache", "Cache-Control" => "must-revalidate, post-check=0, pre-check=0", "Expires" => "0"
        ]);
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