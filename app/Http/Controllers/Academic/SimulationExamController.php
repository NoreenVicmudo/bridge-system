<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\Academic\SimulationExam;
use App\Models\Academic\StudentSimulationExam;
use App\Models\College;
use App\Models\Program;
use App\Models\Student\StudentInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Services\AuditService; // ADDED AUDIT SERVICE

class SimulationExamController extends Controller
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

        $simulations = SimulationExam::where('program_id', $filter['program'])->where('is_active', 1)->get();
        $simHeaders = $simulations->pluck('simulation_name')->toArray();

        $query = StudentInfo::whereHas('sections', function ($q) use ($filter) {
            $q->where('academic_year', $filter['academic_year'])
              ->where('program_id', $filter['program'])
              ->where('year_level', $filter['year_level'])
              ->where('semester', $filter['semester'])
              ->where('section', $filter['section'])
              ->where('is_active', 1);
        });

        if (!empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('student_info.student_number', 'LIKE', "%{$search}%")
                  ->orWhereRaw("CONCAT(student_info.student_lname, ', ', student_info.student_fname) LIKE ?", ["%{$search}%"]);
            });
        }

        $sortColumn = $request->get('sort', 'student_info.student_id');
        $sortDirection = $request->get('direction', 'desc');
        $query->orderBy($sortColumn, $sortDirection === 'asc' ? 'asc' : 'desc');

        $students = $query->paginate(10)->withQueryString();
        $period = $request->get('exam_period', 'Default'); 

        $scores = StudentSimulationExam::whereIn('student_number', $students->pluck('student_number'))
            ->where('exam_period', $period) 
            ->where('is_active', 1)
            ->get()
            ->groupBy('student_number');

        $students->getCollection()->transform(function ($student) use ($scores, $simulations) {
            $studentScores = $scores->get($student->student_number) ?? collect();
            
            $scoreMap = [];
            foreach ($simulations as $sim) {
                $record = $studentScores->where('simulation_id', $sim->simulation_id)->first();
                $scoreMap[$sim->simulation_name] = $record ? $record->student_score : null; 
            }

            return [
                'id' => $student->student_id, 'student_number' => $student->student_number,
                'name' => "{$student->student_lname}, {$student->student_fname}",
                'results' => $scoreMap,
            ];
        });

        return Inertia::render('Academic/SimulationExam', [
            'students' => ['data' => $students, 'simulations' => $simHeaders],
            'filter' => $filter, 'search' => $request->search ?? '',
            'sort' => $sortColumn, 'direction' => $sortDirection,
        ]);
    }

    public function edit(Request $request)
    {
        $studentId = $request->query('student_id');
        $examPeriod = $request->query('exam_period', 'Default');
        $programId = $request->query('program_id'); 

        $student = StudentInfo::findOrFail($studentId);
        
        // 🔒 THE BOUNCER
        $this->authorizeStudentAccess($request->user(), $student, $programId);

        $targetProgram = $programId ?? $student->activeProgram->first()?->program_id;

        $simulations = SimulationExam::where('program_id', $targetProgram)
            ->where('is_active', 1)
            ->get()
            ->map(fn($sim) => ['value' => $sim->simulation_id, 'label' => $sim->simulation_name]);

        $scores = StudentSimulationExam::where('student_number', $student->student_number)
            ->where('exam_period', $examPeriod) 
            ->where('is_active', 1)
            ->pluck('student_score', 'simulation_id');

        return Inertia::render('Academic/SimExamResultsEntry', [
            'student' => $student, 
            'simulationOptions' => $simulations, 
            'currentResults' => $scores,
            'examPeriod' => $examPeriod 
        ]);
    }

    public function update(Request $request, $studentId)
    {
        $validated = $request->validate([
            'student_number' => 'required|exists:student_info,student_number',
            'simulation_id'  => 'required|integer|exists:simulation_exams,simulation_id',
            'score'          => 'required|numeric', 
            'exam_period'    => 'required|string|max:50'
        ]);

        $student = StudentInfo::findOrFail($studentId);
        $simulation = SimulationExam::findOrFail($validated['simulation_id']);

        // 🔒 THE BOUNCER
        $this->authorizeStudentAccess($request->user(), $student, $simulation->program_id);

        StudentSimulationExam::updateOrCreate(
            [
                'student_number' => $validated['student_number'], 
                'simulation_id'  => $validated['simulation_id'],
                'exam_period'    => $validated['exam_period']
            ],
            ['student_score' => $validated['score'], 'date_created' => now(), 'is_active' => 1]
        );

        // 📝 AUDIT LOG
        AuditService::logStudentAcademic($student->student_number, "Updated {$validated['exam_period']} Simulation Exam Score ({$simulation->simulation_name})");

        return redirect()->back()->with('success', 'Simulation score updated.');
    }

    public function export(Request $request)
    {
        $filter = $request->validate([
            'academic_year' => 'required|string',
            'program'       => 'required|integer',
            'year_level'    => 'required|integer',
            'semester'      => 'required|string',
            'section'       => 'required|string',
        ]);

        $simulations = SimulationExam::where('program_id', $filter['program'])->where('is_active', 1)->get();
        
        $students = StudentInfo::whereHas('sections', function ($q) use ($filter) {
            $q->where('academic_year', $filter['academic_year'])
            ->where('program_id', $filter['program'])
            ->where('year_level', $filter['year_level'])
            ->where('semester', $filter['semester'])
            ->where('section', $filter['section'])
            ->where('is_active', 1);
        })->get();

        $scores = StudentSimulationExam::whereIn('student_number', $students->pluck('student_number'))->where('is_active', 1)->get()->groupBy('student_number');
        $headers = ['Student Number', 'Student Name'];
        foreach ($simulations as $sim) $headers[] = $sim->simulation_name;

        $callback = function() use ($students, $scores, $simulations, $headers) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);
            foreach ($students as $student) {
                $studentScores = $scores->get($student->student_number) ?? collect();
                $row = [$student->student_number, "{$student->student_lname}, {$student->student_fname}"];
                foreach ($simulations as $sim) {
                    $record = $studentScores->where('simulation_id', $sim->simulation_id)->first();
                    $row[] = $record ? $record->student_score : '';
                }
                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, ["Content-type" => "text/csv", "Content-Disposition" => "attachment; filename=SimExams_Export.csv", "Pragma" => "no-cache", "Cache-Control" => "must-revalidate, post-check=0, pre-check=0", "Expires" => "0"]);
    }

    public function import(Request $request)
    {
        if (is_string($request->filter)) $request->merge(['filter' => json_decode($request->filter, true)]);
        $request->validate(['file' => 'required|file|mimes:csv,txt', 'filter' => 'required|array', 'filter.program' => 'required|integer']);

        $handle = fopen($request->file('file')->getRealPath(), 'r');
        $headers = fgetcsv($handle);
        if (!$headers) return response()->json(['success' => false, 'message' => 'Empty file'], 422);

        $targetProgram = $request->filter['program'];
        $simulations = SimulationExam::where('program_id', $targetProgram)->where('is_active', 1)->get();
        
        $simMap = [];
        foreach ($simulations as $sim) $simMap[strtolower(trim($sim->simulation_name))] = $sim->simulation_id;

        $simColumns = [];
        foreach ($headers as $index => $header) {
            $cleanHeader = strtolower(trim($header));
            if (isset($simMap[$cleanHeader])) $simColumns[] = ['simulation_id' => $simMap[$cleanHeader], 'index' => $index];
        }

        if (empty($simColumns)) return response()->json(['success' => false, 'message' => 'No matching exams found in headers.'], 422);

        $recordsProcessed = 0;
        $now = now();
        $examPeriod = $request->filter['exam_period'] ?? 'Default';

        while (($row = fgetcsv($handle)) !== false) {
            $studentNumber = $row[0] ?? null;
            if (!$studentNumber) continue;

            $student = StudentInfo::where('student_number', $studentNumber)->first();
            if (!$student) continue;

            // 🔒 THE TRY-CATCH BOUNCER
            try {
                $this->authorizeStudentAccess($request->user(), $student, $targetProgram);
            } catch (\Exception $e) {
                continue;
            }

            foreach ($simColumns as $col) {
                $scoreValue = $row[$col['index']] ?? null;
                if ($scoreValue !== null && $scoreValue !== '') {
                    StudentSimulationExam::updateOrCreate(
                        [
                            'student_number' => $studentNumber, 
                            'simulation_id'  => $col['simulation_id'],
                            'exam_period'    => $examPeriod 
                        ],
                        ['student_score' => (float)$scoreValue, 'date_created' => $now, 'is_active' => 1]
                    );

                    // 📝 AUDIT LOG
                    AuditService::logStudentAcademic($studentNumber, "Imported CSV {$examPeriod} Simulation Exam Score for ID: {$col['simulation_id']}");
                    
                    $recordsProcessed++;
                }
            }
        }
        fclose($handle);
        return response()->json(['success' => true, 'message' => 'Import completed', 'records_processed' => $recordsProcessed]);
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