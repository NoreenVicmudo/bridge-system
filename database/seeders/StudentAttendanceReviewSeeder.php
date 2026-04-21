<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StudentAttendanceReviewSeeder extends Seeder
{
    public function run(): void
    {
        $students = DB::table('student_programs')->where('status', 'Active')->get();

        foreach ($students as $student) {
            $exists = DB::table('student_attendance_reviews')
                ->where('student_number', $student->student_number)
                ->where('program_id', $student->program_id)
                ->exists();

            if (!$exists) {
                $totalSessions = 20;
                $attended = rand(12, 20); // They attended between 12 and 20 sessions

                DB::table('student_attendance_reviews')->insert([
                    'student_number'    => $student->student_number,
                    'program_id'        => $student->program_id,
                    'sessions_total'    => $totalSessions,
                    'sessions_attended' => $attended,
                    'date_created'      => now(),
                    'is_active'         => 1,
                ]);
            }
        }
    }
}