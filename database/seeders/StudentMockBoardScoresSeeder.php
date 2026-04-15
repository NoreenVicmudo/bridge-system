<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StudentMockBoardScoresSeeder extends Seeder
{
    public function run(): void
    {
        $students = DB::table('student_programs')
            ->where('status', 'Active')
            ->get();

        $examPeriods = ['Default', 'Diagnostic', 'Pre-Test', 'Midterm', 'Post-Test'];
        $years = range(2022, 2026); // 2022, 2023, 2024, 2025, 2026

        foreach ($students as $student) {
            // Pick a random year for this student's board batch
            $randomYear = $years[array_rand($years)];

            // 1. Find or create a board_batch for this student + program + year
            $batch = DB::table('board_batch')
                ->where('student_number', $student->student_number)
                ->where('program_id', $student->program_id)
                ->where('year', $randomYear)
                ->first();

            if (!$batch) {
                $batchId = DB::table('board_batch')->insertGetId([
                    'student_number' => $student->student_number,
                    'year'           => $randomYear,
                    'program_id'     => $student->program_id,
                    'batch_number'   => 1, // you can increment if multiple batches per year, but here we keep 1
                    'date_created'   => now(),
                    'is_active'      => 1,
                ]);
            } else {
                $batchId = $batch->batch_id;
            }

            // 2. Get mock subjects for this program
            $subjects = DB::table('mock_subjects')
                ->where('program_id', $student->program_id)
                ->where('is_active', 1)
                ->get();

            // 3. Insert scores for each subject + exam period
            foreach ($subjects as $subject) {
                foreach ($examPeriods as $period) {
                    $exists = DB::table('student_mock_board_scores')
                        ->where('batch_id', $batchId)
                        ->where('mock_subject_id', $subject->mock_subject_id)
                        ->where('exam_period', $period)
                        ->exists();

                    if (!$exists) {
                        DB::table('student_mock_board_scores')->insert([
                            'batch_id'         => $batchId,
                            'mock_subject_id'  => $subject->mock_subject_id,
                            'score'            => rand(50, 100), // percentage score
                            'exam_period'      => $period,
                            'date_created'     => now(),
                            'is_active'        => 1,
                        ]);
                    }
                }
            }
        }
    }
}