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

        if ($metric === 'SocioeconomicStatus') {
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

        $validated = $request->validate([
            'sub_metric' => 'required',
            'detail_name' => 'required|string',
            'is_hidden' => 'boolean',
            // 🧠 FIXED: Validating the college_id so Super Admins can safely pass it
            'college_id' => 'nullable|integer|exists:colleges,college_id'
        ]);

        $isNew = $validated['sub_metric'] === 'add';
        $isActive = !$validated['is_hidden'];

        switch ($metric) {
            case 'College':
                if ($user->college_id || $user->program_id) {
                    abort(403, 'Unauthorized: You do not have permission to manage colleges.');
                }

                College::updateOrCreate(
                    ['college_id' => $isNew ? null : $validated['sub_metric']],
                    ['name' => $validated['detail_name'], 'is_active' => $isActive]
                );
                break;

            case 'Program':
                if (!$isNew) {
                    $this->authorizeProgramAccess($validated['sub_metric'], $user);
                }
                
                $collegeId = $user->college_id ?? $validated['college_id'];

                if (!$collegeId) {
                    return redirect()->back()->withErrors(['college_id' => 'A college must be selected.']);
                }

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
                    ['name' => $validated['detail_name'], 'is_active' => $isActive] // 🧠 Added is_active
                );
                break;

            case 'LanguageSpoken':
                Language::updateOrCreate(
                    ['id' => $isNew ? null : $validated['sub_metric']],
                    ['name' => $validated['detail_name'], 'is_active' => $isActive] // 🧠 Added is_active
                );
                break;
        }

        return redirect()->back()->with('success', 'Student information configuration saved successfully.');
    }

    private function authorizeProgramAccess($programId, $user)
    {
        if (!$user->college_id && !$user->program_id) return;

        $program = Program::find($programId);
        if (!$program) return;

        if ($user->program_id && $user->program_id != $programId) {
            abort(403, 'Unauthorized: You can only edit your assigned program.');
        }

        if ($user->college_id && $program->college_id != $user->college_id) {
            abort(403, 'Unauthorized: This program belongs to another college.');
        }
    }
}