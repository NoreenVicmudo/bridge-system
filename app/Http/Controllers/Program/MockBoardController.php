<?php

namespace App\Http\Controllers\Program;

use App\Http\Controllers\Controller;
use App\Models\College;
use App\Models\Program;
use App\Models\ProgramMetric\BoardBatch;
use App\Models\ProgramMetric\MockSubject;
use App\Models\ProgramMetric\StudentMockBoardScore;
use App\Models\Student\StudentInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Services\AuditService;

class MockBoardController extends Controller
{
    public function index(Request $request)
    {
        $college = $request->input('college') ?? $request->input('batch_college');
        $program = $request->input('program') ?? $request->input('batch_program');
        $year = $request->input('calendar_year') ?? $request->input('batch_year');
        $batchNumber = $request->input('batch_number') ?? $request->input('board_batch');

        if (!$college || !$program || !$year || !$batchNumber) {
            return Inertia::render('Program/MockBoardScores', [
                'students' => ['data' => ['data' => [], 'links' => []], 'subjects' => []],
                'filter' => $request->all(),
                'dbColleges' => College::where('is_active', 1)->get()->map(fn($c) => ['value' => $c->college_id, 'label' => $c->name]),
                'dbPrograms' => Program::where('is_active', 1)->get(),
            ]);
        }

        $subjects = MockSubject::where('program_id', $program)->where('is_active', 1)->get();
        $subjectHeaders = $subjects->pluck('mock_subject_name')->toArray();

        $query = StudentInfo::query()
            ->join('board_batch', 'student_info.student_number', '=', 'board_batch.student_number')
            ->join('programs', 'board_batch.program_id', '=', 'programs.program_id')
            ->where('student_info.is_active', 1)
            ->where('board_batch.is_active', 1)
            ->where('programs.college_id', $college)
            ->where('board_batch.program_id', $program)
            ->where('board_batch.year', $year)
            ->where('board_batch.batch_number', $batchNumber)
            ->select('board_batch.batch_id', 'student_info.student_number', 'student_info.student_lname', 'student_info.student_fname', 'student_info.student_id')
            ->distinct();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('student_info.student_number', 'LIKE', "%{$search}%")
                  ->orWhereRaw("CONCAT(student_info.student_lname, ', ', student_info.student_fname) LIKE ?", ["%{$search}%"]);
            });
        }

        $rawSort = $request->get('sort');
        if ($rawSort && str_starts_with($rawSort, 'si.')) $rawSort = str_replace('si.', 'student_info.', $rawSort);
        $allowedSorts = ['student_info.student_number', 'student_info.student_lname', 'student_info.student_id'];
        $sortColumn = in_array($rawSort, $allowedSorts) ? $rawSort : 'student_info.student_id';
        $sortDirection = $request->get('direction', 'desc') === 'asc' ? 'asc' : 'desc';

        $query->orderBy($sortColumn, $sortDirection);
        $batches = $query->paginate(10)->withQueryString();

        // 🧠 FETCH SCORES BASED ON EXAM PERIOD
        $period = $request->get('exam_period', 'Default');

        $scores = StudentMockBoardScore::whereIn('batch_id', $batches->pluck('batch_id'))
            ->where('exam_period', $period) // <-- 🧠 EXAM PERIOD FILTER
            ->where('is_active', 1)->get()->groupBy('batch_id');

        $batches->getCollection()->transform(function ($batch) use ($scores, $subjects) {
            $batchScores = $scores->get($batch->batch_id) ?? collect();
            $scoreMap = [];
            foreach ($subjects as $sub) {
                $record = $batchScores->firstWhere('mock_subject_id', $sub->mock_subject_id);
                $scoreMap[$sub->mock_subject_name] = $record ? $record->score : null;
            }
            return ['batch_id' => $batch->batch_id, 'student_number' => $batch->student_number, 'name' => "{$batch->student_lname}, {$batch->student_fname}", 'scores' => $scoreMap];
        });

        $activeFilter = ['college' => $college, 'program' => $program, 'calendar_year' => $year, 'batch_number' => $batchNumber, 'exam_period' => $period];

        return Inertia::render('Program/MockBoardScores', [
            'students' => ['data' => $batches, 'subjects' => $subjectHeaders],
            'filter'   => $activeFilter, 'search'   => $request->search ?? '', 'sort' => $sortColumn, 'direction'=> $sortDirection,
            'dbColleges' => College::where('is_active', 1)->get()->map(fn($c) => ['value' => $c->college_id, 'label' => $c->name]),
            'dbPrograms' => Program::where('is_active', 1)->get(),
        ]);
    }

    public function edit(Request $request)
    {
        $examPeriod = $request->query('exam_period', 'Default'); // <-- 🧠 GRAB PERIOD FROM URL

        if ($request->has('batch_id')) {
            $batchQuery = BoardBatch::where('batch_id', $request->query('batch_id'));
        } else {
            $studentNum = $request->query('student_number');
            $year = $request->query('calendar_year') ?? $request->query('batch_year');
            $batchNum = $request->query('batch_number') ?? $request->query('board_batch');
            $batchQuery = BoardBatch::where('board_batch.student_number', $studentNum)->where('board_batch.year', $year)->where('board_batch.batch_number', $batchNum)->where('board_batch.is_active', 1);
        }

        $batch = $batchQuery->join('student_info', 'board_batch.student_number', '=', 'student_info.student_number')
            ->select('board_batch.batch_id', 'board_batch.program_id', 'student_info.student_number', 'student_info.student_lname as lname', 'student_info.student_fname as fname')
            ->firstOrFail();

        // 🔒 THE BOUNCER
        $student = StudentInfo::where('student_number', $batch->student_number)->first();
        $this->authorizeStudentAccess($request->user(), $student, $batch->program_id);

        $subjects = MockSubject::where('program_id', $batch->program_id)->where('is_active', 1)->get()->map(fn($s) => ['value' => $s->mock_subject_id, 'label' => $s->mock_subject_name]);
        
        $scores = StudentMockBoardScore::where('batch_id', $batch->batch_id)
            ->where('exam_period', $examPeriod) // <-- 🧠 FILTER SCORES BY PERIOD
            ->where('is_active', 1)->pluck('score', 'mock_subject_id');

        return Inertia::render('Program/MockScoresEntry', [
            'student'        => $batch,
            'subjectOptions' => $subjects,
            'currentScores'  => $scores,
            'examPeriod'     => $examPeriod, // <-- 🧠 PASS TO FRONTEND
        ]);
    }

    public function update(Request $request, $batchId)
    {
        $validated = $request->validate([
            'mock_subject_id' => 'required|integer|exists:mock_subjects,mock_subject_id',
            'score'           => 'required|numeric|min:0|max:100',
            'exam_period'     => 'required|string|max:50', // <-- 🧠 VALIDATE PERIOD
        ]);

        $batch = BoardBatch::findOrFail($batchId);
        $student = StudentInfo::where('student_number', $batch->student_number)->first();
        $subject = MockSubject::findOrFail($validated['mock_subject_id']);

        // 🔒 THE BOUNCER
        $this->authorizeStudentAccess($request->user(), $student, $subject->program_id);

        StudentMockBoardScore::updateOrCreate(
            [
                'batch_id' => $batchId, 
                'mock_subject_id' => $validated['mock_subject_id'],
                'exam_period' => $validated['exam_period'] // <-- 🧠 ADD TO UNIQUE KEY
            ],
            ['score' => $validated['score'], 'date_created' => now(), 'is_active' => 1]
        );

        // 📝 AUDIT LOG
        AuditService::logStudentAcademic($student->student_number, "Updated {$validated['exam_period']} Mock Board Score for {$subject->mock_subject_name} to {$validated['score']}%");

        return redirect()->back()->with('success', 'Mock board score updated.');
    }

    public function export(Request $request)
    {
        $college = $request->input('college') ?? $request->input('batch_college');
        $program = $request->input('program') ?? $request->input('batch_program');
        $year = $request->input('calendar_year') ?? $request->input('batch_year');
        $batchNumber = $request->input('batch_number') ?? $request->input('board_batch');
        $period = $request->input('exam_period', 'Default'); // <-- 🧠 GRAB PERIOD

        $subjects = MockSubject::where('program_id', $program)->where('is_active', 1)->get();
        
        $batches = StudentInfo::query()
            ->join('board_batch', 'student_info.student_number', '=', 'board_batch.student_number')
            ->join('programs', 'board_batch.program_id', '=', 'programs.program_id')
            ->where('student_info.is_active', 1)
            ->where('board_batch.is_active', 1)
            ->where('programs.college_id', $college)
            ->where('board_batch.program_id', $program)
            ->where('board_batch.year', $year)
            ->where('board_batch.batch_number', $batchNumber)
            ->select('board_batch.batch_id', 'student_info.student_number', 'student_info.student_lname', 'student_info.student_fname')
            ->distinct()
            ->get();

        $scores = StudentMockBoardScore::whereIn('batch_id', $batches->pluck('batch_id'))
            ->where('exam_period', $period) // <-- 🧠 EXPORT SPECIFIC PERIOD
            ->where('is_active', 1)->get()->groupBy('batch_id');
        
        $headers = ['Student Number', 'Student Name'];
        foreach ($subjects as $sub) $headers[] = $sub->mock_subject_name . " (%)";

        $callback = function() use ($batches, $scores, $subjects, $headers) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);
            foreach ($batches as $batch) {
                $batchScores = $scores->get($batch->batch_id) ?? collect();
                $row = [$batch->student_number, "{$batch->student_lname}, {$batch->student_fname}"];
                foreach ($subjects as $sub) {
                    $record = $batchScores->firstWhere('mock_subject_id', $sub->mock_subject_id);
                    $row[] = $record ? $record->score : '';
                }
                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, ["Content-type" => "text/csv", "Content-Disposition" => "attachment; filename=MockBoard_{$period}_Export.csv"]);
    }

    public function import(Request $request)
    {
        if (is_string($request->filter)) $request->merge(['filter' => json_decode($request->filter, true)]);
        $request->validate(['file' => 'required|file|mimes:csv,txt', 'filter' => 'required|array']);

        $program = $request->input('filter.program') ?? $request->input('filter.batch_program');
        $year = $request->input('filter.calendar_year') ?? $request->input('filter.batch_year');
        $batchNumber = $request->input('filter.batch_number') ?? $request->input('filter.board_batch');
        $examPeriod = $request->input('filter.exam_period') ?? 'Default'; // <-- 🧠 GRAB PERIOD

        $handle = fopen($request->file('file')->getRealPath(), 'r');
        $headers = fgetcsv($handle);
        if (!$headers) return response()->json(['success' => false, 'message' => 'Empty file'], 422);

        $subjects = MockSubject::where('program_id', $program)->where('is_active', 1)->get();
        $subMap = [];
        foreach ($subjects as $sub) $subMap[strtolower(str_replace(' (%)', '', trim($sub->mock_subject_name)))] = $sub->mock_subject_id;

        $subColumns = [];
        foreach ($headers as $index => $header) {
            $cleanHeader = strtolower(str_replace(' (%)', '', trim($header)));
            if (isset($subMap[$cleanHeader])) $subColumns[] = ['mock_subject_id' => $subMap[$cleanHeader], 'index' => $index];
        }

        $recordsProcessed = 0;
        $now = now();
        while (($row = fgetcsv($handle)) !== false) {
            $studentNumber = $row[0] ?? null;
            if (!$studentNumber) continue;

            $student = StudentInfo::where('student_number', $studentNumber)->first();
            if (!$student) continue;

            // 🔒 THE TRY-CATCH BOUNCER
            try {
                $this->authorizeStudentAccess($request->user(), $student, $program);
            } catch (\Exception $e) { continue; }

            $batch = BoardBatch::where('student_number', $studentNumber)->where('year', $year)->where('batch_number', $batchNumber)->first();
            if (!$batch) continue;

            foreach ($subColumns as $col) {
                $scoreValue = $row[$col['index']] ?? null;
                if ($scoreValue !== null && $scoreValue !== '') {
                    StudentMockBoardScore::updateOrCreate(
                        [
                            'batch_id' => $batch->batch_id, 
                            'mock_subject_id' => $col['mock_subject_id'],
                            'exam_period' => $examPeriod // <-- 🧠 ADD TO UNIQUE KEY
                        ],
                        ['score' => (float)$scoreValue, 'date_created' => $now, 'is_active' => 1]
                    );

                    // 📝 AUDIT LOG
                    AuditService::logStudentAcademic($studentNumber, "Imported CSV {$examPeriod} Mock Board Score for Subject ID: {$col['mock_subject_id']}");
                    $recordsProcessed++;
                }
            }
        }
        fclose($handle);
        return response()->json(['success' => true, 'message' => 'Imported ' . $recordsProcessed . ' scores.']);
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