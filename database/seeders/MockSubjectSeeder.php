<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MockSubjectSeeder extends Seeder
{
    public function run(): void
    {
        $subjects = [
            // Psychology (7)
            ['program_id' => 7, 'mock_subject_name' => 'Developmental Psychology'],
            ['program_id' => 7, 'mock_subject_name' => 'Abnormal Psychology'],
            ['program_id' => 7, 'mock_subject_name' => 'Psychological Assessment'],
            ['program_id' => 7, 'mock_subject_name' => 'Experimental Psychology'],
            // Biology (12)
            ['program_id' => 12, 'mock_subject_name' => 'Microbiology'],
            ['program_id' => 12, 'mock_subject_name' => 'Genetics'],
            ['program_id' => 12, 'mock_subject_name' => 'Cell and Molecular Bio'],
        ];

        foreach ($subjects as $subject) {
            DB::table('mock_subjects')->insert([
                'program_id' => $subject['program_id'],
                'mock_subject_name' => $subject['mock_subject_name'],
                'date_created' => now(),
                'is_active' => 1,
            ]);
        }
    }
}