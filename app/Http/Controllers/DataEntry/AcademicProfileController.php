<?php

namespace App\Http\Controllers\DataEntry;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Academic\BoardSubject;
use App\Models\Academic\GeneralSubject;
use App\Models\Academic\RatingCategory;
use App\Models\Academic\SimulationExam;
use Inertia\Inertia;

class AcademicProfileController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // Base queries for all metrics
        $queryBoard = BoardSubject::query();
        $queryGeneral = GeneralSubject::query();
        $queryRating = RatingCategory::query();
        $querySim = SimulationExam::query();

        // Apply role-based filtering
        if ($user->program_id) {
            $queryBoard->where('program_id', $user->program_id);
            $queryGeneral->where('program_id', $user->program_id);
            $queryRating->where('program_id', $user->program_id);
            $querySim->where('program_id', $user->program_id);
        } elseif ($user->college_id) {
            // Filter by programs within the user's college
            $programIds = \App\Models\Program::where('college_id', $user->college_id)->pluck('program_id');
            $queryBoard->whereIn('program_id', $programIds);
            $queryGeneral->whereIn('program_id', $programIds);
            $queryRating->whereIn('program_id', $programIds);
            $querySim->whereIn('program_id', $programIds);
        }

        return Inertia::render('Academic/AcademicProfileEntry', [
            'initialData' => [
                'BoardSubjects' => $queryBoard->get(),
                'GeneralSubjects' => $queryGeneral->get(),
                'TypeOfRating' => $queryRating->get(),
                'TypeOfSimulation' => $querySim->get(),
            ]
        ]);
    }

    /**
     * Store or update academic metrics with role-based restrictions.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $validated = $request->validate([
            'metric' => 'required|string',
            'sub_metric' => 'required|string',
            'detail_name' => 'required|string',
            'is_hidden' => 'boolean',
            'program_id' => 'nullable|integer|exists:programs,program_id'
        ]);

        $isActive = !$validated['is_hidden'];
        $isNew = $validated['sub_metric'] === 'add';

        // 1. Restriction Check: If updating existing, verify ownership
        if (!$isNew) {
            $this->authorizeAccess($validated['metric'], $validated['sub_metric'], $user);
        }

        // 2. Determine target Program ID (Prioritize user's assigned program)
        $targetProgramId = $user->program_id ?? $request->input('program_id');

        switch ($validated['metric']) {
            case 'BoardSubjects':
                BoardSubject::updateOrCreate(
                    ['subject_id' => $isNew ? null : $validated['sub_metric']],
                    [
                        'subject_name' => $validated['detail_name'],
                        'is_active' => $isActive,
                        'program_id' => $targetProgramId
                    ]
                );
                break;

            case 'GeneralSubjects':
                GeneralSubject::updateOrCreate(
                    ['general_subject_id' => $isNew ? null : $validated['sub_metric']],
                    [
                        'general_subject_name' => $validated['detail_name'],
                        'is_active' => $isActive,
                        'program_id' => $targetProgramId
                    ]
                );
                break;

            case 'TypeOfRating':
                RatingCategory::updateOrCreate(
                    ['category_id' => $isNew ? null : $validated['sub_metric']],
                    [
                        'category_name' => $validated['detail_name'],
                        'is_active' => $isActive,
                        'program_id' => $targetProgramId
                    ]
                );
                break;

            case 'TypeOfSimulation':
                SimulationExam::updateOrCreate(
                    ['simulation_id' => $isNew ? null : $validated['sub_metric']],
                    [
                        'simulation_name' => $validated['detail_name'],
                        'is_active' => $isActive,
                        'program_id' => $targetProgramId
                    ]
                );
                break;
        }

        return redirect()->back()->with('success', 'Academic profile configuration saved successfully.');
    }

    /**
     * Ensure the user has authority to modify the specific record.
     */
    private function authorizeAccess($metric, $id, $user)
    {
        // Super Admins (no college/program restriction) can skip checks
        if (!$user->college_id && !$user->program_id) {
            return;
        }

        // Map metrics to their respective models
        $modelMap = [
            'BoardSubjects'    => BoardSubject::class,
            'GeneralSubjects'  => GeneralSubject::class,
            'TypeOfRating'     => RatingCategory::class,
            'TypeOfSimulation' => SimulationExam::class,
        ];

        $modelClass = $modelMap[$metric] ?? null;
        if (!$modelClass) return;

        $item = $modelClass::find($id);
        if (!$item) return;

        // Restriction: Program-level users can only edit their own program's data
        if ($user->program_id && $item->program_id != $user->program_id) {
            abort(403, 'Unauthorized: You can only modify data for your assigned program.');
        }

        // Restriction: College-level users can only edit data within their college
        if ($user->college_id && $item->program?->college_id != $user->college_id) {
            abort(403, 'Unauthorized: This item belongs to a program outside your college.');
        }
    }
}