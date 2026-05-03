<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StudentActualBoardScoresSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Get all existing board batches (created by your Mock Seeder)
        $batches = DB::table('board_batch')
            ->where('is_active', 1)
            ->get();

        $recordsInserted = 0;

        foreach ($batches as $batch) {
            // 2. Get the Master PRC subjects (from mock_subjects) for this program
            $subjects = DB::table('mock_subjects')
                ->where('program_id', $batch->program_id)
                ->where('is_active', 1)
                ->get();

            // 3. Insert exactly ONE Actual Board Score per subject for this student
            foreach ($subjects as $subject) {
                
                // Prevent duplicate seeding
                $exists = DB::table('student_actual_board_scores')
                    ->where('batch_id', $batch->batch_id)
                    ->where('mock_subject_id', $subject->mock_subject_id)
                    ->exists();

                if (!$exists) {
                    DB::table('student_actual_board_scores')->insert([
                        'batch_id'         => $batch->batch_id,
                        'mock_subject_id'  => $subject->mock_subject_id,
                        // Generating realistic board scores between 65 and 95
                        'score'            => rand(65, 95) + (rand(0, 99) / 100), 
                        'date_created'     => now(),
                        'is_active'        => 1,
                    ]);
                    
                    $recordsInserted++;
                }
            }
        }

        $this->command->info("Successfully seeded {$recordsInserted} Actual Board Scores!");
    }
}