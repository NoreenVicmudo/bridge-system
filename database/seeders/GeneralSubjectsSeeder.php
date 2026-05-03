<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GeneralSubjectsSeeder extends Seeder
{
    public function run()
    {
        // Program IDs
        $psychologyId = 7;
        $biologyId = 12;

        $subjects = [
            // Psychology subjects (program_id = 7)
            ['general_subject_name' => 'Abnormal Psychology', 'program_id' => $psychologyId],
            ['general_subject_name' => 'Cognitive Psychology', 'program_id' => $psychologyId],
            ['general_subject_name' => 'Developmental Psychology', 'program_id' => $psychologyId],
            ['general_subject_name' => 'Social Psychology', 'program_id' => $psychologyId],
            ['general_subject_name' => 'Psychological Assessment', 'program_id' => $psychologyId],
            ['general_subject_name' => 'Biological Psychology', 'program_id' => $psychologyId],
            ['general_subject_name' => 'Industrial/Organizational Psychology', 'program_id' => $psychologyId],
            ['general_subject_name' => 'Experimental Psychology', 'program_id' => $psychologyId],
            ['general_subject_name' => 'Statistics for Psychology', 'program_id' => $psychologyId],
            ['general_subject_name' => 'Theories of Personality', 'program_id' => $psychologyId],

            // Biology subjects (program_id = 12)
            ['general_subject_name' => 'General Biology I', 'program_id' => $biologyId],
            ['general_subject_name' => 'General Biology II', 'program_id' => $biologyId],
            ['general_subject_name' => 'Cell Biology', 'program_id' => $biologyId],
            ['general_subject_name' => 'Genetics', 'program_id' => $biologyId],
            ['general_subject_name' => 'Ecology', 'program_id' => $biologyId],
            ['general_subject_name' => 'Microbiology', 'program_id' => $biologyId],
            ['general_subject_name' => 'Molecular Biology', 'program_id' => $biologyId],
            ['general_subject_name' => 'Biochemistry', 'program_id' => $biologyId],
            ['general_subject_name' => 'Evolutionary Biology', 'program_id' => $biologyId],
            ['general_subject_name' => 'Plant Physiology', 'program_id' => $biologyId],
        ];

        foreach ($subjects as $subject) {
            DB::table('general_subjects')->insert([
                'general_subject_name' => $subject['general_subject_name'],
                'program_id' => $subject['program_id'],
                'date_created' => now(),
                'is_active' => true,
            ]);
        }
    }
}