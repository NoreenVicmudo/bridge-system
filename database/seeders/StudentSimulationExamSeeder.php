<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StudentSimulationExamSeeder extends Seeder
{
    public function run(): void
    {
        $students = DB::table('student_programs')
            ->where('status', 'Active')
            ->get();

        $examPeriods = ['Default', 'Diagnostic', 'Pre-Test', 'Midterm', 'Post-Test'];

        foreach ($students as $student) {
            $exams = DB::table('simulation_exams')
                ->where('program_id', $student->program_id)
                ->where('is_active', 1)
                ->get();

            foreach ($exams as $exam) {
                foreach ($examPeriods as $period) {
                    $exists = DB::table('student_simulation_exam')
                        ->where('student_number', $student->student_number)
                        ->where('simulation_id', $exam->simulation_id)
                        ->where('exam_period', $period)
                        ->exists();

                    if (!$exists) {
                        $total = 100;
                        $score = rand(68, 100);
                        DB::table('student_simulation_exam')->insert([
                            'student_number' => $student->student_number,
                            'simulation_id'  => $exam->simulation_id,
                            'student_score'  => $score,
                            'exam_period'    => $period,
                            'date_created'   => now(),
                            'is_active'      => 1,
                        ]);
                    }
                }
            }
        }
    }
}