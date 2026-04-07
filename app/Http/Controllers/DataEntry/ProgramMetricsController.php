<?php

namespace App\Http\Controllers\DataEntry;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ProgramMetric\MockSubject;

class ProgramMetricsController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $query = MockSubject::query();

        if ($user->program_id) {
            $query->where('program_id', $user->program_id);
        } elseif ($user->college_id) {
            $programIds = \App\Models\Program::where('college_id', $user->college_id)->pluck('program_id');
            $query->whereIn('program_id', $programIds);
        }

        return Inertia::render('Program/ProgramMetricsEntry', [
            'initialData' => [
                'MockSubjects' => $query->get()
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'metric' => 'required|string',
            'sub_metric' => 'required|string',
            'detail_name' => 'required|string',
            'is_hidden' => 'boolean',
        ]);

        if ($validated['metric'] === 'MockSubjects') {
            $isActive = !$validated['is_hidden'];
            
            if ($validated['sub_metric'] === 'add') {
                MockSubject::create([
                    'mock_subject_name' => $validated['detail_name'], 
                    'is_active' => $isActive
                ]);
            } else {
                MockSubject::where('mock_subject_id', $validated['sub_metric'])
                    ->update([
                        'mock_subject_name' => $validated['detail_name'], 
                        'is_active' => $isActive
                    ]);
            }
        }

        return redirect()->back()->with('success', 'Program metrics configuration saved successfully.');
    }
}