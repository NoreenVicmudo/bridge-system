<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\Student\StudentInfo;
use App\Models\Academic\StudentGwa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Program;

class GwaController extends Controller
{
    /**
     * Display GWA table for a filtered section.
     */
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

        // Inject names into the filter object so FilterInfoCard can find them
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
        })->with(['college', 'program'])
        ->paginate(10)
        ->withQueryString();

        // Fetch ALL active GWA records for these students (not just the filtered semester)
        $allGwaRecords = StudentGwa::whereIn('student_number', $students->pluck('student_number'))
            ->where('is_active', 1)
            ->get()
            ->groupBy('student_number');

        $students->getCollection()->transform(function ($student) use ($allGwaRecords, $filter, $dbSemester) {
            $studentGwas = $allGwaRecords->get($student->student_number) ?? collect();
            
            // Find the GWA for the specifically filtered semester
            $currentGwa = $studentGwas->where('year_level', $filter['year_level'])
                                    ->where('semester', $dbSemester)
                                    ->first();

            return [
                'id' => $student->student_id,
                'student_number' => $student->student_number,
                'name' => $student->student_lname . ', ' . $student->student_fname,
                'gwa' => $currentGwa ? $currentGwa->gwa : null,
                'all_gwas' => $studentGwas, // Pass the whole collection for the toggle
            ];
        });

        $program = Program::find($filter['program']);
        
        return Inertia::render('Academic/GWAInfo', [
            'students' => $students,
            'filter' => $filter,
            'maxYears' => $program->years ?? 4,
        ]);
    }

    /**
     * Manual update/create GWA for a single student.
     */
    public function update(Request $request, $studentId)
    {
        $validated = $request->validate([
            'student_number' => 'required|exists:student_info,student_number',
            'year_level'     => 'required|integer|min:1|max:6',
            'semester'       => 'required|string', // Changed to string to handle "1ST"/"2ND"
            'gwa'            => 'required|numeric|min:1.0|max:5.0', // Adjust range based on your school's system
        ]);

        // Map the "1ST"/"2ND" from your React form to "1"/"2" for the database
        $semesterMap = [
            '1ST' => '1',
            '2ND' => '2',
            '1'   => '1',
            '2'   => '2',
            'summer' => 'summer'
        ];
        $dbSemester = $semesterMap[$validated['semester']] ?? $validated['semester'];

        $student = StudentInfo::findOrFail($studentId);

        // Update or create the record
        StudentGwa::updateOrCreate(
            [
                'student_number' => $validated['student_number'],
                'year_level'     => $validated['year_level'],
                'semester'       => $dbSemester,
            ],
            [
                'gwa'          => $validated['gwa'],
                'date_created' => now(), // Or use updated_at if your migration has it
                'is_active'    => 1,
            ]
        );

        return redirect()->back()->with('success', 'GWA updated successfully.');
    }

    /**
     * Import CSV with flexible headers.
     */
    public function import(Request $request)
    {
        // Convert JSON string back to array for validation if necessary
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

        // Parse headers to detect GWA columns
        $gwaColumns = [];
        foreach ($headers as $index => $header) {
            // Matches patterns like 1Y-1S, 2Y-2S, 4Y-1S
            if (preg_match('/^(\d+)Y-(\d+)S$/', $header, $matches)) {
                $gwaColumns[] = [
                    'year' => (int)$matches[1], 
                    'semester' => (string)$matches[2], 
                    'index' => $index
                ];
            }
        }

        // 2. Map filters and check program duration
        $filterData = is_string($request->filter) ? json_decode($request->filter, true) : $request->filter;
        $program = Program::find($filterData['program'] ?? null);

        if (!$program) {
            return response()->json(['success' => false, 'message' => 'Invalid program selected.'], 422);
        }

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
        
        while (($row = fgetcsv($handle)) !== false) {
            $studentNumber = $row[0] ?? null;
            if (!$studentNumber) continue;

            // Ensure student exists
            $studentExists = StudentInfo::where('student_number', $studentNumber)->exists();
            if (!$studentExists) continue;

            foreach ($gwaColumns as $col) {
                $gwaValue = $row[$col['index']] ?? null;
                
                if ($gwaValue !== null && $gwaValue !== '') {
                    // Safely update or insert without needing database constraints!
                    StudentGwa::updateOrCreate(
                        [
                            'student_number' => $studentNumber,
                            'year_level'     => $col['year'],
                            'semester'       => $col['semester'],
                        ],
                        [
                            'gwa'          => (float)$gwaValue,
                            'date_created' => $now,
                            'is_active'    => 1,
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

    public function edit(Request $request)
    {
        $studentId = $request->query('student_id');
        $student = StudentInfo::findOrFail($studentId);
        $gwaRecords = StudentGwa::where('student_number', $student->student_number)
                    ->where('is_active', 1)
                    ->get();

        return Inertia::render('Academic/GWAEntry', [
            'student' => $student,
            'gwaRecords' => $gwaRecords,
        ]);
    }

    // Inside App\Http\Controllers\Academic\GwaController.php
    public function export(Request $request)
    {
        $filter = $request->validate([
            'academic_year' => 'required|string',
            'college' => 'required|integer',
            'program' => 'required|integer',
            'year_level' => 'required|integer',
            'semester' => 'required|string',
            'section' => 'required|string',
        ]);

        // 1. Fetch Students (No pagination for export)
        $students = StudentInfo::whereHas('sections', function ($q) use ($filter) {
            $q->where('academic_year', $filter['academic_year'])
            ->where('program_id', $filter['program'])
            ->where('year_level', $filter['year_level'])
            ->where('semester', $filter['semester'])
            ->where('section', $filter['section'])
            ->where('is_active', 1);
        })->get();

        // 2. Fetch all GWA records for these students to avoid N+1 queries
        $gwaRecords = StudentGwa::whereIn('student_number', $students->pluck('student_number'))
            ->where('is_active', 1)
            ->get()
            ->groupBy('student_number');

        $program = Program::find($filter['program']);
        $maxYears = $program->years ?? 4;

        // 3. Prepare CSV Headers
        $headers = ['Student Number', 'Student Name'];
        for ($y = 1; $y <= $maxYears; $y++) {
            $headers[] = "{$y}Y-1S";
            $headers[] = "{$y}Y-2S";
        }

        // 4. Generate CSV Stream
        $callback = function() use ($students, $gwaRecords, $headers, $maxYears) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);

            foreach ($students as $student) {
                $studentGwas = $gwaRecords->get($student->student_number) ?? collect();
                
                $row = [
                    $student->student_number,
                    "{$student->student_lname}, {$student->student_fname}"
                ];

                // Fill GWA columns based on the pattern
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

        $fileName = "GWA_Export_{$filter['section']}_{$filter['academic_year']}.csv";

        return response()->stream($callback, 200, [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ]);
    }
}