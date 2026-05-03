<?php

namespace App\Http\Controllers\Program;

use App\Http\Controllers\Controller;
use App\Models\College;
use App\Models\Program;
use App\Models\ProgramMetric\BoardBatch;
use App\Models\Student\StudentInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Services\AuditService;

class ReviewCenterController extends Controller
{
    public function index(Request $request)
    {
        $college = $request->input('college') ?? $request->input('batch_college');
        $program = $request->input('program') ?? $request->input('batch_program');
        $year = $request->input('calendar_year') ?? $request->input('batch_year');
        $batchNumber = $request->input('batch_number') ?? $request->input('board_batch');

        if (!$college || !$program || !$year || !$batchNumber) {
            return Inertia::render('Program/ReviewCenter', [
                'students' => ['data' => [], 'links' => []], 'filter' => $request->all(),
                'dbColleges' => College::where('is_active', 1)->get()->map(fn($c) => ['value' => $c->college_id, 'label' => $c->name]),
                'dbPrograms' => Program::where('is_active', 1)->get(),
            ]);
        }

        $query = StudentInfo::query()
            ->join('board_batch', 'student_info.student_number', '=', 'board_batch.student_number')
            ->join('programs', 'board_batch.program_id', '=', 'programs.program_id')
            ->leftJoin('student_review_center', function($join) {
                $join->on('board_batch.batch_id', '=', 'student_review_center.batch_id')
                     ->where('student_review_center.is_active', 1);
            })
            ->where('student_info.is_active', 1)->where('board_batch.is_active', 1)
            ->where('programs.college_id', $college)->where('board_batch.program_id', $program)
            ->where('board_batch.year', $year)->where('board_batch.batch_number', $batchNumber)
            ->select('board_batch.batch_id', 'student_info.student_number', 'student_info.student_lname', 'student_info.student_fname', 'student_review_center.review_center');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('student_info.student_number', 'LIKE', "%{$search}%")
                  ->orWhereRaw("CONCAT(student_info.student_lname, ', ', student_info.student_fname) LIKE ?", ["%{$search}%"])
                  ->orWhere('student_review_center.review_center', 'LIKE', "%{$search}%");
            });
        }

        // 🧠 SORTING ENGINE
        $rawSort = $request->get('sort', 'student_info.student_lname');
        $cleanSortColumn = explode('?', $rawSort)[0];
        $sortDirection = $request->get('direction', 'asc') === 'desc' ? 'desc' : 'asc';
        
        $allowedSorts = ['student_info.student_number', 'student_info.student_lname', 'student_review_center.review_center'];
        if (in_array($cleanSortColumn, $allowedSorts)) {
            $query->orderBy($cleanSortColumn, $sortDirection);
        } else {
            $query->orderBy('student_info.student_lname', $sortDirection);
        }

        $batches = $query->paginate(15)->withQueryString();

        $batches->getCollection()->transform(function ($student) {
            return ['batch_id' => $student->batch_id, 'student_number' => $student->student_number, 'name' => "{$student->student_lname}, {$student->student_fname}", 'review_center' => $student->review_center ?? '—'];
        });

        $activeFilter = ['college' => $college, 'program' => $program, 'calendar_year' => $year, 'batch_number' => $batchNumber];

        return Inertia::render('Program/ReviewCenter', [
            'students' => $batches, 'filter' => $activeFilter, 'search' => $request->search ?? '', 
            'sort' => $cleanSortColumn, 'direction' => $sortDirection,
            'dbColleges' => College::where('is_active', 1)->get()->map(fn($c) => ['value' => $c->college_id, 'label' => $c->name]),
            'dbPrograms' => Program::where('is_active', 1)->get(),
        ]);
    }

    public function edit(Request $request, $batchId = null)
    {
        if (!$batchId) $batchId = $request->query('batch_id');

        if (!$batchId) {
            $batchRecord = BoardBatch::where('student_number', $request->query('student_number'))
                ->where('year', $request->query('calendar_year') ?? $request->query('batch_year'))
                ->where('batch_number', $request->query('batch_number') ?? $request->query('board_batch'))
                ->where('is_active', 1)->first();

            if (!$batchRecord) return redirect()->back()->with('error', 'Student not found in the selected board batch.');
            $batchId = $batchRecord->batch_id;
        }

        $student = DB::table('board_batch')
            ->join('student_info', 'board_batch.student_number', '=', 'student_info.student_number')
            ->leftJoin('student_review_center', function($join) {
                $join->on('board_batch.batch_id', '=', 'student_review_center.batch_id')->where('student_review_center.is_active', 1);
            })
            ->where('board_batch.batch_id', $batchId)
            ->select('board_batch.batch_id', 'board_batch.program_id', 'student_info.student_number', 'student_info.student_lname as lname', 'student_info.student_fname as fname', 'student_review_center.review_center')
            ->firstOrFail();

        $studentModel = StudentInfo::where('student_number', $student->student_number)->first();
        $this->authorizeStudentAccess($request->user(), $studentModel, $student->program_id);

        return Inertia::render('Program/ReviewCenterEntry', ['student' => $student]);
    }

    public function update(Request $request, $batchId)
    {
        $validated = $request->validate(['review_center' => 'required|string|max:100']);
        $batch = BoardBatch::findOrFail($batchId);
        $student = StudentInfo::where('student_number', $batch->student_number)->first();
        $this->authorizeStudentAccess($request->user(), $student, $batch->program_id);

        DB::table('student_review_center')->updateOrInsert(
            ['batch_id' => $batchId],
            ['review_center' => $validated['review_center'], 'is_active' => 1, 'date_created' => now()]
        );

        AuditService::logStudentAcademic($student->student_number, "Updated Review Center to: {$validated['review_center']}");
        return redirect()->back()->with('success', 'Review Center successfully updated!');
    }

    public function export(Request $request)
    {
        $college = $request->input('college') ?? $request->input('batch_college');
        $program = $request->input('program') ?? $request->input('batch_program');
        $year = $request->input('calendar_year') ?? $request->input('batch_year');
        $batchNumber = $request->input('batch_number') ?? $request->input('board_batch');

        $query = StudentInfo::query()
            ->join('board_batch', 'student_info.student_number', '=', 'board_batch.student_number')
            ->join('programs', 'board_batch.program_id', '=', 'programs.program_id')
            ->leftJoin('student_review_center', function($join) {
                $join->on('board_batch.batch_id', '=', 'student_review_center.batch_id')->where('student_review_center.is_active', 1);
            })
            ->where('student_info.is_active', 1)->where('board_batch.is_active', 1)
            ->where('programs.college_id', $college)->where('board_batch.program_id', $program)
            ->where('board_batch.year', $year)->where('board_batch.batch_number', $batchNumber)
            ->select('student_info.student_number', 'student_info.student_lname', 'student_info.student_fname', 'student_review_center.review_center');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('student_info.student_number', 'LIKE', "%{$search}%")
                  ->orWhereRaw("CONCAT(student_info.student_lname, ', ', student_info.student_fname) LIKE ?", ["%{$search}%"])
                  ->orWhere('student_review_center.review_center', 'LIKE', "%{$search}%");
            });
        }

        // 🧠 EXPORT SORTING
        $sort = $request->get('sort', 'name');
        $cleanSortColumn = explode('?', $sort)[0];
        $direction = $request->get('direction', 'asc');
        
        $sortMap = ['student_number' => 'student_info.student_number', 'name' => 'student_info.student_lname', 'review_center' => 'student_review_center.review_center'];
        $sortColumn = $sortMap[$cleanSortColumn] ?? 'student_info.student_lname';

        $batches = $query->orderBy($sortColumn, $direction)->get();

        $headers = ['Student Number', 'Student Name', 'Review Center'];
        $callback = function() use ($batches, $headers) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);
            foreach ($batches as $batch) fputcsv($file, [$batch->student_number, "{$batch->student_lname}, {$batch->student_fname}", $batch->review_center ?? '']);
            fclose($file);
        };

        $timestamp = now()->format('Y-m-d_H-i');
        $fileName = "ReviewCenter_Export_{$year}_Batch{$batchNumber}_{$timestamp}.csv";

        return response()->stream($callback, 200, ["Content-type" => "text/csv", "Content-Disposition" => "attachment; filename=\"{$fileName}\""]);
    }

    public function import(Request $request)
    {
        if (is_string($request->filter)) $request->merge(['filter' => json_decode($request->filter, true)]);
        $request->validate(['file' => 'required|file|mimes:csv,txt', 'filter' => 'required|array']);

        $year = $request->input('filter.calendar_year') ?? $request->input('filter.batch_year');
        $batchNumber = $request->input('filter.batch_number') ?? $request->input('filter.board_batch');
        $program = $request->input('filter.program') ?? $request->input('filter.batch_program');

        $handle = fopen($request->file('file')->getRealPath(), 'r');
        fgetcsv($handle); 
        
        $recordsProcessed = 0;
        $now = now();

        while (($row = fgetcsv($handle)) !== false) {
            $studentNumber = $row[0] ?? null;
            $reviewCenter = $row[2] ?? null; 
            if (!$studentNumber || !$reviewCenter) continue;

            $student = StudentInfo::where('student_number', $studentNumber)->first();
            if (!$student) continue;

            try {
                $this->authorizeStudentAccess($request->user(), $student, $program);
            } catch (\Exception $e) { continue; }

            $batch = BoardBatch::where('student_number', $studentNumber)->where('year', $year)->where('batch_number', $batchNumber)->first();
            if ($batch) {
                DB::table('student_review_center')->updateOrInsert(
                    ['batch_id' => $batch->batch_id],
                    ['review_center' => trim($reviewCenter), 'is_active' => 1, 'date_created' => $now]
                );
                AuditService::logStudentAcademic($studentNumber, "Imported CSV Review Center: {$reviewCenter}");
                $recordsProcessed++;
            }
        }
        fclose($handle);
        return response()->json(['success' => true, 'message' => "Successfully imported {$recordsProcessed} review centers."]);
    }

    private function authorizeStudentAccess($user, $student, $requestedProgramId = null)
    {
        if (!$user->college_id && !$user->program_id) return;
        if ($user->college_id) {
            $hasCollegeRecord = $student->programs()->join('programs as p', 'student_programs.program_id', '=', 'p.program_id')->where('p.college_id', $user->college_id)->exists();
            if (!$hasCollegeRecord) abort(403, 'Unauthorized college access.');
        }
        if ($user->program_id) {
            $hasProgramRecord = DB::table('student_programs')->where('student_number', $student->student_number)->where('program_id', $user->program_id)->exists();
            if (!$hasProgramRecord) abort(403, 'Unauthorized program access.');
        }
        if ($requestedProgramId) {
            $isValidRequest = DB::table('student_programs')->where('student_number', $student->student_number)->where('program_id', $requestedProgramId)->exists();
            if (!$isValidRequest) abort(404, 'Student never enrolled in this program context.');
        }
    }
}