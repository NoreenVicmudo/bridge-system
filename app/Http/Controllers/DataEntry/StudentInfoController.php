<?php

namespace App\Http\Controllers\DataEntry;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB; // 🧠 ADDED DB FACADE
use App\Models\Student\SocioeconomicStatus;
use App\Models\Student\Language;
use App\Models\Student\LivingArrangement;
use App\Models\College;
use App\Models\Program;
use App\Services\AuditService;
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
            if ($user->college_id || $user->program_id) abort(403, 'Unauthorized: Global metric edit access denied.');
            
            $validated = $request->validate([
                'sub_metric' => 'required',
                'detail_name' => 'required|string',
                'ranges' => 'required|array',
            ]);

            $isNew = $validated['sub_metric'] === 'add';

            SocioeconomicStatus::updateOrCreate(
                ['id' => $isNew ? null : $validated['sub_metric']],
                [
                    'name' => $validated['detail_name'],
                    'min_income' => $validated['ranges']['poor_min'] ?? null,
                    'max_income' => $validated['ranges']['poor_max'] ?? null,
                ]
            );

            $action = $isNew ? 'Added' : 'Updated';
            AuditService::logAdditionalEntry('SocioeconomicStatus', "{$action} '{$validated['detail_name']}' thresholds");

            return redirect()->back()->with('success', 'Socioeconomic thresholds saved successfully.');
        } else {
            $validated = $request->validate([
                'metric' => 'required|string',
                'sub_metric' => 'required',
                'detail_name' => 'required|string',
                'is_hidden' => 'boolean'
            ]);

            $isNew = $validated['sub_metric'] === 'add';
            $isActive = !$validated['is_hidden'];

            // ==========================================
            // 🧠 THE SAFEGUARD BOUNCER
            // ==========================================
            if (!$isNew && !$isActive) {
                $inUse = false;
                switch ($metric) {
                    case 'College':
                        $inUse = DB::table('programs')->where('college_id', $validated['sub_metric'])->where('is_active', 1)->exists();
                        break;
                    case 'Program':
                        $inUse = DB::table('student_programs')->where('program_id', $validated['sub_metric'])->where('status', 'Active')->exists();
                        break;
                    case 'CurrentLivingArrangement':
                        $inUse = DB::table('student_info')->where('student_living', $validated['sub_metric'])->where('is_active', 1)->exists();
                        break;
                    case 'LanguageSpoken':
                        $inUse = DB::table('student_info')->where('student_language', $validated['sub_metric'])->where('is_active', 1)->exists();
                        break;
                }

                if ($inUse) {
                    return redirect()->back()->withErrors([
                        'is_hidden' => 'Cannot hide this option because it is currently assigned to active students or programs.'
                    ]);
                }
            }
            // ==========================================

            switch ($metric) {
                case 'College':
                    if ($user->college_id || $user->program_id) abort(403);
                    College::updateOrCreate(
                        ['college_id' => $isNew ? null : $validated['sub_metric']],
                        ['name' => $validated['detail_name'], 'is_active' => $isActive] 
                    );
                    break;

                case 'Program':
                    if (!$isNew) $this->authorizeProgramAccess($validated['sub_metric'], $user);
                    Program::updateOrCreate(
                        ['program_id' => $isNew ? null : $validated['sub_metric']],
                        ['name' => $validated['detail_name'], 'is_active' => $isActive, 'college_id' => $request->input('college_id')]
                    );
                    break;

                case 'CurrentLivingArrangement':
                    LivingArrangement::updateOrCreate(
                        ['id' => $isNew ? null : $validated['sub_metric']],
                        ['name' => $validated['detail_name'], 'is_active' => $isActive] 
                    );
                    break;

                case 'LanguageSpoken':
                    Language::updateOrCreate(
                        ['id' => $isNew ? null : $validated['sub_metric']],
                        ['name' => $validated['detail_name'], 'is_active' => $isActive] 
                    );
                    break;
            }

            $action = $isNew ? 'Added' : 'Updated';
            AuditService::logAdditionalEntry($metric, "{$action} '{$validated['detail_name']}' configuration");

            return redirect()->back()->with('success', 'Student information configuration saved successfully.');
        }
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