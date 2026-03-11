<?php

namespace App\Actions\Student;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StoreOrEnrollStudentAction
{
    /**
     * Executes the check, create, and enroll logic.
     * * @param array $data The validated request data
     * @return string The status message to return to the UI
     */
    public function execute(array $data): string
    {
        // DB::transaction ensures that if anything fails, NO data is saved.
        return DB::transaction(function () use ($data) {
            $now = Carbon::now()->format('Y-m-d H:i:s');
            $studentNumber = $data['student_number'];

            // 1. Check if the student profile already exists
            $existingStudent = DB::table('student_info')
                ->where('student_number', $studentNumber)
                ->first();

            $message = '';

            if (!$existingStudent) {
                // BRANCH A: Create the permanent profile
                DB::table('student_info')->insert([
                    'student_number' => $studentNumber,
                    'student_fname' => $data['first_name'] ?? 'Unknown',
                    'student_mname' => $data['middle_name'] ?? null,
                    'student_lname' => $data['last_name'] ?? 'Unknown',
                    'student_suffix' => $data['suffix'] ?? null,
                    'college_id' => $data['college'],
                    'program_id' => $data['program'],
                    'student_birthdate' => $data['birthdate'] ?? null,
                    'student_sex' => $data['sex'] ?? null,
                    'student_socioeconomic' => $data['socioeconomic_status'] ?? null,
                    'student_living' => $data['living_arrangement'] ?? null,
                    'student_address_number' => $data['house_no'] ?? null,
                    'student_address_street' => $data['street'] ?? null,
                    'student_address_barangay' => $data['barangay'] ?? null,
                    'student_address_city' => $data['city'] ?? null,
                    'student_address_province' => $data['province'] ?? null,
                    'student_address_postal' => $data['postal_code'] ?? null,
                    'student_work' => $data['work_status'] ?? null,
                    'student_scholarship' => $data['scholarship'] ?? null,
                    'student_language' => $data['language'] ?? null,
                    'student_last_school' => $data['last_school_type'] ?? null,
                    'date_created' => $now,
                    'is_active' => 1,
                ]);
                
                $message = 'New student profile created and enrolled successfully!';
            } else {
                // BRANCH B: Profile exists
                $message = 'Existing student found! Added to the new section successfully.';
            }

            // 2. Check if they are already enrolled in this exact Sem/Year
            $existingEnrollment = DB::table('student_section')
                ->where('student_number', $studentNumber)
                ->where('academic_year', $data['academic_year'])
                ->where('semester', $data['semester'])
                ->first();

            // 3. Enroll them!
            if (!$existingEnrollment) {
                DB::table('student_section')->insert([
                    'student_number' => $studentNumber,
                    'section' => $data['section'],
                    'year_level' => $data['year_level'],
                    'program_id' => $data['program'],
                    'semester' => $data['semester'],
                    'academic_year' => $data['academic_year'],
                    'date_created' => $now,
                    'is_active' => 1,
                ]);
            } else {
                $message = 'Student is already enrolled in this semester and academic year!';
            }

            return $message;
        });
    }
}