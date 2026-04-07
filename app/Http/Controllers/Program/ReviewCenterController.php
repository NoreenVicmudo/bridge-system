<?php

namespace App\Http\Controllers\Program;

use App\Http\Controllers\Controller;
use App\Models\College;
use App\Models\Program;
use App\Models\Student\StudentInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReviewCenterController extends Controller
{
    public function index(Request $request)
    {
        // 1. Parameter Matching
        $college = $request->input('college') ?? $request->input('batch_college');
        $program = $request->input('program') ?? $request->input('batch_program');
        $year = $request->input('calendar_year') ?? $request->input('batch_year');
        $batchNumber = $request->input('batch_number') ?? $request->input('board_batch');

        // If no filter, return empty state
        if (!$college || !$program || !$year || !$batchNumber) {
            return Inertia::render('Program/ReviewCenter', [
                'students' => ['data' => [], 'links' => []],
                'filter' => $request->all(),
                'dbColleges' => College::where('is_active', 1)->get()->map(fn($c) => ['value' => $c->college_id, 'label' => $c->name]),
                'dbPrograms' => Program::where('is_active', 1)->get(),
            ]);
        }

        // 2. Query Students + Left Join their Review Center
        $query = StudentInfo::query()
            ->join('board_batch', 'student_info.student_number', '=', 'board_batch.student_number')
            ->leftJoin('student_review_center', function($join) {
                $join->on('board_batch.batch_id', '=', 'student_review_center.batch_id')
                     ->where('student_review_center.is_active', 1);
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
                'student_review_center.review_center'
            );

        // 3. Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('student_info.student_number', 'LIKE', "%{$search}%")
                  ->orWhereRaw("CONCAT(student_info.student_lname, ', ', student_info.student_fname) LIKE ?", ["%{$search}%"])
                  ->orWhere('student_review_center.review_center', 'LIKE', "%{$search}%");
            });
        }

        // 4. Strict Sort Whitelist
        $rawSort = $request->get('sort');
        if ($rawSort && str_starts_with($rawSort, 'si.')) {
            $rawSort = str_replace('si.', 'student_info.', $rawSort);
        }

        $allowedSorts = [
            'student_info.student_number',
            'student_info.student_lname',
            'student_review_center.review_center'
        ];

        $sortColumn = in_array($rawSort, $allowedSorts) ? $rawSort : 'student_info.student_lname';
        $sortDirection = $request->get('direction', 'asc') === 'desc' ? 'desc' : 'asc';

        $query->orderBy($sortColumn, $sortDirection);

        // 5. Paginate and Format
        $batches = $query->paginate(15)->withQueryString();

        $batches->getCollection()->transform(function ($student) {
            return [
                'batch_id'       => $student->batch_id,
                'student_number' => $student->student_number,
                'name'           => "{$student->student_lname}, {$student->student_fname}",
                'review_center'  => $student->review_center ?? '—',
            ];
        });

        $activeFilter = [
            'college' => $college, 'program' => $program, 
            'calendar_year' => $year, 'batch_number' => $batchNumber
        ];

        return Inertia::render('Program/ReviewCenter', [
            'students'   => $batches,
            'filter'     => $activeFilter,
            'search'     => $request->search ?? '',
            'sort'       => $sortColumn,
            'direction'  => $sortDirection,
            'dbColleges' => College::where('is_active', 1)->get()->map(fn($c) => ['value' => $c->college_id, 'label' => $c->name]),
            'dbPrograms' => Program::where('is_active', 1)->get(),
        ]);
    }

    public function edit(Request $request, $batchId = null)
    {
        // If no ID is in the URL segment, check the query string
        if (!$batchId) {
            $batchId = $request->query('batch_id');
        }

        // If still no ID, use the student_number + batch filters lookup
        if (!$batchId) {
            $studentNum = $request->query('student_number');
            $year = $request->query('calendar_year') ?? $request->query('batch_year');
            $batchNum = $request->query('batch_number') ?? $request->query('board_batch');

            $batchRecord = DB::table('board_batch')
                ->where('student_number', $studentNum)
                ->where('year', $year)
                ->where('batch_number', $batchNum)
                ->where('is_active', 1)
                ->first();

            if (!$batchRecord) {
                // Instead of aborting, redirect back with an error so they stay on the filter page
                return redirect()->back()->with('error', 'Student not found in the selected board batch.');
            }
            
            $batchId = $batchRecord->batch_id;
        }

        // Standard fetch using batch_id
        $student = DB::table('board_batch')
            ->join('student_info', 'board_batch.student_number', '=', 'student_info.student_number')
            ->leftJoin('student_review_center', function($join) {
                $join->on('board_batch.batch_id', '=', 'student_review_center.batch_id')
                    ->where('student_review_center.is_active', 1);
            })
            ->where('board_batch.batch_id', $batchId)
            ->select(
                'board_batch.batch_id',
                'student_info.student_number',
                'student_info.student_lname as lname',
                'student_info.student_fname as fname',
                'student_review_center.review_center'
            )
            ->firstOrFail();

        return Inertia::render('Program/ReviewCenterEntry', ['student' => $student]);
    }

    public function update(Request $request, $batchId)
    {
        $validated = $request->validate([
            'review_center' => 'required|string|max:100',
        ]);

        DB::table('student_review_center')->updateOrInsert(
            ['batch_id' => $batchId],
            [
                'review_center' => $validated['review_center'],
                'is_active' => 1,
                'date_created' => now()
            ]
        );

        // Flash message for the UI
        return redirect()->back()->with('success', 'Review Center successfully updated!');
    }

    public function export(Request $request)
    {
        $college = $request->input('college') ?? $request->input('batch_college');
        $program = $request->input('program') ?? $request->input('batch_program');
        $year = $request->input('calendar_year') ?? $request->input('batch_year');
        $batchNumber = $request->input('batch_number') ?? $request->input('board_batch');

        $batches = StudentInfo::query()
            ->join('board_batch', 'student_info.student_number', '=', 'board_batch.student_number')
            ->leftJoin('student_review_center', function($join) {
                $join->on('board_batch.batch_id', '=', 'student_review_center.batch_id')
                     ->where('student_review_center.is_active', 1);
            })
            ->where('student_info.is_active', 1)
            ->where('board_batch.is_active', 1)
            ->where('student_info.college_id', $college)
            ->where('student_info.program_id', $program)
            ->where('board_batch.year', $year)
            ->where('board_batch.batch_number', $batchNumber)
            ->select('student_info.student_number', 'student_info.student_lname', 'student_info.student_fname', 'student_review_center.review_center')
            ->orderBy('student_info.student_lname', 'asc')
            ->get();

        $headers = ['Student Number', 'Student Name', 'Review Center'];

        $callback = function() use ($batches, $headers) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);
            foreach ($batches as $batch) {
                fputcsv($file, [
                    $batch->student_number,
                    "{$batch->student_lname}, {$batch->student_fname}",
                    $batch->review_center ?? ''
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, [
            "Content-type" => "text/csv", 
            "Content-Disposition" => "attachment; filename=ReviewCenter_Export_{$year}_Batch{$batchNumber}.csv"
        ]);
    }

    public function import(Request $request)
    {
        // Decode filter context from frontend
        if (is_string($request->filter)) {
            $request->merge(['filter' => json_decode($request->filter, true)]);
        }
        
        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
            'filter' => 'required|array'
        ]);

        $year = $request->input('filter.calendar_year') ?? $request->input('filter.batch_year');
        $batchNumber = $request->input('filter.batch_number') ?? $request->input('filter.board_batch');

        $handle = fopen($request->file('file')->getRealPath(), 'r');
        $headers = fgetcsv($handle); // Skip header row
        
        $recordsProcessed = 0;
        $now = now();

        while (($row = fgetcsv($handle)) !== false) {
            $studentNumber = $row[0] ?? null;
            $reviewCenter = $row[2] ?? null; // Assuming format: ID, Name, Center

            if (!$studentNumber || !$reviewCenter) continue;

            // Find the batch_id for this specific student in this specific board batch
            $batch = DB::table('board_batch')
                ->where('student_number', $studentNumber)
                ->where('year', $year)
                ->where('batch_number', $batchNumber)
                ->first();
            
            if ($batch) {
                DB::table('student_review_center')->updateOrInsert(
                    ['batch_id' => $batch->batch_id],
                    [
                        'review_center' => trim($reviewCenter),
                        'is_active' => 1,
                        'date_created' => $now
                    ]
                );
                $recordsProcessed++;
            }
        }
        fclose($handle);

        return response()->json(['success' => true, 'message' => "Successfully imported {$recordsProcessed} review centers."]);
    }
}