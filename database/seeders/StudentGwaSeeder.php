<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StudentGwaSeeder extends Seeder
{
    public function run(): void
    {
        $students = DB::table('student_programs')
            ->where('status', 'Active')
            ->get();

        $semesters = ['1', '2'];

        foreach ($students as $student) {
            // Simulate 4 years of grades
            for ($year = 1; $year <= 4; $year++) {
                foreach ($semesters as $sem) {
                    $exists = DB::table('student_gwa')
                        ->where('student_number', $student->student_number)
                        ->where('year_level', $year)
                        ->where('semester', $sem)
                        ->exists();

                    if (!$exists) {
                        // Generate a GWA between 1.00 and 3.00 (Standard PH Grading)
                        $gwa = rand(100, 300) / 100;

                        DB::table('student_gwa')->insert([
                            'student_number' => $student->student_number,
                            'program_id'     => $student->program_id,
                            'year_level'     => $year,
                            'semester'       => $sem,
                            'gwa'            => $gwa,
                            'date_created'   => now(),
                            'is_active'      => 1,
                        ]);
                    }
                }
            }
        }
    }
}