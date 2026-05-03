<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AcademicController extends Controller
{
    public function getOptions(Request $request)
    {
        // We now join programs and colleges through the section's program_id
        $query = DB::table('student_section as ss')
            ->join('student_info as si', 'ss.student_number', '=', 'si.student_number')
            ->join('programs as p', 'ss.program_id', '=', 'p.program_id')
            ->join('colleges as c', 'p.college_id', '=', 'c.college_id')
            ->where('si.is_active', 1)
            ->where('ss.is_active', 1);

        // Apply filters
        if ($request->filled('academic_year')) $query->where('ss.academic_year', $request->academic_year);
        if ($request->filled('college')) $query->where('c.college_id', $request->college);
        if ($request->filled('program')) $query->where('ss.program_id', $request->program);
        if ($request->filled('year_level')) $query->where('ss.year_level', $request->year_level);
        if ($request->filled('semester')) $query->where('ss.semester', $request->semester);

        // Distinct options
        $academicYears = (clone $query)->distinct()->pluck('ss.academic_year');
        $colleges = (clone $query)
            ->distinct()
            ->select(DB::raw("CAST(c.college_id AS CHAR) as value"), 'c.name as label')
            ->get();
        $programs = (clone $query)
            ->distinct()
            ->select(DB::raw("CAST(p.program_id AS CHAR) as value"), 'p.name as label', DB::raw("CAST(p.college_id AS CHAR) as college_id"))
            ->get();
        $yearLevels = (clone $query)->distinct()->pluck('ss.year_level');
        $semesters = (clone $query)->distinct()->pluck('ss.semester');
        $sections = (clone $query)->distinct()->pluck('ss.section');

        return response()->json([
            'academic_years' => $academicYears,
            'colleges' => $colleges,
            'programs' => $programs,
            'year_levels' => $yearLevels,
            'semesters' => $semesters,
            'sections' => $sections,
        ]);
    }

    /**
     * Prevent IDOR: Check if the logged-in user is allowed to access this student.
     * Evaluates the entire historical ledger, not just the currently active program.
     */
    private function authorizeStudentAccess($user, $student, $requestedProgramId = null)
    {
        if (!$user->college_id && !$user->program_id) {
            return;
        }

        if ($user->college_id) {
            $hasCollegeRecord = $student->programs()
                ->join('programs as p', 'student_programs.program_id', '=', 'p.program_id')
                ->where('p.college_id', $user->college_id)
                ->exists();

            if (!$hasCollegeRecord) {
                abort(403, 'Unauthorized: Student has no historical or active records in your College.');
            }
        }

        if ($user->program_id) {
            $hasProgramRecord = DB::table('student_programs')
                ->where('student_number', $student->student_number)
                ->where('program_id', $user->program_id)
                ->exists();

            if (!$hasProgramRecord) {
                abort(403, 'Unauthorized: Student has no historical or active records in your Program.');
            }
        }

        if ($requestedProgramId) {
            $isValidRequest = DB::table('student_programs')
                ->where('student_number', $student->student_number)
                ->where('program_id', $requestedProgramId)
                ->exists();

            if (!$isValidRequest) {
                abort(404, 'Invalid Context: Student has never been enrolled in the requested program.');
            }
        }
    }
}