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

        // Map semester from UI format to DB format
        $semesterMap = ['1st' => '1', '2nd' => '2', 'summer' => 'summer'];
        $dbSemester = $semesterMap[$filter['semester']] ?? $filter['semester'];

        // Get students in that section
        $students = StudentInfo::whereHas('sections', function ($q) use ($filter) {
            $q->where('academic_year', $filter['academic_year'])
            ->where('program_id', $filter['program'])
            ->where('year_level', $filter['year_level'])
            ->where('semester', $filter['semester'])
            ->where('section', $filter['section'])
            ->where('is_active', 1);
        })->with(['college', 'program'])->get();

        // Load GWA for the specific year_level and semester (mapped)
        $gwaRecords = StudentGwa::whereIn('student_number', $students->pluck('student_number'))
            ->where('year_level', $filter['year_level'])
            ->where('semester', $dbSemester)
            ->where('is_active', 1)
            ->get()
            ->keyBy('student_number');

        $studentList = $students->map(function ($student) use ($gwaRecords) {
            $record = $gwaRecords->get($student->student_number);
            return [
                'id' => $student->student_id,
                'student_number' => $student->student_number,
                'name' => $student->student_lname . ', ' . $student->student_fname . ($student->student_mname ? ' ' . substr($student->student_mname, 0, 1) . '.' : ''),
                'gwa' => $record ? $record->gwa : null,
            ];
        });

        $program = Program::find($filter['program']);
        $maxYears = $program->years ?? 4;

        return Inertia::render('Academic/GWAInfo', [
            'students' => $studentList,
            'filter' => $filter,
            'maxYears' => $maxYears,
        ]);
    }

    /**
     * Manual update/create GWA for a single student.
     */
    public function update(Request $request, $studentId)
    {
        $validated = $request->validate([
            'student_number' => 'required|exists:student_info,student_number',
            'year_level' => 'required|integer|min:1|max:6',
            'semester' => 'required|in:1,2,summer',
            'gwa' => 'required|numeric|min:0|max:100',
        ]);

        $student = StudentInfo::findOrFail($studentId);
        if ($student->student_number !== $validated['student_number']) {
            return back()->withErrors(['student_number' => 'Mismatch']);
        }

        StudentGwa::updateOrCreate(
            [
                'student_number' => $validated['student_number'],
                'year_level' => $validated['year_level'],
                'semester' => $validated['semester'],
            ],
            [
                'gwa' => $validated['gwa'],
                'date_created' => now(),
                'is_active' => 1,
            ]
        );

        return redirect()->back()->with('success', 'GWA updated successfully.');
    }

    /**
     * Import CSV with flexible headers.
     */
    public function import(Request $request)
    {
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
            // Patterns: 1Y_1Sem, 2Y_2Sem, Y1_S1, Y2_S2, 1Y_1S, etc.
            if (preg_match('/^(\d+)Y_(\d+)Sem$/', $header, $matches)) {
                $gwaColumns[] = ['year' => (int)$matches[1], 'semester' => (string)$matches[2], 'index' => $index];
            } elseif (preg_match('/^Y(\d+)_S(\d+)$/', $header, $matches)) {
                $gwaColumns[] = ['year' => (int)$matches[1], 'semester' => (string)$matches[2], 'index' => $index];
            } elseif (preg_match('/^(\d+)Y_(\d+)S$/', $header, $matches)) {
                $gwaColumns[] = ['year' => (int)$matches[1], 'semester' => (string)$matches[2], 'index' => $index];
            }
        }

        if (empty($gwaColumns)) {
            return response()->json(['success' => false, 'message' => 'No valid GWA columns found. Expected patterns: 1Y_1Sem, Y1_S1, 1Y_1S'], 422);
        }

        $program = Program::find($request->filter['program']);
        $maxYears = $program->years ?? 4;
        $invalidYears = collect($gwaColumns)->filter(fn($col) => $col['year'] > $maxYears);
        if ($invalidYears->isNotEmpty()) {
            return response()->json([
                'success' => false,
                'message' => "Years exceed program duration (max {$maxYears}): " . $invalidYears->pluck('year')->implode(', ')
            ], 422);
        }

        $rows = [];
        $now = now();
        while (($row = fgetcsv($handle)) !== false) {
            $studentNumber = $row[0] ?? null;
            if (!$studentNumber) continue;

            $student = StudentInfo::where('student_number', $studentNumber)->first();
            if (!$student) continue; // skip non-existent students

            foreach ($gwaColumns as $col) {
                $gwaValue = $row[$col['index']] ?? null;
                if ($gwaValue !== null && $gwaValue !== '') {
                    $rows[] = [
                        'student_number' => $studentNumber,
                        'year_level' => $col['year'],
                        'semester' => $col['semester'],
                        'gwa' => (float)$gwaValue,
                        'date_created' => $now,
                        'is_active' => 1,
                    ];
                }
            }
        }
        fclose($handle);

        if (!empty($rows)) {
            // Use upsert: unique on (student_number, year_level, semester)
            DB::table('student_gwa')->upsert(
                $rows,
                ['student_number', 'year_level', 'semester'],
                ['gwa', 'date_created', 'is_active']
            );
        }

        return response()->json(['success' => true, 'message' => 'Import completed', 'records_processed' => count($rows)]);
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
}