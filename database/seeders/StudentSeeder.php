<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        // 1. A Psychology Student (College 6, Program 7) - The Assistant will see this one!
        DB::table('student_info')->insert([
            'student_id' => 1,
            'student_number' => '2025-0001',
            'student_fname' => 'Juan',
            'student_mname' => 'Dela',
            'student_lname' => 'Cruz',
            'college_id' => 6, // CAS
            'program_id' => 7, // Psychology
            'student_birthdate' => '2004-05-15',
            'student_sex' => 'Male',
            'student_socioeconomic' => 'MIDDLE CLASS',
            'student_address_number' => '123',
            'student_address_street' => 'Rizal St.',
            'student_address_barangay' => 'Brgy. 1',
            'student_address_city' => 'Caloocan City',
            'student_living' => 1, // Living with Parents
            'student_work' => 'Full-time Student',
            'student_scholarship' => 'Academic Scholar',
            'student_language' => 3, // Bilingual
            'student_last_school' => 'MCU SHS',
            'date_created' => Carbon::now(),
            'is_active' => 1,
        ]);

        DB::table('student_section')->insert([
            'enroll_id' => 1,
            'student_number' => '2025-0001',
            'section' => 'PSYCH-2A',
            'year_level' => 2,
            'program_id' => 7,
            'semester' => '1st',
            'academic_year' => '2025-2026',
            'date_created' => Carbon::now(),
            'is_active' => 1,
        ]);

        // 2. A Nursing Student (College 2, Program 3) - The CAS Assistant will NOT see this one!
        DB::table('student_info')->insert([
            'student_id' => 2,
            'student_number' => '2025-0002',
            'student_fname' => 'Maria',
            'student_mname' => 'Santos',
            'student_lname' => 'Clara',
            'college_id' => 2, // Nursing
            'program_id' => 3, // BS Nursing
            'student_birthdate' => '2005-08-20',
            'student_sex' => 'Female',
            'student_socioeconomic' => 'POOR',
            'student_address_city' => 'Malabon City',
            'student_living' => 3, // Dormitory
            'student_language' => 2, // Filipino
            'date_created' => Carbon::now(),
            'is_active' => 1,
        ]);

        DB::table('student_section')->insert([
            'enroll_id' => 2,
            'student_number' => '2025-0002',
            'section' => 'BSN-1C',
            'year_level' => 1,
            'program_id' => 3,
            'semester' => '1st',
            'academic_year' => '2025-2026',
            'date_created' => Carbon::now(),
            'is_active' => 1,
        ]);
    }
}