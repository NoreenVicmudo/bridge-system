<?php

namespace App\Http\Controllers\Program;

use App\Http\Controllers\Controller;
use App\Models\College;
use App\Models\Program;
use App\Models\ProgramMetric\BoardBatch;
use App\Models\ProgramMetric\StudentLicensureExam;
use App\Models\Student\StudentInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LicensureExamController extends Controller
{
    /**
     * Display the filtered list of students and their licensure results.
     */
    public function index(Request $request)
    {
        // 1. Parameter Matching (Handles various frontend naming conventions)
        $college = $request->input('college') ?? $request->input('batch_college');
        $program = $request->input('program') ?? $request->input('batch_program');
        $year = $request->input('calendar_year') ?? $request->input('batch_year');
        $batchNumber = $request->input('batch_number') ?? $request->input('board_batch');

        // Return empty state if no filters are active
        if (!$college || !$program || !$year || !$batchNumber) {
            return Inertia::render('Program/LicensureExam', [
                'students' => ['data' => [], 'links' => []],
                'filter' => $request->all(),
                'dbColleges' => College::where('is_active', 1)->get()->map(fn($c) => ['value' => $c->college_id, 'label' => $c->name]),
                'dbPrograms' => Program::where('is_active', 1)->get(),
            ]);
        }

        // 2. Build the Base Query
        $query = StudentInfo::query()
            ->join('board_batch', 'student_info.student_number', '=', 'board_batch.student_number')
            ->leftJoin('student_licensure_exam', function($join) {
                $join->on('board_batch.batch_id', '=', 'student_licensure_exam.batch_id')
                     ->where('student_licensure_exam.is_active', 1);
            })
            ->where('student_info.is_active', 1)
            ->where('board_batch.is_active', 1)
            ->where('student_info.college_id', $college)
            ->where('student_info.program_id', $program)
            ->where('board_batch.year', $year)
            ->where('board_batch.batch_number', $batchNumber)
            ->select(
                'board_batch.batch_id',
                'student_info.student_number',
                'student_info.student_lname',
                'student_info.student_fname',
                'student_licensure_exam.exam_result',
                'student_licensure_exam.exam_date_taken'
            );

        // 3. Apply Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('student_info.student_number', 'LIKE', "%{$search}%")
                  ->orWhereRaw("CONCAT(student_info.student_lname, ', ', student_info.student_fname) LIKE ?", ["%{$search}%"]);
            });
        }

        // 4. Strict Sort Whitelist (Prevents SQL Ambiguity and Crashes)
        $rawSort = $request->get('sort');
        $allowedSorts = [
            'student_info.student_number', 
            'student_info.student_lname', 
            'student_licensure_exam.exam_result'
        ];
        
        $sortColumn = in_array($rawSort, $allowedSorts) ? $rawSort : 'student_info.student_lname';
        $sortDirection = $request->get('direction', 'asc') === 'desc' ? 'desc' : 'asc';

        $batches = $query->orderBy($sortColumn, $sortDirection)->paginate(15)->withQueryString();

        // 5. Transform Data for Frontend
        $batches->getCollection()->transform(fn($s) => [
            'batch_id' => $s->batch_id,
            'student_number' => $s->student_number,
            'name' => "{$s->student_lname}, {$s->student_fname}",
            'status' => $s->exam_result ?? '—',
            'exam_date' => $s->exam_date_taken ? \Carbon\Carbon::parse($s->exam_date_taken)->format('M d, Y') : '—',
        ]);

        return Inertia::render('Program/LicensureExam', [
            'students' => $batches,
            'filter' => [
                'college' => $college, 
                'program' => $program, 
                'calendar_year' => $year, 
                'batch_number' => $batchNumber
            ],
            'dbColleges' => College::where('is_active', 1)->get()->map(fn($c) => ['value' => $c->college_id, 'label' => $c->name]),
            'dbPrograms' => Program::where('is_active', 1)->get(),
        ]);
    }

    /**
     * Show entry page for a specific student licensure result.
     */
    public function edit(Request $request, $batchId = null)
    {
        // Logic to handle Manual Search (via student_number) if ID is missing
        if (!$batchId) {
            $studentNum = $request->query('student_number');
            $year = $request->query('calendar_year') ?? $request->query('batch_year');
            $batchNum = $request->query('batch_number') ?? $request->query('board_batch');

            $batchRecord = DB::table('board_batch')
                ->where('student_number', $studentNum)
                ->where('year', $year)
                ->where('batch_number', $batchNum)
                ->first();

            if (!$batchRecord) {
                return redirect()->back()->with('error', 'Student not found in this batch.');
            }
            $batchId = $batchRecord->batch_id;
        }

        $student = DB::table('board_batch')
            ->join('student_info', 'board_batch.student_number', '=', 'student_info.student_number')
            ->leftJoin('student_licensure_exam', 'board_batch.batch_id', '=', 'student_licensure_exam.batch_id')
            ->where('board_batch.batch_id', $batchId)
            ->select(
                'board_batch.batch_id', 
                'student_info.student_number', 
                'student_info.student_lname as lname', 
                'student_info.student_fname as fname', 
                'student_licensure_exam.exam_result', 
                'student_licensure_exam.exam_date_taken'
            )
            ->firstOrFail();

        return Inertia::render('Program/LicensureEntry', ['student' => $student]);
    }

    /**
     * Update or create the licensure record.
     */
    public function update(Request $request, $batchId)
    {
        $validated = $request->validate([
            'exam_result' => 'required|in:PASSED,FAILED,N/A',
            'exam_date_taken' => 'nullable|date',
        ]);

        StudentLicensureExam::updateOrCreate(
            ['batch_id' => $batchId],
            array_merge($validated, [
                'is_active' => 1, 
                'date_created' => now()
            ])
        );

        return redirect()->back()->with('success', 'Licensure result updated successfully.');
    }

    /**
     * Export the current filtered list to CSV.
     */
    public function export(Request $request)
    {
        $college = $request->input('college') ?? $request->input('batch_college');
        $program = $request->input('program') ?? $request->input('batch_program');
        $year = $request->input('calendar_year') ?? $request->input('batch_year');
        $batchNumber = $request->input('batch_number') ?? $request->input('board_batch');

        $batches = StudentInfo::query()
            ->join('board_batch', 'student_info.student_number', '=', 'board_batch.student_number')
            ->leftJoin('student_licensure_exam', 'board_batch.batch_id', '=', 'student_licensure_exam.batch_id')
            ->where('student_info.college_id', $college)
            ->where('student_info.program_id', $program)
            ->where('board_batch.year', $year)
            ->where('board_batch.batch_number', $batchNumber)
            ->select('student_info.student_number', 'student_info.student_lname', 'student_info.student_fname', 'student_licensure_exam.exam_result', 'student_licensure_exam.exam_date_taken')
            ->get();

        $headers = ['Student Number', 'Student Name', 'Result', 'Date Taken'];

        $callback = function() use ($batches, $headers) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);
            foreach ($batches as $b) {
                fputcsv($file, [
                    $b->student_number,
                    "{$b->student_lname}, {$b->student_fname}",
                    $b->exam_result ?? 'N/A',
                    $b->exam_date_taken ?? 'N/A'
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, [
            "Content-type" => "text/csv", 
            "Content-Disposition" => "attachment; filename=Licensure_Results_{$year}_B{$batchNumber}.csv"
        ]);
    }

    /**
     * Import results via CSV.
     */
    public function import(Request $request)
    {
        if (is_string($request->filter)) $request->merge(['filter' => json_decode($request->filter, true)]);
        
        $request->validate(['file' => 'required|file|mimes:csv,txt', 'filter' => 'required|array']);

        $year = $request->input('filter.calendar_year') ?? $request->input('filter.batch_year');
        $batchNumber = $request->input('filter.batch_number') ?? $request->input('filter.board_batch');

        $handle = fopen($request->file('file')->getRealPath(), 'r');
        fgetcsv($handle); // Skip headers
        
        $count = 0;
        while (($row = fgetcsv($handle)) !== false) {
            $studentNumber = $row[0] ?? null;
            $result = strtoupper($row[2] ?? '');
            $date = $row[3] ?? null;

            if (!$studentNumber || !in_array($result, ['PASSED', 'FAILED', 'N/A'])) continue;

            $batch = BoardBatch::where('student_number', $studentNumber)
                ->where('year', $year)
                ->where('batch_number', $batchNumber)
                ->first();
            
            if ($batch) {
                StudentLicensureExam::updateOrCreate(
                    ['batch_id' => $batch->batch_id],
                    ['exam_result' => $result, 'exam_date_taken' => $date, 'is_active' => 1, 'date_created' => now()]
                );
                $count++;
            }
        }
        fclose($handle);

        return response()->json(['success' => true, 'message' => "Imported {$count} records."]);
    }
}