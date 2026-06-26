<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BoardSubjectSeeder extends Seeder
{
    public function run(): void
    {
        $subjects = [
            // Psychology (Program 7)
            ['program_id' => 7, 'subject_name' => 'Developmental Psychology'],
            ['program_id' => 7, 'subject_name' => 'Psychological Assessment'],
            ['program_id' => 7, 'subject_name' => 'Abnormal Psychology'],
            ['program_id' => 7, 'subject_name' => 'Experimental Psychology'],
        ];

        foreach ($subjects as $subject) {
            DB::table('board_subjects')->insert([
                'program_id' => $subject['program_id'],
                'subject_name' => $subject['subject_name'],
                'date_created' => now(),
                'is_active' => 1,
            ]);
        }
    }
}