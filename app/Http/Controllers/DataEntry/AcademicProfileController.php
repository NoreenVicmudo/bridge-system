<?php

namespace App\Http\Controllers\DataEntry;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Academic\BoardSubject;
use App\Models\Academic\GeneralSubject;
use App\Models\Academic\RatingCategory;
use App\Models\Academic\SimulationExam;
use App\Models\College;
use App\Models\Program;
use Inertia\Inertia;

class AcademicProfileController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $queryBoard = BoardSubject::query();
        $queryGeneral = GeneralSubject::query();
        $queryRating = RatingCategory::query();
        $querySim = SimulationExam::query();

        if ($user->program_id) {
            $queryBoard->where('program_id', $user->program_id);
            $queryGeneral->where('program_id', $user->program_id);
            $queryRating->where('program_id', $user->program_id);
            $querySim->where('program_id', $user->program_id);
        } elseif ($user->college_id) {
            $programIds = Program::where('college_id', $user->college_id)->pluck('program_id');
            $queryBoard->whereIn('program_id', $programIds);
            $queryGeneral->whereIn('program_id', $programIds);
            $queryRating->whereIn('program_id', $programIds);
            $querySim->whereIn('program_id', $programIds);
        }

        return Inertia::render('Entry/AcademicProfileEntry', [
            'initialData' => [
                'Colleges' => College::where('is_active', true)->get(),
                'Programs' => Program::where('is_active', true)->get(),
                'BoardSubjects' => $queryBoard->get(),
                'GeneralSubjects' => $queryGeneral->get(),
                'TypeOfRating' => $queryRating->get(),
                'TypeOfSimulation' => $querySim->get(),
            ]
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $validated = $request->validate([
            'metric' => 'required|string',
            'sub_metric' => 'required|string',
            'detail_name' => 'required|string',
            'is_hidden' => 'boolean',
            // 🧠 FIXED: Must be nullable so Program Heads don't trigger a 422 crash
            'program_id' => 'nullable|integer|exists:programs,program_id' 
        ]);

        $isActive = !$validated['is_hidden'];
        $isNew = $validated['sub_metric'] === 'add';

        if (!$isNew) {
            $this->authorizeAccess($validated['metric'], $validated['sub_metric'], $user);
        }

        // 🧠 SMART FALLBACK: Use User's Program ID first, then fallback to Request Payload
        $targetProgramId = $user->program_id ?? $validated['program_id'];

        if (!$targetProgramId) {
            return redirect()->back()->withErrors(['program_id' => 'A specific program must be selected.']);
        }

        switch ($validated['metric']) {
            case 'BoardSubjects':
                BoardSubject::updateOrCreate(['subject_id' => $isNew ? null : $validated['sub_metric']], ['subject_name' => $validated['detail_name'], 'is_active' => $isActive, 'program_id' => $targetProgramId]);
                break;
            case 'GeneralSubjects':
                GeneralSubject::updateOrCreate(['general_subject_id' => $isNew ? null : $validated['sub_metric']], ['general_subject_name' => $validated['detail_name'], 'is_active' => $isActive, 'program_id' => $targetProgramId]);
                break;
            case 'TypeOfRating':
                RatingCategory::updateOrCreate(['category_id' => $isNew ? null : $validated['sub_metric']], ['category_name' => $validated['detail_name'], 'is_active' => $isActive, 'program_id' => $targetProgramId]);
                break;
            case 'TypeOfSimulation':
                SimulationExam::updateOrCreate(['simulation_id' => $isNew ? null : $validated['sub_metric']], ['simulation_name' => $validated['detail_name'], 'is_active' => $isActive, 'program_id' => $targetProgramId]);
                break;
        }

        return redirect()->back()->with('success', 'Academic profile configuration saved successfully.');
    }

    private function authorizeAccess($metric, $id, $user)
    {
        if (!$user->college_id && !$user->program_id) return;

        $modelMap = [
            'BoardSubjects' => BoardSubject::class, 'GeneralSubjects' => GeneralSubject::class,
            'TypeOfRating' => RatingCategory::class, 'TypeOfSimulation' => SimulationExam::class,
        ];

        $modelClass = $modelMap[$metric] ?? null;
        if (!$modelClass) return;

        $item = $modelClass::find($id);
        if (!$item) return;

        if ($user->program_id && $item->program_id != $user->program_id) abort(403, 'Unauthorized.');
        if ($user->college_id && $item->program?->college_id != $user->college_id) abort(403, 'Unauthorized.');
    }
}