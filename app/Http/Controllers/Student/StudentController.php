<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Student\StudentInfo;
use Illuminate\Http\Request;
use Inertia\Inertia;
// use App\Models\Student; // We will create this model in a second!

class StudentController extends Controller
{
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

        $students = $query->paginate(10)->through(function ($student) {
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

        // We wrap it in a 'data' array so it mimics standard Laravel Pagination, 
        // which your React data.data.map() is expecting!
        return Inertia::render('Student/StudentMasterlist', [
            'students' => ['data' => $students] 
        ]);
    }

    /**
     * PATH 2: The Filtered Result (Shows only what the user searched for)
     */
    public function filteredInfo(Request $request)
    {
        $query = StudentInfo::query()
            ->join('student_section', 'student_info.student_number', '=', 'student_section.student_number')
            ->select('student_info.*', 'student_section.section', 'student_section.year_level');

        // Apply the exact filters sent from StudentInfoFilter.jsx
        if ($request->filled('college')) {
            $query->where('student_info.college_id', $request->college);
        }
        if ($request->filled('program')) {
            $query->where('student_info.program_id', $request->program);
        }
        if ($request->filled('year_level')) {
            $query->where('student_section.year_level', $request->year_level);
        }
        if ($request->filled('section')) {
            $query->where('student_section.section', $request->section);
        }

        return Inertia::render('StudentInfo', [
            'students' => $query->get(),
            'filters' => $request->all() // Send the filters back so the UI knows what was searched
        ]);
    }
}