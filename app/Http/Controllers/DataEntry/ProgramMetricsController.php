<?php

namespace App\Http\Controllers\DataEntry;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ProgramMetric\MockSubject;
use App\Models\College;
use App\Models\Program;
use Inertia\Inertia;

class ProgramMetricsController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $query = MockSubject::query();

        if ($user->program_id) {
            $query->where('program_id', $user->program_id);
        } elseif ($user->college_id) {
            $programIds = Program::where('college_id', $user->college_id)->pluck('program_id');
            $query->whereIn('program_id', $programIds);
        }

        return Inertia::render('Entry/ProgramMetricsEntry', [
            'initialData' => [
                'Colleges' => College::where('is_active', true)->get(), 
                'Programs' => Program::where('is_active', true)->get(), 
                'MockSubjects' => $query->get()
            ]
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $validated = $request->validate([
            'metric' => 'required|string',
            'sub_metric' => 'required',
            'detail_name' => 'required|string',
            'is_hidden' => 'boolean',
            // 🧠 FIXED: Made nullable
            'program_id' => 'nullable|integer|exists:programs,program_id' 
        ]);

        $isNew = $validated['sub_metric'] === 'add';
        $isActive = !$validated['is_hidden'];

        if (!$isNew) {
            $item = MockSubject::find($validated['sub_metric']);
            if ($item) {
                if ($user->program_id && $item->program_id != $user->program_id) abort(403);
                if ($user->college_id && $item->program?->college_id != $user->college_id) abort(403);
            }
        }

        $targetProgramId = $user->program_id ?? $validated['program_id'];

        if (!$targetProgramId) {
            return redirect()->back()->withErrors(['program_id' => 'A specific program must be selected.']);
        }

        if ($validated['metric'] === 'MockSubjects') {
            MockSubject::updateOrCreate(
                ['mock_subject_id' => $isNew ? null : $validated['sub_metric']],
                ['mock_subject_name' => $validated['detail_name'], 'is_active' => $isActive, 'program_id' => $targetProgramId]
            );
        }

        return redirect()->back()->with('success', 'Program metrics configuration saved successfully.');
    }
}