<?php

namespace App\Http\Controllers\Program;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProgramFilterController extends Controller
{
    public function getOptions(Request $request)
    {
        // Fetch all unique combinations of College, Program, Year, and Batch that actually have students
        $combinations = DB::table('board_batch as bb')
            ->join('student_info as si', 'bb.student_number', '=', 'si.student_number')
            ->where('si.is_active', 1)
            ->where('bb.is_active', 1)
            ->select(
                'si.college_id',
                'si.program_id',
                'bb.year',
                'bb.batch_number'
            )
            ->distinct()
            ->get();

        return response()->json([
            'combinations' => $combinations
        ]);
    }
}