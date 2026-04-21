<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\Academic\StudentAttendanceReview;
use App\Models\College;
use App\Models\Program;
use App\Models\Student\StudentInfo;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $filter = $request->validate([
            'academic_year' => 'required|string', 'college' => 'required|integer', 'program' => 'required|integer',
            'year_level' => 'required|integer', 'semester' => 'required|string', 'section' => 'required|string',
        ]);

        $query = StudentInfo::whereHas('sections', function ($q) use ($filter) {
            $q->where('academic_year', $filter['academic_year'])->where('program_id', $filter['program'])
              ->where('year_level', $filter['year_level'])->where('semester', $filter['semester'])
              ->where('section', $filter['section'])->where('is_active', 1);
        })->select('student_info.*'); // 🧠 CRITICAL

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('student_info.student_number', 'LIKE', "%{$search}%")
                  ->orWhereRaw("CONCAT(student_info.student_lname, ', ', student_info.student_fname) LIKE ?", ["%{$search}%"]);
            });
        }

        // 🧠 DYNAMIC SORTING ENGINE
        $sortColumn = $request->get('sort', 'student_info.student_lname');
        $cleanSortColumn = explode('?', $sortColumn)[0];
        $sortDirection = $request->get('direction', 'asc');
        $standardSorts = ['student_info.student_id', 'student_info.student_number', 'student_info.student_lname'];

        if (in_array($cleanSortColumn, $standardSorts)) {
            $query->orderBy($cleanSortColumn, $sortDirection);
        } elseif (in_array($cleanSortColumn, ['attended', 'total', 'percentage'])) {
            $query->leftJoin('student_attendance_reviews as sar_sort', function($join) use ($filter) {
                $join->on('student_info.student_number', '=', 'sar_sort.student_number')
                     ->where('sar_sort.program_id', $filter['program'])
                     ->where('sar_sort.is_active', 1);
            });
            if ($cleanSortColumn === 'attended') {
                $query->orderBy('sar_sort.sessions_attended', $sortDirection);
            } elseif ($cleanSortColumn === 'total') {
                $query->orderBy('sar_sort.sessions_total', $sortDirection);
            } elseif ($cleanSortColumn === 'percentage') {
                // Safely handle division by zero in MySQL
                $query->orderByRaw('(sar_sort.sessions_attended / NULLIF(sar_sort.sessions_total, 0)) ' . $sortDirection);
            }
        } else {
            $query->orderBy('student_info.student_lname', $sortDirection);
        }

        $students = $query->paginate(10)->withQueryString();

        $attendanceRecords = StudentAttendanceReview::whereIn('student_number', $students->pluck('student_number'))
            ->where('is_active', 1)->get()->keyBy('student_number');

        $students->getCollection()->transform(function ($student) use ($attendanceRecords) {
            $record = $attendanceRecords->get($student->student_number);
            $attended = $record ? $record->sessions_attended : 0;
            $total = $record ? $record->sessions_total : 0;
            return [
                'id' => $student->student_id, 'student_number' => $student->student_number,
                'name' => "{$student->student_lname}, {$student->student_fname}",
                'attended' => $attended, 'total' => $total,
                'percentage' => ($total > 0) ? round(($attended / $total) * 100, 2) : 0,
            ];
        });

        return Inertia::render('Academic/ReviewAttendance', [
            'students' => $students, 'filter' => $filter, 'search' => $request->search ?? '',
            'sort' => $cleanSortColumn, 'direction'=> $sortDirection,
        ]);
    }

    public function edit(Request $request)
    {
        $studentId = $request->query('student_id');
        $programId = $request->query('program_id'); 

        $student = StudentInfo::findOrFail($studentId);
        $this->authorizeStudentAccess($request->user(), $student, $programId);
        $targetProgram = $programId ?? $student->activeProgram->first()?->program_id;

        $record = StudentAttendanceReview::where('student_number', $student->student_number)
            ->where('program_id', $targetProgram)->where('is_active', 1)->first();

        return Inertia::render('Academic/AttendanceEntry', [
            'student' => $student,
            'currentAttendance' => [
                'attended' => $record ? $record->sessions_attended : 0,
                'total' => $record ? $record->sessions_total : 0,
            ],
        ]);
    }

    public function update(Request $request, $studentId)
    {
        $validated = $request->validate([
            'student_number' => 'required|exists:student_info,student_number',
            'attended'       => 'required|integer|min:0',
            'total'          => 'required|integer|min:1',
            'program_id'     => 'nullable|integer'
        ]);

        $student = StudentInfo::findOrFail($studentId);
        $targetProgram = $validated['program_id'] ?? $student->activeProgram->first()?->program_id;
        $this->authorizeStudentAccess($request->user(), $student, $targetProgram);

        StudentAttendanceReview::updateOrCreate(
            ['student_number' => $validated['student_number'], 'program_id' => $targetProgram],
            ['sessions_attended' => $validated['attended'], 'sessions_total' => $validated['total'], 'date_created' => now(), 'is_active' => 1]
        );

        AuditService::logStudentAcademic($student->student_number, "Updated Attendance: {$validated['attended']}/{$validated['total']} for Program ID: {$targetProgram}");

        return redirect()->back()->with('success', 'Attendance record updated.');
    }

    public function export(Request $request)
    {
        $query = StudentInfo::whereHas('sections', function ($q) use ($request) {
            $q->where('academic_year', $request->academic_year)->where('program_id', $request->program)
              ->where('year_level', $request->year_level)->where('semester', $request->semester)
              ->where('section', $request->section)->where('is_active', 1);
        })->select('student_info.*'); // 🧠 CRITICAL

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('student_info.student_number', 'LIKE', "%{$search}%")
                  ->orWhereRaw("CONCAT(student_info.student_lname, ', ', student_info.student_fname) LIKE ?", ["%{$search}%"]);
            });
        }

        // 🧠 DYNAMIC EXPORT SORTING
        $sortColumn = $request->get('sort', 'student_info.student_lname');
        $cleanSortColumn = explode('?', $sortColumn)[0];
        $sortDirection = $request->get('direction', 'asc');
        $standardSorts = ['student_info.student_id', 'student_info.student_number', 'student_info.student_lname'];

        if (in_array($cleanSortColumn, $standardSorts)) {
            $query->orderBy($cleanSortColumn, $sortDirection);
        } elseif (in_array($cleanSortColumn, ['attended', 'total', 'percentage'])) {
            $query->leftJoin('student_attendance_reviews as sar_sort', function($join) use ($request) {
                $join->on('student_info.student_number', '=', 'sar_sort.student_number')
                     ->where('sar_sort.program_id', $request->program)
                     ->where('sar_sort.is_active', 1);
            });
            if ($cleanSortColumn === 'attended') {
                $query->orderBy('sar_sort.sessions_attended', $sortDirection);
            } elseif ($cleanSortColumn === 'total') {
                $query->orderBy('sar_sort.sessions_total', $sortDirection);
            } elseif ($cleanSortColumn === 'percentage') {
                $query->orderByRaw('(sar_sort.sessions_attended / NULLIF(sar_sort.sessions_total, 0)) ' . $sortDirection);
            }
        } else {
            $query->orderBy('student_info.student_lname', $sortDirection);
        }

        $students = $query->get();

        $records = StudentAttendanceReview::whereIn('student_number', $students->pluck('student_number'))
            ->where('program_id', $request->program)->where('is_active', 1)->get()->keyBy('student_number');

        $headers = ['Student Number', 'Student Name', 'Attended', 'Total Sessions', 'Percentage'];

        $callback = function() use ($students, $records, $headers) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);
            foreach ($students as $student) {
                $rec = $records->get($student->student_number);
                $att = $rec ? $rec->sessions_attended : 0;
                $tot = $rec ? $rec->sessions_total : 0;
                fputcsv($file, [
                    $student->student_number, "{$student->student_lname}, {$student->student_fname}",
                    $att, $tot, ($tot > 0) ? round(($att / $tot) * 100, 2) . '%' : '0%'
                ]);
            }
            fclose($file);
        };

        $timestamp = now()->format('Y-m-d_H-i');
        $fileName = "ReviewAttendance_{$request->section}_{$timestamp}.csv";

        return response()->stream($callback, 200, ["Content-type" => "text/csv", "Content-Disposition" => "attachment; filename=\"{$fileName}\""]);
    }

    public function import(Request $request)
    {
        if (is_string($request->filter)) $request->merge(['filter' => json_decode($request->filter, true)]);
        $request->validate(['file' => 'required|file|mimes:csv,txt', 'filter' => 'required|array', 'filter.program' => 'required|integer']);

        $handle = fopen($request->file('file')->getRealPath(), 'r');
        fgetcsv($handle); 

        $processed = 0;
        $targetProgram = $request->filter['program'];

        while (($row = fgetcsv($handle)) !== false) {
            $sNum = $row[0] ?? null;
            $att = $row[2] ?? 0;
            $tot = $row[3] ?? 0;

            if (!$sNum) continue;
            $student = StudentInfo::where('student_number', $sNum)->first();
            if (!$student) continue;

            try {
                $this->authorizeStudentAccess($request->user(), $student, $targetProgram);
            } catch (\Exception $e) { continue; }

            StudentAttendanceReview::updateOrCreate(
                ['student_number' => $sNum, 'program_id' => $targetProgram],
                ['sessions_attended' => (int)$att, 'sessions_total' => (int)$tot, 'date_created' => now(), 'is_active' => 1]
            );
            AuditService::logStudentAcademic($sNum, "Imported Attendance via CSV ({$att}/{$tot}) for Program ID: {$targetProgram}");
            $processed++;
        }
        fclose($handle);
        return response()->json(['success' => true, 'message' => 'Imported ' . $processed . ' records.']);
    }

    private function authorizeStudentAccess($user, $student, $requestedProgramId = null)
    {
        if (!$user->college_id && !$user->program_id) return;
        if ($user->college_id) {
            $hasCollegeRecord = $student->programs()->join('programs as p', 'student_programs.program_id', '=', 'p.program_id')->where('p.college_id', $user->college_id)->exists();
            if (!$hasCollegeRecord) abort(403, 'Unauthorized: Student has no historical or active records in your College.');
        }
        if ($user->program_id) {
            $hasProgramRecord = DB::table('student_programs')->where('student_number', $student->student_number)->where('program_id', $user->program_id)->exists();
            if (!$hasProgramRecord) abort(403, 'Unauthorized: Student has no historical or active records in your Program.');
        }
        if ($requestedProgramId) {
            $isValidRequest = DB::table('student_programs')->where('student_number', $student->student_number)->where('program_id', $requestedProgramId)->exists();
            if (!$isValidRequest) abort(404, 'Invalid Context: Student has never been enrolled in the requested program.');
        }
    }
}