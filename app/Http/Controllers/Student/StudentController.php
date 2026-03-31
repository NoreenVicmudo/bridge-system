<?php

namespace App\Http\Controllers\Student;

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
// use App\Models\Student; // We will create this model in a second!

class StudentController extends Controller
{
    public function store(StoreStudentRequest $request, EnrollStudentAction $action)
    {
        $validated = $request->validated();
        $validated['mode'] = $request->input('mode', 'section'); // default to section
        $message = $action->execute($validated);
        return redirect()->back()->with('success', $message);
    }

    public function import(Request $request, ImportStudentsAction $action)
    {
        // 1. Validate the file and the context
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120', // Max 5MB
            'academic_year' => 'required|string',
            'semester' => 'required|string',
            'college' => 'required|integer',
            'program' => 'required|integer',
            'section' => 'required|string',
        ]);

        // 2. Pass the file and the context data to the Action
        $message = $action->execute($request->file('file'), $request->except('file'));

        // 3. Redirect back with a success message
        return redirect()->back()->with('success', $message);
    }

    public function masterlist(Request $request)
    {
        $user = $request->user();

        $query = StudentInfo::query()
            ->with(['college', 'program', 'living', 'language'])
            ->join('student_section', 'student_info.student_number', '=', 'student_section.student_number')
            ->select('student_info.*')
            ->where('student_info.is_active', 1)
            ->where('student_section.is_active', 1);

        // Scope by user's college/program
        if ($user->college_id) {
            $query->where('student_info.college_id', $user->college_id);
        }
        if ($user->program_id) {
            $query->where('student_info.program_id', $user->program_id);
        }

        $students = $query->paginate(20); // or use $request->get('per_page', 20)

        // Transform each student to match the React component expectations
        $students->getCollection()->transform(function ($student) {
            $age = $student->student_birthdate ? \Carbon\Carbon::parse($student->student_birthdate)->age : 'N/A';
            $address = trim("{$student->student_address_number} {$student->student_address_street}, {$student->student_address_barangay}, {$student->student_address_city}");
            $address = $address ?: 'N/A';

            return [
                'id'                => $student->student_id,
                'student_number'    => $student->student_number,
                'name'              => "{$student->student_lname}, {$student->student_fname}" . ($student->student_mname ? ' ' . substr($student->student_mname, 0, 1) . '.' : ''),
                'college'           => $student->college?->name ?? 'N/A',
                'program'           => $student->program?->name ?? 'N/A',
                'age'               => $age,
                'sex'               => $student->student_sex ?? 'N/A',
                'socioeconomic'     => $student->student_socioeconomic ?? 'N/A',
                'address'           => $address,
                'living_arrangement'=> $student->living?->name ?? 'N/A',
                'work_status'       => $student->student_work ?? 'N/A',
                'scholarship'       => $student->student_scholarship ?? 'N/A',
                'language'          => $student->language?->name ?? 'N/A',
                'last_school'       => $student->student_last_school ?? 'N/A',
            ];
        });

        return Inertia::render('Student/StudentMasterlist', [
            'students' => $students,
        ]);
    }

    /**
     * PATH 2: The Filtered Result (Shows only what the user searched for)
     */
    public function filteredInfo(Request $request)
    {
        $user = $request->user();

        $query = StudentInfo::query()
            ->with(['college', 'program', 'living', 'language'])
            ->join('student_section', 'student_info.student_number', '=', 'student_section.student_number')
            ->select('student_info.*', 'student_section.academic_year', 'student_section.semester', 'student_section.year_level', 'student_section.section')
            ->where('student_info.is_active', 1)
            ->where('student_section.is_active', 1);

        // --- Unified Filtering Logic ---
        // Use 'college' for Section Mode and 'batch_college' for Batch Mode (or standardize them)
        $collegeId = $request->input('college') ?? $request->input('batch_college');
        $programId = $request->input('program') ?? $request->input('batch_program');

        // 1. Apply Scope (What they are ALLOWED to see)
        if ($user->college_id) {
            $query->where('student_info.college_id', $user->college_id);
        }
        if ($user->program_id) {
            $query->where('student_info.program_id', $user->program_id);
        }

        // 2. Apply Filters (What they WANT to see)
        // If Admin, they can filter any college. If Dean, they are already scoped above.
        if ($request->filled('college')) {
            $query->where('student_info.college_id', $request->college);
        }
        if ($request->filled('program')) {
            $query->where('student_info.program_id', $request->program);
        }
        
        // Section specific filters
        if ($request->filled('academic_year')) {
            $query->where('student_section.academic_year', $request->academic_year);
        }
        if ($request->filled('semester')) {
            $query->where('student_section.semester', $request->semester);
        }
        if ($request->filled('section')) {
            $query->where('student_section.section', $request->section);
        }

        $students = $query->paginate(20)->withQueryString(); // Crucial for pagination to keep filters


        // 🔥 FIX: Properly transform the collection
        $students->getCollection()->transform(function ($student) {
            $age = $student->student_birthdate ? \Carbon\Carbon::parse($student->student_birthdate)->age : 'N/A';
            $address = trim("{$student->student_address_number} {$student->student_address_street}, {$student->student_address_barangay}, {$student->student_address_city}");
            $address = $address ?: 'N/A';

            return [
                'id'                => $student->student_id,
                'student_number'    => $student->student_number,
                'name'              => "{$student->student_lname}, {$student->student_fname}" . ($student->student_mname ? ' ' . substr($student->student_mname, 0, 1) . '.' : ''),
                'college'           => $student->college?->name ?? 'N/A',
                'program'           => $student->program?->name ?? 'N/A',
                'age'               => $age,
                'sex'               => $student->student_sex ?? 'N/A',
                'socioeconomic'     => $student->student_socioeconomic ?? 'N/A',
                'address'           => $address,
                'living_arrangement'=> $student->living?->name ?? 'N/A',
                'work_status'       => $student->student_work ?? 'N/A',
                'scholarship'       => $student->student_scholarship ?? 'N/A',
                'language'          => $student->language?->name ?? 'N/A',
                'last_school'       => $student->student_last_school ?? 'N/A',
            ];
        });

        // Build filter info for display
        $filterData = $request->only(['academic_year', 'semester', 'college', 'program', 'year_level', 'section']);
        if ($request->filled('college')) {
            $filterData['college_name'] = College::find($request->college)?->name;
        }
        if ($request->filled('program')) {
            $filterData['program_name'] = Program::find($request->program)?->name;
        }

        return Inertia::render('Student/StudentInfo', [
            'students' => $students,
            'filters' => $filterData,
        ]);
    }

    public function checkStudent($studentNumber)
    {
        $exists = StudentInfo::where('student_number', $studentNumber)->exists();
        return response()->json(['exists' => $exists]);
    }

    public function create(Request $request)
    {
        $mode = $request->get('mode', 'section');
        $prefilledId = $request->get('prefilledId');

        $context = [];
        if ($mode === 'section') {
            $context = [
                'academic_year' => $request->get('academic_year'),
                'semester'      => $request->get('semester'),
                'college'       => $request->get('college'),
                'program'       => $request->get('program'),
                'year_level'    => $request->get('year_level'),
                'section'       => $request->get('section'),
            ];
        } else {
            $context = [
                'college_id'   => $request->get('college_id'),
                'program_id'   => $request->get('program_id'),
                'year'         => $request->get('year'),
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

    public function enroll(Request $request, EnrollStudentAction $action)
    {
        $validated = $request->validate([
            // Student fields
            'student_number' => 'required|string',
            'first_name'     => 'nullable|string',
            'last_name'      => 'nullable|string',
            'middle_name'    => 'nullable|string',
            'suffix'         => 'nullable|string',
            'birthdate'      => 'nullable|date',
            'sex'            => 'nullable|string',
            'socioeconomic_status' => 'nullable|string',
            'living_arrangement'   => 'nullable|integer',
            'house_no'       => 'nullable|string',
            'street'         => 'nullable|string',
            'barangay'       => 'nullable|string',
            'city'           => 'nullable|string',
            'province'       => 'nullable|string',
            'postal_code'    => 'nullable|string',
            'work_status'    => 'nullable|string',
            'scholarship'    => 'nullable|string',
            'language'       => 'nullable|integer',
            'last_school_type' => 'nullable|string',
            // Mode and context
            'mode'           => 'required|in:section,batch',
            // Section context
            'academic_year'  => 'required_if:mode,section|nullable|string',
            'semester'       => 'required_if:mode,section|nullable|string',
            'section'        => 'required_if:mode,section|nullable|string',
            'year_level'     => 'required_if:mode,section|nullable|integer',
            'college'        => 'required_if:mode,section|nullable|integer',
            'program'        => 'required_if:mode,section|nullable|integer',
            // Batch context
            'batch_college'  => 'required_if:mode,batch|nullable|integer',
            'batch_program'  => 'required_if:mode,batch|nullable|integer',
            'batch_year'     => 'required_if:mode,batch|nullable|integer',
            'batch_number'   => 'required_if:mode,batch|nullable|integer',
        ]);

        $message = $action->execute($validated);

        if ($validated['mode'] === 'section') {
            return redirect()->route('student.info.filter')->with('success', $message);
        } else {
            return redirect()->route('program.metrics.filter')->with('success', $message);
        }
    }

    
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
        return redirect()->back()->with('success', $message);
    }

    public function storeMasterlist(StoreStudentRequest $request, StoreStudentAction $action)
    {
        $message = $action->execute($request->validated());
        return redirect()->route('student.masterlist')->with('success', $message);
}
}