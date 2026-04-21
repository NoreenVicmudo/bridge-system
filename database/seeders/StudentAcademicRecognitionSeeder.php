<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StudentAcademicRecognitionSeeder extends Seeder
{
    public function run(): void
    {
        $students = DB::table('student_programs')->where('status', 'Active')->get();

        foreach ($students as $student) {
            $exists = DB::table('student_academic_recognition')
                ->where('student_number', $student->student_number)
                ->where('program_id', $student->program_id)
                ->exists();

            if (!$exists) {
                // Randomize award count (0 to 6 times on the Dean's List)
                $count = rand(0, 6);

                if ($count > 0) {
                    DB::table('student_academic_recognition')->insert([
                        'student_number' => $student->student_number,
                        'program_id'     => $student->program_id,
                        'award_count'    => $count,
                        'date_created'   => now(),
                        'is_active'      => 1,
                    ]);
                }
            }
        }
    }
}