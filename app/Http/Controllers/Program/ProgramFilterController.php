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

        // Static Board Batches (Can be moved to a DB table later)
        $batches = [
            ['value' => '2025-01', 'label' => 'March 2025'],
            ['value' => '2025-02', 'label' => 'August 2025'],
            ['value' => '2026-01', 'label' => 'March 2026'],
        ];

        return response()->json([
            'colleges' => $colleges,
            'programs' => $programsMap,
            'years' => $yearsMap,
            'boardBatches' => $batches,
        ]);
    }
}