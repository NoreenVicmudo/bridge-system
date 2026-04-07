<?php

namespace App\Http\Controllers\DataEntry;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Student\SocioeconomicStatus;
use App\Models\Student\Language;
use App\Models\Student\LivingArrangement;
use App\Models\College;
use App\Models\Program;
use Inertia\Inertia;

class StudentInfoController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        return Inertia::render('Entry/StudentInformationEntry', [
            'initialData' => [
                'Colleges' => \App\Models\College::all(),
                'Programs' => \App\Models\Program::with('college')->get(),
                'LivingArrangements' => \App\Models\Student\LivingArrangement::all(),
                'Languages' => \App\Models\Student\Language::all(),
                'SocioeconomicStatus' => \App\Models\Student\SocioeconomicStatus::all(),
            ],
            'userPermissions' => [
                'canEditGlobal' => !$user->college_id && !$user->program_id,
                'college_id' => $user->college_id,
                'program_id' => $user->program_id
            ]
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $metric = $request->input('metric');

        // 1. Handle Socioeconomic Status (Restricted to Super Admins/System Level)
        if ($metric === 'SocioeconomicStatus') {
            // Restriction: If the user is tied to a specific college or program, they can't change global ranges
            if ($user->college_id || $user->program_id) {
                abort(403, 'Unauthorized: Only system administrators can update socioeconomic ranges.');
            }

            $ranges = $request->input('ranges');
            $statusMap = [
                'Rich'         => ['min' => $ranges['rich_min'],      'max' => null],
                'High Income'  => ['min' => $ranges['high_min'],      'max' => $ranges['high_max']],
                'Upper Middle' => ['min' => $ranges['upper_min'],     'max' => $ranges['upper_max']],
                'Middle Class' => ['min' => $ranges['mid_min'],       'max' => $ranges['mid_max']],
                'Lower Middle' => ['min' => $ranges['lower_mid_min'], 'max' => $ranges['lower_mid_max']],
                'Low Income'   => ['min' => $ranges['low_min'],       'max' => $ranges['low_max']],
                'Poor'         => ['min' => null,                     'max' => $ranges['poor_max']],
            ];

            foreach ($statusMap as $status => $bounds) {
                SocioeconomicStatus::updateOrCreate(
                    ['status' => $status],
                    [
                        'minimum' => $bounds['min'] === '' ? null : $bounds['min'],
                        'maximum' => $bounds['max'] === '' ? null : $bounds['max']
                    ]
                );
            }

            return redirect()->back()->with('success', 'Socioeconomic ranges updated successfully.');
        }

        // 2. Standard Validation for other metrics
        $validated = $request->validate([
            'sub_metric' => 'required|string',
            'detail_name' => 'required|string',
            'is_hidden' => 'boolean',
        ]);

        $isNew = $validated['sub_metric'] === 'add';
        $isActive = !$validated['is_hidden'];

        switch ($metric) {
            case 'College':
                // Restriction: Only Super Admins (no college_id assigned) can manage colleges
                if ($user->college_id || $user->program_id) {
                    abort(403, 'Unauthorized: You do not have permission to manage colleges.');
                }

                College::updateOrCreate(
                    ['college_id' => $isNew ? null : $validated['sub_metric']],
                    ['name' => $validated['detail_name'], 'is_active' => $isActive]
                );
                break;

            case 'Program':
                // Restriction: Check if user has authority over this specific program
                if (!$isNew) {
                    $this->authorizeProgramAccess($validated['sub_metric'], $user);
                }
                
                // If a College Admin creates a program, it's auto-assigned to their college
                $collegeId = $user->college_id ?? $request->input('college_id');

                Program::updateOrCreate(
                    ['program_id' => $isNew ? null : $validated['sub_metric']],
                    [
                        'name' => $validated['detail_name'], 
                        'is_active' => $isActive,
                        'college_id' => $collegeId
                    ]
                );
                break;

            case 'CurrentLivingArrangement':
                LivingArrangement::updateOrCreate(
                    ['id' => $isNew ? null : $validated['sub_metric']],
                    ['name' => $validated['detail_name']]
                );
                break;

            case 'LanguageSpoken':
                Language::updateOrCreate(
                    ['id' => $isNew ? null : $validated['sub_metric']],
                    ['name' => $validated['detail_name']]
                );
                break;
        }

        return redirect()->back()->with('success', 'Student information configuration saved successfully.');
    }

    /**
     * Helper to verify if the user can modify a specific program.
     */
    private function authorizeProgramAccess($programId, $user)
    {
        // Super Admin check
        if (!$user->college_id && !$user->program_id) return;

        $program = Program::find($programId);
        if (!$program) return;

        // Program Head check
        if ($user->program_id && $user->program_id != $programId) {
            abort(403, 'Unauthorized: You can only edit your assigned program.');
        }

        // College Admin check
        if ($user->college_id && $program->college_id != $user->college_id) {
            abort(403, 'Unauthorized: This program belongs to another college.');
        }
    }
}