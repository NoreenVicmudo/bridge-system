<?php

namespace App\Http\Controllers\Student;

use App\Actions\Student\ImportStudentsAction;
use App\Actions\Student\StoreOrEnrollStudentAction;
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
    public function store(StoreStudentRequest $request, StoreOrEnrollStudentAction $action)
    {
        $message = $action->execute($request->validated());

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
            ->join('student_section', 'student_info.student_number', '=', 'student_section.student_number')
            ->join('colleges', 'student_info.college_id', '=', 'colleges.college_id')
            ->join('programs', 'student_info.program_id', '=', 'programs.program_id')
            ->leftJoin('living_arrangements', 'student_info.student_living', '=', 'living_arrangements.id')
            ->leftJoin('languages', 'student_info.student_language', '=', 'languages.id')
            ->select(
                'student_info.*', 
                'colleges.name as college_name',
                'programs.name as program_name',
                'living_arrangements.name as living_name',
                'languages.name as language_name'
            );

        if ($user->college_id) {
            $query->where('student_info.college_id', $user->college_id);
        }
        if ($user->program_id) {
            $query->where('student_info.program_id', $user->program_id);
        }

        $students = $query->get()->map(function ($student) {
            // Calculate Age from Birthdate
            $age = $student->student_birthdate ? \Carbon\Carbon::parse($student->student_birthdate)->age : 'N/A';
            
            // Format Address
            $address = trim("{$student->student_address_number} {$student->student_address_street}, {$student->student_address_barangay}, {$student->student_address_city}");

            return [
                'id' => $student->student_id,
                'student_number' => $student->student_number,
                // Combine names into a single string for the table
                'name' => "{$student->student_lname}, {$student->student_fname} " . ($student->student_mname ? substr($student->student_mname, 0, 1) . '.' : ''),
                'college' => $student->college_name,
                'program' => $student->program_name,
                'age' => $age,
                'sex' => $student->student_sex ?: 'N/A',
                'socioeconomic' => $student->student_socioeconomic ?: 'N/A',
                'address' => $address ?: 'N/A',
                'living_arrangement' => $student->living_name ?: 'N/A',
                'work_status' => $student->student_work ?: 'N/A',
                'scholarship' => $student->student_scholarship ?: 'N/A',
                'language' => $student->language_name ?: 'N/A',
                'last_school' => $student->student_last_school ?: 'N/A',
            ];
        });

        return Inertia::render('Student/StudentMasterlist', [
            'students' => ['data' => $students] 
        ]);
    }

    /**
     * PATH 2: The Filtered Result (Shows only what the user searched for)
     */
    public function filteredInfo(Request $request)
    {
        $user = $request->user();

        $safeCollege = $request->college;
        $safeProgram = $request->program;

        if ($user->college_id) {
            $safeCollege = $user->college_id;
        }
        if ($user->program_id) {
            $safeProgram = $user->program_id;
        }

        // 2. Join all the necessary tables just like the Masterlist
        $query = StudentInfo::query()
            ->join('student_section', 'student_info.student_number', '=', 'student_section.student_number')
            ->join('colleges', 'student_info.college_id', '=', 'colleges.college_id')
            ->join('programs', 'student_info.program_id', '=', 'programs.program_id')
            ->leftJoin('living_arrangements', 'student_info.student_living', '=', 'living_arrangements.id')
            ->leftJoin('languages', 'student_info.student_language', '=', 'languages.id')
            ->select(
                'student_info.*', 
                'student_section.section', 
                'student_section.year_level',
                'student_section.semester',
                'student_section.academic_year',
                'colleges.name as college_name',
                'programs.name as program_name',
                'living_arrangements.name as living_name',
                'languages.name as language_name'
            );

        // 3. Apply ALL the filters perfectly (Using our SAFE variables)
        if ($request->filled('academic_year')) {
            $query->where('student_section.academic_year', $request->academic_year);
        }
        if ($request->filled('semester')) {
            $query->where('student_section.semester', $request->semester);
        }
        if ($safeCollege) {
            $query->where('student_info.college_id', $safeCollege);
        }
        if ($safeProgram) {
            $query->where('student_info.program_id', $safeProgram);
        }
        if ($request->filled('year_level')) {
            $query->where('student_section.year_level', $request->year_level);
        }
        if ($request->filled('section')) {
            $query->where('student_section.section', $request->section);
        }

        // 4. Format the data so React can read it (just like Masterlist)
        $students = $query->get()->map(function ($student) {
            $age = $student->student_birthdate ? \Carbon\Carbon::parse($student->student_birthdate)->age : 'N/A';
            $address = trim("{$student->student_address_number} {$student->student_address_street}, {$student->student_address_barangay}, {$student->student_address_city}");

            return [
                'id' => $student->student_id,
                'student_number' => $student->student_number,
                'name' => "{$student->student_lname}, {$student->student_fname} " . ($student->student_mname ? substr($student->student_mname, 0, 1) . '.' : ''),
                'college' => $student->college_name,
                'program' => $student->program_name,
                'age' => $age,
                'sex' => $student->student_sex ?: 'N/A',
                'socioeconomic' => $student->student_socioeconomic ?: 'N/A',
                'address' => $address ?: 'N/A',
                'living_arrangement' => $student->living_name ?: 'N/A',
                'work_status' => $student->student_work ?: 'N/A',
                'scholarship' => $student->student_scholarship ?: 'N/A',
                'language' => $student->language_name ?: 'N/A',
                'last_school' => $student->student_last_school ?: 'N/A',
            ];
        });

        // 5. Build the UI Filter Card Data securely!
        $filterData = $request->all();
        
        // Translate the SAFE College ID to Name for the UI Card
        if ($safeCollege) {
            $filterData['college'] = $safeCollege; // Force the filter object to hold the secure ID
            $college = College::find($safeCollege);
            $filterData['college_name'] = $college ? $college->name : null;
        }

        // Translate the SAFE Program ID to Name for the UI Card
        if ($safeProgram) {
            $filterData['program'] = $safeProgram; // Force the filter object to hold the secure ID
            $program = Program::find($safeProgram);
            $filterData['program_name'] = $program ? $program->name : null;
        }

        return Inertia::render('Student/StudentInfo', [
            'students' => $students,
            'filters' => $filterData ,
            'dbColleges' => College::where('is_active', true)->get(),
            'dbPrograms' => Program::where('is_active', true)->get(),
        ]);
    }

    public function checkStudent($studentNumber)
    {
        // Simply checks if a row exists with that student number
        $exists = DB::table('student_info')->where('student_number', $studentNumber)->exists();
        
        return response()->json(['exists' => $exists]);
    }

    public function create(Request $request)
    {
        // 1. Fetch Colleges
        $colleges = \App\Models\College::where('is_active', true)
            ->get()
            ->map(fn($c) => ['value' => $c->college_id, 'label' => $c->name]);

        // 2. Fetch Programs grouped by College (for your dynamic dropdown logic)
        $programs = \App\Models\Program::where('is_active', true)
            ->get()
            ->groupBy('college_id')
            ->map(function ($group) {
                return $group->map(fn($p) => ['value' => $p->program_id, 'label' => $p->name]);
            });

        // 3. Fetch Living Arrangements & Languages
        $livingArrangements = \DB::table('living_arrangements')
            ->select('id as value', 'name as label')
            ->get();

        $languages = \DB::table('languages')
            ->select('id as value', 'name as label')
            ->get();

        // 4. Send everything to the React Page
        return Inertia::render('Student/StudentEntryPage', [
            'prefilledId' => $request->prefilledId,
            'options' => [
                'colleges' => $colleges,
                'programs' => $programs,
                'livingArrangements' => $livingArrangements,
                'languages' => $languages,
            ]
        ]);
    }
}