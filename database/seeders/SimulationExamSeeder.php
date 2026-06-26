<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SimulationExamSeeder extends Seeder
{
    public function run(): void
    {
        $exams = [
            // Psychology (Program 7)
            ['program_id' => 7, 'simulation_name' => 'Psychometrician Mock 1'],
            ['program_id' => 7, 'simulation_name' => 'Psychometrician Mock 2'],
            ['program_id' => 7, 'simulation_name' => 'Clinical Case Sim'],
        ];

        foreach ($exams as $exam) {
            DB::table('simulation_exams')->insert([
                'program_id'      => $exam['program_id'],
                'simulation_name' => $exam['simulation_name'],
                'date_created'    => now(),
                'is_active'       => 1,
            ]);
        }
    }
}