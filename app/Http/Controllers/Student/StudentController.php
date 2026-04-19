<?php

namespace App\Http\Controllers\Student;

use App\Actions\Student\DirectEnrollStudentAction;
use App\Actions\Student\EnrollStudentAction;
use App\Actions\Student\ImportBatchAction;
use App\Actions\Student\ImportStudentsAction;
use App\Actions\Student\StoreStudentAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StoreStudentRequest;
use App\Models\College;
use App\Models\Program;
use App\Models\Student\StudentInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Services\AuditService;

class StudentController extends Controller
{
    /**
     * Store a new student (manual entry with enrollment)
     */
    public function store(StoreStudentRequest $request, EnrollStudentAction $action)
    {
        $validated = $request->validated();
        $validated['mode'] = $request->input('mode', 'section');
        $message = $action->execute($validated);
        return redirect()->back()->with('success', $message);
    }

    /**
     * Import students via CSV (section enrollment)
     */
    public function import(Request $request, ImportStudentsAction $action)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120',
            'academic_year' => 'required|string',
            'semester' => 'required|string',
            'college' => 'required|integer',
            'program' => 'required|integer',
            'section' => 'required|string',
        ]);

        $message = $action->execute($request->file('file'), $request->except('file'));
        return response()->json(['success' => true, 'message' => $message]);
    }

    /**
     * Import students for batch enrollment
     */
    public function importBatch(Request $request, ImportBatchAction $action)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120',
            'college_id' => 'required|integer|exists:colleges,college_id',
            'program_id' => 'required|integer|exists:programs,program_id',
            'year' => 'required|integer',
            'batch_number' => 'required|integer',
        ]);

        $message = $action->execute($request->file('file'), $request->except('file'));
        return response()->json(['success' => true, 'message' => $message]);
    }

    /**
     * Directly enroll an existing student (no profile creation)
     */
    public function directEnroll(Request $request, DirectEnrollStudentAction $action)
    {
        try {
            $validated = $request->validate([
                'student_number' => 'required|string',
                'mode' => 'required|in:section,batch',
                'academic_year' => 'nullable|string',
                'semester' => 'nullable|string',
                'section' => 'nullable|string',
                'year_level' => 'nullable|integer',
                'college' => 'nullable|integer',
                'program' => 'nullable|integer',
                'batch_college' => 'nullable|integer',
                'batch_program' => 'nullable|integer',
                'batch_year' => 'nullable|integer',
                'batch_number' => 'nullable|integer',
            ]);
            $message = $action->execute($validated);
            return response()->json(['success' => true, 'message' => $message]);
        } catch (\Exception $e) {
            \Log::error('Direct enroll error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Create a student profile only (no enrollment) - for masterlist
     */
    public function storeMasterlist(StoreStudentRequest $request, StoreStudentAction $action)
    {
        $message = $action->execute($request->validated());
        return redirect()->route('student.masterlist')->with('success', $message);
    }

    /**
     * Display the masterlist (all active students with their CURRENT program)
     */
    public function masterlist(Request $request)
    {
        $user = $request->user();
        
        // 🧠 FIXED: 1. Grab sort parameters from the React URL
        $sortColumn = $request->get('sort', 'student_info.student_id');
        $direction = $request->get('direction', 'asc');

        // Prevent ambiguous SQL errors if React sends 'student_number' instead of 'student_info.student_number'
        if (strpos($sortColumn, '.') === false && !empty($sortColumn)) {
            $sortColumn = 'student_info.' . $sortColumn;
        }

        $query = StudentInfo::query()
            ->join('student_programs', 'student_info.student_number', '=', 'student_programs.student_number')
            ->join('programs', 'student_programs.program_id', '=', 'programs.program_id')
            ->where('student_programs.status', 'Active') 
            ->where('student_info.is_active', 1)
            ->select('student_info.*');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('student_info.student_number', 'LIKE', "%{$search}%")
                  ->orWhereRaw("CONCAT(student_info.student_lname, ', ', student_info.student_fname) LIKE ?", ["%{$search}%"]);
            });
        }

        if ($user->college_id) $query->where('programs.college_id', $user->college_id);
        if ($user->program_id) $query->where('student_programs.program_id', $user->program_id);

        // 🧠 FIXED: 2. Apply the sort to the database query!
        $query->orderBy($sortColumn, $direction);

        $students = $query->paginate(20)->withQueryString();
        $students->getCollection()->transform(fn($student) => $this->transformStudent($student));

        return Inertia::render('Student/StudentMasterlist', ['students' => $students]);
    }

    /**
     * Display filtered students based on historically accurate section or batch filters
     */
    public function filteredInfo(Request $request)
    {
        $user = $request->user();
        $isBatchMode = $request->filled('batch_college') && 
                    $request->filled('batch_program') && 
                    $request->filled('batch_year') && 
                    $request->filled('board_batch');

        // 🧠 FIXED: 1. Grab sort parameters
        $sortColumn = $request->get('sort', 'student_info.student_id');
        $direction = $request->get('direction', 'asc');

        if (strpos($sortColumn, '.') === false && !empty($sortColumn)) {
            $sortColumn = 'student_info.' . $sortColumn;
        }

        $query = StudentInfo::query()->where('student_info.is_active', 1);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('student_info.student_number', 'LIKE', "%{$search}%")
                ->orWhereRaw("CONCAT(student_info.student_lname, ', ', student_info.student_fname) LIKE ?", ["%{$search}%"])
                ->orWhere('student_info.student_lname', 'LIKE', "%{$search}%")
                ->orWhere('student_info.student_fname', 'LIKE', "%{$search}%");
            });
        }

        if ($isBatchMode) {
            $query->join('board_batch', 'student_info.student_number', '=', 'board_batch.student_number')
                ->where('board_batch.is_active', 1)
                ->select('student_info.*', 'board_batch.program_id as contextual_program_id')
                ->distinct();

            if ($user->program_id) $query->where('board_batch.program_id', $user->program_id);
            if ($request->filled('batch_program')) $query->where('board_batch.program_id', $request->batch_program);
            if ($request->filled('batch_year')) $query->where('board_batch.year', $request->batch_year);
            if ($request->filled('board_batch')) $query->where('board_batch.batch_number', $request->board_batch);

            // 🧠 FIXED: 2. Apply sort before paginating
            $query->orderBy($sortColumn, $direction);
            $students = $query->paginate(20)->withQueryString();
            
            $filterData = $request->only(['batch_college', 'batch_program', 'batch_year', 'board_batch']);
            $filterData['mode'] = 'batch';
            if ($request->filled('batch_college')) $filterData['batch_college_name'] = College::find($request->batch_college)?->name;
            if ($request->filled('batch_program')) $filterData['batch_program_name'] = Program::find($request->batch_program)?->name;
        } else {
            $query->join('student_section', 'student_info.student_number', '=', 'student_section.student_number')
                ->where('student_section.is_active', 1)
                ->select('student_info.*', 'student_section.program_id as contextual_program_id')
                ->distinct();

            if ($user->program_id) $query->where('student_section.program_id', $user->program_id);
            if ($request->filled('program')) $query->where('student_section.program_id', $request->program);
            if ($request->filled('academic_year')) $query->where('student_section.academic_year', $request->academic_year);
            if ($request->filled('semester')) $query->where('student_section.semester', $request->semester);
            if ($request->filled('year_level')) $query->where('student_section.year_level', $request->year_level);
            if ($request->filled('section')) $query->where('student_section.section', $request->section);

            // 🧠 FIXED: 3. Apply sort before paginating here as well
            $query->orderBy($sortColumn, $direction);
            $students = $query->paginate(20)->withQueryString();
            
            $filterData = $request->only(['academic_year', 'semester', 'college', 'program', 'year_level', 'section']);
            $filterData['mode'] = 'section';
            if ($request->filled('college')) $filterData['college_name'] = College::find($request->college)?->name;
            if ($request->filled('program')) $filterData['program_name'] = Program::find($request->program)?->name;
        }

        if ($user->college_id && !isset($filterData['college'])) {
            $filterData['college'] = $user->college_id;
            $filterData['college_name'] = College::find($user->college_id)?->name;
        }
        if ($user->program_id && !isset($filterData['program'])) {
            $filterData['program'] = $user->program_id;
            $filterData['program_name'] = Program::find($user->program_id)?->name;
        }

        $students->getCollection()->transform(fn($s) => $this->transformStudent($s));

        return Inertia::render('Student/StudentInfo', [
            'students' => $students,
            'filters' => $filterData,
            'dbColleges' => College::where('is_active', true)->get(),
            'dbPrograms' => Program::where('is_active', true)->get(),
            'search' => $request->get('search', ''),
        ]);
    }

    /**
     * Show the form for creating a new student (manual entry)
     */
    public function create(Request $request)
    {
        $mode = $request->get('mode', 'section');
        $prefilledId = $request->get('prefilledId');

        $context = [];
        if ($mode === 'section') {
            $context = [
                'academic_year' => $request->get('academic_year'),
                'semester' => $request->get('semester'),
                'college' => $request->get('college'),
                'program' => $request->get('program'),
                'year_level' => $request->get('year_level'),
                'section' => $request->get('section'),
            ];
        } elseif ($mode === 'batch') {
            $context = [
                'college_id' => $request->get('college_id'),
                'program_id' => $request->get('program_id'),
                'year' => $request->get('year'),
                'batch_number' => $request->get('batch_number'),
            ];
        }

        $colleges = College::where('is_active', true)->get()->map(fn($c) => ['value' => $c->college_id, 'label' => $c->name]);
        $programs = Program::where('is_active', true)->get()->groupBy('college_id')->map(fn($group) => $group->map(fn($p) => ['value' => $p->program_id, 'label' => $p->name]));
        $livingArrangements = DB::table('living_arrangements')->select('id as value', 'name as label')->get();
        $languages = DB::table('languages')->select('id as value', 'name as label')->get();

        return Inertia::render('Student/StudentEntryPage', [
            'prefilledId' => $prefilledId,
            'mode' => $mode,
            'enrollmentContext' => $context,
            'options' => [
                'colleges' => $colleges,
                'programs' => $programs,
                'livingArrangements' => $livingArrangements,
                'languages' => $languages,
            ],
        ]);
    }

    /**
     * Show the edit form for a student
     */
    public function edit($id)
    {
        $student = StudentInfo::with(['living', 'language'])->findOrFail($id);
        
        // 🔒 THE BOUNCER
        $this->authorizeStudentAccess(request()->user(), $student);

        $studentData = [
            'id' => $student->student_id,
            'student_number' => $student->student_number,
            'last_name' => $student->student_lname,
            'first_name' => $student->student_fname,
            'middle_name' => $student->student_mname,
            'suffix' => $student->student_suffix,
            // UPDATED: Safely grab the actual IDs from the resolved relationships
            'college' => $student->college?->college_id, 
            'program' => $student->program?->program_id,
            'birthdate' => $student->student_birthdate ? \Carbon\Carbon::parse($student->student_birthdate)->format('Y-m-d') : null,
            'sex' => $student->student_sex,
            'socioeconomic_status' => $student->student_socioeconomic,
            'living_arrangement' => $student->student_living,
            'house_no' => $student->student_address_number,
            'street' => $student->student_address_street,
            'barangay' => $student->student_address_barangay,
            'city' => $student->student_address_city,
            'province' => $student->student_address_province,
            'postal_code' => $student->student_address_postal,
            'work_status' => $student->student_work,
            'scholarship' => $student->student_scholarship,
            'language' => $student->student_language,
            'last_school_type' => $student->student_last_school,
        ];

        $colleges = College::where('is_active', true)->get()->map(fn($c) => ['value' => $c->college_id, 'label' => $c->name]);
        $programs = Program::where('is_active', true)->get()->groupBy('college_id')->map(fn($group) => $group->map(fn($p) => ['value' => $p->program_id, 'label' => $p->name]));
        $livingArrangements = DB::table('living_arrangements')->select('id as value', 'name as label')->get();
        $languages = DB::table('languages')->select('id as value', 'name as label')->get();

        return Inertia::render('Student/StudentEntryPage', [
            'student' => $studentData,
            'options' => [
                'colleges' => $colleges,
                'programs' => $programs,
                'livingArrangements' => $livingArrangements,
                'languages' => $languages,
            ],
            'mode' => 'masterlist', 
        ]);
    }

    /**
     * Update a student's profile and handle shifting
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'last_name' => 'required|string|max:50',
            'first_name' => 'required|string|max:50',
            'middle_name' => 'nullable|string|max:50',
            'suffix' => 'nullable|string|max:10',
            'program' => 'required|integer|exists:programs,program_id',
            'birthdate' => 'nullable|date',
            'sex' => 'nullable|string',
            'socioeconomic_status' => 'nullable|string',
            'living_arrangement' => 'nullable|integer',
            'house_no' => 'nullable|string',
            'street' => 'nullable|string',
            'barangay' => 'nullable|string',
            'city' => 'nullable|string',
            'province' => 'nullable|string',
            'postal_code' => 'nullable|string',
            'work_status' => 'nullable|string',
            'scholarship' => 'nullable|string',
            'language' => 'nullable|integer',
            'last_school_type' => 'nullable|string',
        ]);

        $student = StudentInfo::findOrFail($id);

        // 🔒 THE BOUNCER
        $this->authorizeStudentAccess($request->user(), $student);
        
        // 1. Update Profile (No program_id or college_id in student_info table anymore)
        $student->update([
            'student_lname' => $validated['last_name'],
            'student_fname' => $validated['first_name'],
            'student_mname' => $validated['middle_name'],
            'student_suffix' => $validated['suffix'],
            'student_birthdate' => $validated['birthdate'],
            'student_sex' => $validated['sex'],
            'student_socioeconomic' => $validated['socioeconomic_status'],
            'student_living' => $validated['living_arrangement'],
            'student_address_number' => $validated['house_no'],
            'student_address_street' => $validated['street'],
            'student_address_barangay' => $validated['barangay'],
            'student_address_city' => $validated['city'],
            'student_address_province' => $validated['province'],
            'student_address_postal' => $validated['postal_code'],
            'student_work' => $validated['work_status'],
            'student_scholarship' => $validated['scholarship'],
            'student_language' => $validated['language'],
            'student_last_school' => $validated['last_school_type'],
        ]);

        // 2. Handle Shifting (Pivot Table Logic)
        $newProgramId = $validated['program'];
        $currentProgram = $student->activeProgram->first();
        
        if (!$currentProgram || $currentProgram->program_id != $newProgramId) {
            // Set current ones to Shifted
            DB::table('student_programs')
                ->where('student_number', $student->student_number)
                ->update(['status' => 'Shifted']);

            // Attach new one as Active
            $student->programs()->attach($newProgramId, [
                'status' => 'Active',
                'created_at' => now(),
                'updated_at' => now()
            ]);
            
            AuditService::logStudentUpdate($student->student_number, "Student shifted to Program ID: $newProgramId");
        }

        AuditService::logStudentUpdate($student->student_number, 'Profile updated');
        return redirect()->back()->with('success', 'Student updated successfully.');
    }

    /**
     * Soft delete a single student
     */
    public function destroy($id)
    {
        $student = StudentInfo::findOrFail($id);

        // 🔒 THE BOUNCER
        $this->authorizeStudentAccess(request()->user(), $student);

        $student->update(['is_active' => 0]);

        AuditService::logStudentDelete($student->student_number, request('reason', 'Deleted via UI'));

        return redirect()->back()->with('success', 'Student deleted successfully.');
    }

    /**
     * Bulk soft delete students
     */
    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'students' => 'required|array',
            'students.*' => 'exists:student_info,student_id',
            'reason_mode' => 'required|in:single,multiple',
            'reason' => 'nullable|string',
            'per_reasons' => 'nullable|array',
        ]);

        $students = StudentInfo::whereIn('student_id', $request->students)->get();
        $deletedCount = 0;

        foreach ($students as $student) {
            // 🔒 THE BOUNCER
            $this->authorizeStudentAccess($request->user(), $student);

            $student->update(['is_active' => 0]);

            $reason = $request->reason_mode === 'single'
                ? $request->reason
                : ($request->per_reasons[$student->student_id] ?? 'No reason provided');

            AuditService::logStudentDelete($student->student_number, $reason);
            $deletedCount++;
        }

        return redirect()->back()->with('success', "Successfully removed {$deletedCount} student(s).");
    }

    /**
     * Check if a student exists (for modal validation)
     */
    public function checkStudent($studentNumber)
    {
        $exists = StudentInfo::where('student_number', $studentNumber)->exists();
        return response()->json(['exists' => $exists]);
    }

    public function getStudentIdByNumber($studentNumber)
    {
        $student = StudentInfo::where('student_number', $studentNumber)->first();
        if ($student) {
            return response()->json(['id' => $student->student_id]);
        }
        return response()->json(['error' => 'Not found'], 404);
    }

    /**
     * Helper to transform student data for frontend
     */
    private function transformStudent($student)
    {
        $age = $student->student_birthdate ? \Carbon\Carbon::parse($student->student_birthdate)->age : 'N/A';
        $address = trim("{$student->student_address_number} {$student->student_address_street}, {$student->student_address_barangay}, {$student->student_address_city}");
        $address = $address ?: 'N/A';

        return [
            'id' => $student->student_id,
            'student_number' => $student->student_number,
            'name' => "{$student->student_lname}, {$student->student_fname}" . ($student->student_mname ? ' ' . substr($student->student_mname, 0, 1) . '.' : ''),
            'college' => $student->college?->name ?? 'N/A', // Uses model accessor
            'program' => $student->program?->name ?? 'N/A', // Uses model accessor
            'age' => $age,
            'sex' => $student->student_sex ?? 'N/A',
            'socioeconomic' => $student->socioeconomic_category,
            'address' => $address,
            'living_arrangement' => $student->living?->name ?? 'N/A',
            'work_status' => $student->student_work ?? 'N/A',
            'scholarship' => $student->student_scholarship ?? 'N/A',
            'language' => $student->language?->name ?? 'N/A',
            'last_school' => $student->student_last_school ?? 'N/A',
        ];
    }

    /**
     * Export students to CSV based on current filters and mode.
     */
    public function export(Request $request)
    {
        $user = $request->user();
        $mode = $request->get('mode'); 

        // 🧠 FIXED: Grab the sort parameters from React
        $sortColumn = $request->get('sort', 'student_info.student_id');
        $direction = $request->get('direction', 'asc');

        $query = StudentInfo::query()->where('student_info.is_active', 1);

        // 1. Apply Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('student_info.student_number', 'LIKE', "%{$search}%")
                ->orWhereRaw("CONCAT(student_info.student_lname, ', ', student_info.student_fname) LIKE ?", ["%{$search}%"]);
            });
        }

        // 2. Apply Filters & Role Restrictions based on Mode
        if ($mode === 'batch') {
            $query->join('board_batch', 'student_info.student_number', '=', 'board_batch.student_number')
                ->where('board_batch.is_active', 1)
                ->select('student_info.*', 'board_batch.program_id as contextual_program_id')
                ->distinct();

            if ($user->program_id) $query->where('board_batch.program_id', $user->program_id);
            if ($request->filled('batch_program')) $query->where('board_batch.program_id', $request->batch_program);
            if ($request->filled('batch_year')) $query->where('board_batch.year', $request->batch_year);
            if ($request->filled('board_batch')) $query->where('board_batch.batch_number', $request->board_batch);

        } elseif ($mode === 'section') {
            $query->join('student_section', 'student_info.student_number', '=', 'student_section.student_number')
                ->where('student_section.is_active', 1)
                ->select('student_info.*', 'student_section.program_id as contextual_program_id')
                ->distinct();

            if ($user->program_id) $query->where('student_section.program_id', $user->program_id);
            if ($request->filled('program')) $query->where('student_section.program_id', $request->program);
            if ($request->filled('academic_year')) $query->where('student_section.academic_year', $request->academic_year);
            if ($request->filled('semester')) $query->where('student_section.semester', $request->semester);
            if ($request->filled('year_level')) $query->where('student_section.year_level', $request->year_level);
            if ($request->filled('section')) $query->where('student_section.section', $request->section);

        } else {
            // Masterlist Mode - Join Active Pivot
            $query->join('student_programs', 'student_info.student_number', '=', 'student_programs.student_number')
                ->join('programs', 'student_programs.program_id', '=', 'programs.program_id')
                ->where('student_programs.status', 'Active')
                ->select('student_info.*');
                
            if ($user->college_id) $query->where('programs.college_id', $user->college_id);
            if ($user->program_id) $query->where('student_programs.program_id', $user->program_id);
        }

        // 🧠 FIXED: Apply the active sort column before pulling the data
        $query->orderBy($sortColumn, $direction);

        $students = $query->get();

        // 4. Generate CSV
        $headers = [
            'Student ID', 'Student Name', 'College', 'Program', 'Age', 'Sex', 
            'Socioeconomic', 'Address', 'Living Arrangement', 'Work Status', 
            'Scholarship', 'Language', 'Last School'
        ];

        $callback = function() use ($students, $headers) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);
            
            $allPrograms = \App\Models\Program::with('college')->get()->keyBy('program_id');
            
            foreach ($students as $s) {
                $age = $s->student_birthdate ? \Carbon\Carbon::parse($s->student_birthdate)->age : 'N/A';
                $address = trim("{$s->student_address_number} {$s->student_address_street}, {$s->student_address_barangay}, {$s->student_address_city}");
                
                if (isset($s->contextual_program_id)) {
                    $program = $allPrograms->get($s->contextual_program_id);
                    $collegeName = $program?->college?->name ?? 'N/A';
                    $programName = $program?->name ?? 'N/A';
                } else {
                    $collegeName = $s->college?->name ?? 'N/A'; 
                    $programName = $s->program?->name ?? 'N/A'; 
                }
                
                fputcsv($file, [
                    $s->student_number,
                    "{$s->student_lname}, {$s->student_fname} " . ($s->student_mname ? substr($s->student_mname, 0, 1) . '.' : ''),
                    $collegeName, $programName, $age, $s->student_sex ?? 'N/A',
                    $s->socioeconomic_category ?? $s->student_socioeconomic ?? 'N/A',
                    $address ?: 'N/A', $s->living?->name ?? 'N/A', $s->student_work ?? 'N/A',
                    $s->student_scholarship ?? 'N/A', $s->language?->name ?? 'N/A',
                    $s->student_last_school ?? 'N/A',
                ]);
            }
            fclose($file);
        };

        // 🧠 FIXED: Generate dynamic timestamp for the filename
        $timestamp = now()->format('Y-m-d_H-i');
        $filename = $mode ? "Filtered_Students_{$timestamp}.csv" : "Student_Masterlist_{$timestamp}.csv";

        return response()->stream($callback, 200, [
            "Content-type" => "text/csv", 
            "Content-Disposition" => "attachment; filename=\"{$filename}\"",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ]);
    }

    /**
     * Prevent IDOR: Check if the logged-in user is allowed to access this student.
     * Evaluates the entire historical ledger, not just the currently active program.
     */
    private function authorizeStudentAccess($user, $student, $requestedProgramId = null)
    {
        // 1. If the user is an Admin (no restrictions), let them through immediately
        if (!$user->college_id && !$user->program_id) {
            return;
        }

        // 2. Check College-Level Restriction
        if ($user->college_id) {
            // Does this student have ANY historical or active program inside this College?
            $hasCollegeRecord = $student->programs()
                ->join('programs as p', 'student_programs.program_id', '=', 'p.program_id')
                ->where('p.college_id', $user->college_id)
                ->exists();

            if (!$hasCollegeRecord) {
                abort(403, 'Unauthorized: Student has no historical or active records in your College.');
            }
        }

        // 3. Check Program-Level Restriction
        if ($user->program_id) {
            // Does this student have ANY historical or active record of this specific Program?
            $hasProgramRecord = DB::table('student_programs')
                ->where('student_number', $student->student_number)
                ->where('program_id', $user->program_id)
                ->exists();

            if (!$hasProgramRecord) {
                abort(403, 'Unauthorized: Student has no historical or active records in your Program.');
            }
        }

        // 4. Check Requested Program Validity (If a specific context is passed in the URL)
        if ($requestedProgramId) {
            $isValidRequest = DB::table('student_programs')
                ->where('student_number', $student->student_number)
                ->where('program_id', $requestedProgramId)
                ->exists();

            if (!$isValidRequest) {
                abort(404, 'Invalid Context: Student has never been enrolled in the requested program.');
            }
        }
    }
}