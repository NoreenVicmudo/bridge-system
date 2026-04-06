<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AcademicController extends Controller
{
    public function getOptions(Request $request)
    {
        $query = DB::table('student_section as ss')
            ->join('student_info as si', 'ss.student_number', '=', 'si.student_number')
            ->where('si.is_active', 1)
            ->where('ss.is_active', 1);

        // Only apply filters if they are provided (for backward compatibility)
        if ($request->filled('academic_year')) $query->where('ss.academic_year', $request->academic_year);
        if ($request->filled('college')) $query->where('si.college_id', $request->college);
        if ($request->filled('program')) $query->where('si.program_id', $request->program);
        if ($request->filled('year_level')) $query->where('ss.year_level', $request->year_level);
        if ($request->filled('semester')) $query->where('ss.semester', $request->semester);

        // Distinct options (cast to string)
        $academicYears = (clone $query)->distinct()->pluck('ss.academic_year');
        $colleges = (clone $query)
            ->join('colleges as c', 'si.college_id', '=', 'c.college_id')
            ->distinct()
            ->select(DB::raw("CAST(c.college_id AS CHAR) as value"), 'c.name as label')
            ->get();
        $programs = (clone $query)
            ->join('programs as p', 'si.program_id', '=', 'p.program_id')
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
}