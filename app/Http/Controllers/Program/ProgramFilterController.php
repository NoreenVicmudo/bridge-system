<?php

namespace App\Http\Controllers\Program;

use App\Http\Controllers\Controller;
use App\Models\College;
use App\Models\Program;
use Illuminate\Http\Request;

class ProgramFilterController extends Controller
{
    public function getOptions(Request $request)
    {
        // Fetch active colleges and format for CustomSelectGroup
        $colleges = College::where('is_active', 1)->get()->map(fn($c) => [
            'value' => $c->college_id,
            'label' => $c->name
        ]);

        $programs = Program::where('is_active', 1)->get();
        $programsMap = [];
        $yearsMap = [];

        foreach ($programs as $p) {
            // Map programs to their respective colleges
            $programsMap[$p->college_id][] = [
                'value' => $p->program_id, 
                'label' => $p->name
            ];
            // Store the program duration for the Year Level cascading logic
            $yearsMap[$p->program_id] = $p->years;
        }

        // Pull distinct calendar years from the board_batch table
        $years = \Illuminate\Support\Facades\DB::table('board_batch')
            ->where('is_active', 1)
            ->distinct()
            ->orderBy('year', 'desc')
            ->pluck('year')
            ->map(fn($y) => ['value' => (string)$y, 'label' => (string)$y]);

        // Pull distinct batch numbers (usually 1 or 2)
        $batchNumbers = \Illuminate\Support\Facades\DB::table('board_batch')
            ->where('is_active', 1)
            ->distinct()
            ->orderBy('batch_number', 'asc')
            ->pluck('batch_number')
            ->map(fn($b) => ['value' => (string)$b, 'label' => "Batch $b"]);

        return response()->json([
            'colleges' => $colleges,
            'programs' => $programsMap,
            'programYears' => $yearsMap, // Renamed to avoid confusion with calendar year
            'calendarYears' => $years,
            'batchNumbers' => $batchNumbers,
        ]);
    }
}