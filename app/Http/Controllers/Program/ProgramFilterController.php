<?php

namespace App\Http\Controllers\Program;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProgramFilterController extends Controller
{
    public function getOptions(Request $request)
    {
        // 🛠️ FIXED: Joined programs to safely get the college_id, and used bb.program_id
        $combinations = DB::table('board_batch as bb')
            ->join('student_info as si', 'bb.student_number', '=', 'si.student_number')
            ->join('programs as p', 'bb.program_id', '=', 'p.program_id')
            ->where('si.is_active', 1)
            ->where('bb.is_active', 1)
            ->select(
                'p.college_id',
                'bb.program_id',
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