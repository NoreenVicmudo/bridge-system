<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StudentBackSubjectSeeder extends Seeder
{
    public function run(): void
    {
        $students = DB::table('student_programs')
            ->where('status', 'Active')
            ->get();

        foreach ($students as $student) {
            $generalSubjects = DB::table('general_subjects')
                ->where('program_id', $student->program_id)
                ->where('is_active', 1)
                ->get();

            // 🧠 THE FIX: If this program doesn't have any subjects seeded yet, skip this student!
            if ($generalSubjects->isEmpty()) {
                continue;
            }

            // Safely calculate how many subjects to pick (max 2, or 1 if the program only has 1 subject)
            $take = min(2, $generalSubjects->count());
            
            // Randomly select 1 or 2 subjects for this student to have a "retake" record on
            $randomSubjects = $generalSubjects->random(rand(1, $take));

            foreach ($randomSubjects as $subject) {
                $exists = DB::table('student_back_subjects')
                    ->where('student_number', $student->student_number)
                    ->where('general_subject_id', $subject->general_subject_id)
                    ->exists();

                if (!$exists) {
                    DB::table('student_back_subjects')->insert([
                        'student_number'     => $student->student_number,
                        'general_subject_id' => $subject->general_subject_id,
                        'terms_repeated'     => rand(1, 3), // Repeated 1 to 3 times
                        'date_created'       => now(),
                        'is_active'          => 1,
                    ]);
                }
            }
        }
    }
}