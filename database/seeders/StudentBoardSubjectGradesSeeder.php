<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StudentBoardSubjectGradesSeeder extends Seeder
{
    public function run(): void
    {
        // Get all active students with their current program
        $students = DB::table('student_programs')
            ->where('status', 'Active')
            ->get();

        foreach ($students as $student) {
            // Get board subjects for this student's program
            $subjects = DB::table('board_subjects')
                ->where('program_id', $student->program_id)
                ->where('is_active', 1)
                ->get();

            foreach ($subjects as $subject) {
                // Check if grade already exists to avoid duplicates
                $exists = DB::table('student_board_subjects_grades')
                    ->where('student_number', $student->student_number)
                    ->where('subject_id', $subject->subject_id)
                    ->exists();

                if (!$exists) {
                    DB::table('student_board_subjects_grades')->insert([
                        'student_number' => $student->student_number,
                        'subject_id'     => $subject->subject_id,
                        'subject_grade'  => rand(70, 100), // percentage grade
                        'date_created'   => now(),
                        'is_active'      => 1,
                    ]);
                }
            }
        }
    }
}