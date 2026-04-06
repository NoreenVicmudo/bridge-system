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
use App\Models\Student\StudentSection;
use App\Models\ProgramMetric\BoardBatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

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
     * Display the masterlist (all active students with their latest section)
     */
    public function masterlist(Request $request)
    {
        $user = $request->user();
        $query = StudentInfo::query()
            ->with(['college', 'program', 'living', 'language'])
            ->where('is_active', 1);

        // Apply search (student_number or full name)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('student_number', 'LIKE', "%{$search}%")
                ->orWhereRaw("CONCAT(student_lname, ', ', student_fname) LIKE ?", ["%{$search}%"])
                ->orWhere('student_lname', 'LIKE', "%{$search}%")
                ->orWhere('student_fname', 'LIKE', "%{$search}%");
            });
        }

        // Apply sorting
        $sortColumn = $request->get('sort', 'student_id');
        $sortDirection = $request->get('direction', 'desc');
        $allowedSorts = ['student_number', 'student_lname', 'college_id', 'program_id', 'student_birthdate', 'student_sex', 'student_socioeconomic'];
        if (in_array($sortColumn, $allowedSorts)) {
            $query->orderBy($sortColumn, $sortDirection === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('student_id', 'desc');
        }

        // User role restrictions (existing)
        if ($user->college_id) $query->where('college_id', $user->college_id);
        if ($user->program_id) $query->where('program_id', $user->program_id);

        $students = $query->paginate(20)->withQueryString();
        $students->getCollection()->transform(fn($student) => $this->transformStudent($student));

        return Inertia::render('Student/StudentMasterlist', ['students' => $students]);
    }

    /**
     * Display filtered students based on section or batch filters
     */
    public function filteredInfo(Request $request)
    {
        $user = $request->user();
        $isBatchMode = $request->filled('batch_college') && 
                    $request->filled('batch_program') && 
                    $request->filled('batch_year') && 
                    $request->filled('board_batch');

        $query = StudentInfo::query()->with(['college', 'program', 'living', 'language']);

        // ----- SEARCH -----
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('student_info.student_number', 'LIKE', "%{$search}%")
                ->orWhereRaw("CONCAT(student_info.student_lname, ', ', student_info.student_fname) LIKE ?", ["%{$search}%"])
                ->orWhere('student_info.student_lname', 'LIKE', "%{$search}%")
                ->orWhere('student_info.student_fname', 'LIKE', "%{$search}%");
            });
        }

        // ----- SORT -----
        $sortColumn = $request->get('sort', 'student_info.student_id');
        $sortDirection = $request->get('direction', 'desc');
        $allowedSorts = [
            'student_info.student_number',
            'student_info.student_lname',
            'student_info.college_id',
            'student_info.program_id',
            'student_info.student_birthdate',
            'student_info.student_sex',
            'student_info.student_socioeconomic'
        ];
        if (in_array($sortColumn, $allowedSorts)) {
            $query->orderBy($sortColumn, $sortDirection === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('student_info.student_id', 'desc');
        }

        if ($isBatchMode) {
            $query->join('board_batch', 'student_info.student_number', '=', 'board_batch.student_number')
                ->distinct()
                ->select('student_info.*')
                ->where('student_info.is_active', 1)
                ->where('board_batch.is_active', 1);

            if ($user->college_id) $query->where('student_info.college_id', $user->college_id);
            if ($user->program_id) $query->where('student_info.program_id', $user->program_id);
            if ($request->filled('batch_college')) $query->where('student_info.college_id', $request->batch_college);
            if ($request->filled('batch_program')) $query->where('student_info.program_id', $request->batch_program);
            if ($request->filled('batch_year')) $query->where('board_batch.year', $request->batch_year);
            if ($request->filled('board_batch')) $query->where('board_batch.batch_number', $request->board_batch);

            $students = $query->paginate(20)->withQueryString();
            $students->getCollection()->transform(fn($s) => $this->transformStudent($s));

            $filterData = $request->only(['batch_college', 'batch_program', 'batch_year', 'board_batch']);
            $filterData['mode'] = 'batch';
            if ($request->filled('batch_college')) $filterData['batch_college_name'] = College::find($request->batch_college)?->name;
            if ($request->filled('batch_program')) $filterData['batch_program_name'] = Program::find($request->batch_program)?->name;
        } else {
            $query->join('student_section', 'student_info.student_number', '=', 'student_section.student_number')
                ->distinct()
                ->select('student_info.*')
                ->where('student_info.is_active', 1)
                ->where('student_section.is_active', 1);

            if ($user->college_id) $query->where('student_info.college_id', $user->college_id);
            if ($user->program_id) $query->where('student_info.program_id', $user->program_id);
            if ($request->filled('college')) $query->where('student_info.college_id', $request->college);
            if ($request->filled('program')) $query->where('student_info.program_id', $request->program);
            if ($request->filled('academic_year')) $query->where('student_section.academic_year', $request->academic_year);
            if ($request->filled('semester')) $query->where('student_section.semester', $request->semester);
            if ($request->filled('year_level')) $query->where('student_section.year_level', $request->year_level);
            if ($request->filled('section')) $query->where('student_section.section', $request->section);

            $students = $query->paginate(20)->withQueryString();
            $students->getCollection()->transform(fn($s) => $this->transformStudent($s));

            $filterData = $request->only(['academic_year', 'semester', 'college', 'program', 'year_level', 'section']);
            $filterData['mode'] = 'section';
            if ($request->filled('college')) $filterData['college_name'] = College::find($request->college)?->name;
            if ($request->filled('program')) $filterData['program_name'] = Program::find($request->program)?->name;
        }

        // Add user's default college/program if not set
        if ($user->college_id && !isset($filterData['college'])) {
            $filterData['college'] = $user->college_id;
            $filterData['college_name'] = College::find($user->college_id)?->name;
        }
        if ($user->program_id && !isset($filterData['program'])) {
            $filterData['program'] = $user->program_id;
            $filterData['program_name'] = Program::find($user->program_id)?->name;
        }

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
        $student = StudentInfo::with(['college', 'program', 'living', 'language'])->findOrFail($id);

        $studentData = [
            'id' => $student->student_id,
            'student_number' => $student->student_number,
            'last_name' => $student->student_lname,
            'first_name' => $student->student_fname,
            'middle_name' => $student->student_mname,
            'suffix' => $student->student_suffix,
            'college' => $student->college_id,
            'program' => $student->program_id,
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
            'mode' => 'masterlist', // edit mode, no enrollment context
        ]);
    }

    /**
     * Update a student's profile
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'last_name' => 'required|string|max:50',
            'first_name' => 'required|string|max:50',
            'middle_name' => 'nullable|string|max:50',
            'suffix' => 'nullable|string|max:10',
            'college' => 'required|integer|exists:colleges,college_id',
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
        $student->update([
            'student_lname' => $validated['last_name'],
            'student_fname' => $validated['first_name'],
            'student_mname' => $validated['middle_name'],
            'student_suffix' => $validated['suffix'],
            'college_id' => $validated['college'],
            'program_id' => $validated['program'],
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

        DB::table('student_update_audit')->insert([
            'student_number' => $student->student_number,
            'updated_by' => auth()->id(),
            'updated_at' => now(),
            'remarks' => 'Profile updated',
            'location' => 'MASTERLIST',
        ]);

        return redirect()->back()->with('success', 'Student updated successfully.');
    }

    /**
     * Soft delete a single student
     */
    public function destroy($id)
    {
        $student = StudentInfo::findOrFail($id);
        $student->update(['is_active' => 0]);

        DB::table('student_delete_audit')->insert([
            'student_number' => $student->student_number,
            'deleted_by' => auth()->id(),
            'deleted_at' => now(),
            'reason' => request('reason', 'Deleted via UI'),
            'location' => request('location', 'MASTERLIST'),
        ]);

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
            $student->update(['is_active' => 0]);

            $reason = $request->reason_mode === 'single'
                ? $request->reason
                : ($request->per_reasons[$student->student_id] ?? 'No reason provided');

            DB::table('student_delete_audit')->insert([
                'student_number' => $student->student_number,
                'deleted_by' => auth()->id(),
                'deleted_at' => now(),
                'reason' => $reason,
                'location' => $request->input('location', 'MASTERLIST'),
            ]);
            $deletedCount++;
        }

        return response()->json(['success' => true, 'deleted_count' => $deletedCount]);
    }

    /**
     * Check if a student exists (for modal validation)
     */
    public function checkStudent($studentNumber)
    {
        $exists = StudentInfo::where('student_number', $studentNumber)->exists();
        return response()->json(['exists' => $exists]);
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
            'college' => $student->college?->name ?? 'N/A',
            'program' => $student->program?->name ?? 'N/A',
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

    public function getStudentIdByNumber($studentNumber)
    {
        $student = StudentInfo::where('student_number', $studentNumber)->first();
        if ($student) {
            return response()->json(['id' => $student->student_id]);
        }
        return response()->json(['error' => 'Not found'], 404);
    }
}