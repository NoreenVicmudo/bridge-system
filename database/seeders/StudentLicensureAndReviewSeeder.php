<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StudentLicensureAndReviewSeeder extends Seeder
{
    public function run(): void
    {
        $batches = DB::table('board_batch')->where('is_active', 1)->get();

        $centers = ['Pioneer Review Center', 'Topnotch Review', 'Alpha Center', 'Excel Review', 'Self-Study'];
        $results = ['PASSED', 'PASSED', 'PASSED', 'FAILED', 'N/A']; // Skewed towards passing

        foreach ($batches as $batch) {
            
            // 1. Seed Review Center
            $centerExists = DB::table('student_review_center')->where('batch_id', $batch->batch_id)->exists();
            if (!$centerExists) {
                DB::table('student_review_center')->insert([
                    'batch_id'      => $batch->batch_id,
                    'review_center' => $centers[array_rand($centers)],
                    'date_created'  => now(),
                    'is_active'     => 1,
                ]);
            }

            // 2. Seed Licensure Result
            $examExists = DB::table('student_licensure_exam')->where('batch_id', $batch->batch_id)->exists();
            if (!$examExists) {
                
                // Random date within the last year
                $examDate = \Carbon\Carbon::now()->subDays(rand(10, 300))->format('Y-m-d');
                $result = $results[array_rand($results)];

                DB::table('student_licensure_exam')->insert([
                    'batch_id'        => $batch->batch_id,
                    'exam_result'     => $result,
                    'exam_date_taken' => $result !== 'N/A' ? $examDate : null,
                    'date_created'    => now(),
                    'is_active'       => 1,
                ]);
            }
        }
    }
}