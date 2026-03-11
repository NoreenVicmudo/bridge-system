<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Faker\Factory as Faker;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('en_PH'); 

        // 1. Get CAS (College 6) Programs
        $casPrograms = DB::table('programs')->where('college_id', 6)->get();

        // 2. Get ONE random College that is NOT CAS
        $randomCollege = DB::table('colleges')->where('college_id', '!=', 6)->inRandomOrder()->first();
        $randomPrograms = $randomCollege ? DB::table('programs')->where('college_id', $randomCollege->college_id)->get() : collect();

        // Merge them together
        $allProgramsToSeed = $casPrograms->merge($randomPrograms);

        $studentCounter = 1;
        
        // Arrays to hold bulk insert data
        $infoBatch = [];
        $sectionBatch = [];

        foreach ($allProgramsToSeed as $program) {
            // PER YEAR (Years 1 to 4)
            for ($yearLevel = 1; $yearLevel <= 4; $yearLevel++) {
                
                // Calculate a realistic birth year based on their Year Level (e.g., Year 1 = ~18 years old)
                $birthYearStart = '-' . (17 + $yearLevel) . ' years';
                $birthYearEnd = '-' . (16 + $yearLevel) . ' years';

                // PER SEMESTER
                foreach (['1st', '2nd'] as $semester) {
                    
                    // AT LEAST 3 SECTIONS
                    for ($sectionNum = 1; $sectionNum <= 3; $sectionNum++) {
                        
                        // Formats as "1-1", "1-2", "2-1", exactly as you requested!
                        $sectionName = "{$yearLevel}-{$sectionNum}"; 

                        // 10 STUDENTS PER SECTION
                        for ($i = 0; $i < 10; $i++) {
                            
                            $studentNumber = '2025-' . str_pad($studentCounter, 5, '0', STR_PAD_LEFT);
                            $now = Carbon::now()->format('Y-m-d H:i:s');

                            // Build the Profile Profile
                            $infoBatch[] = [
                                'student_number' => $studentNumber,
                                'student_fname' => $faker->firstName,
                                'student_mname' => $faker->lastName,
                                'student_lname' => $faker->lastName,
                                'college_id' => $program->college_id,
                                'program_id' => $program->program_id,
                                'student_birthdate' => $faker->dateTimeBetween($birthYearStart, $birthYearEnd)->format('Y-m-d'),
                                'student_sex' => $faker->randomElement(['Male', 'Female']),
                                'student_socioeconomic' => $faker->randomElement(['POOR', 'LOW INCOME', 'MIDDLE CLASS', 'UPPER MIDDLE', 'RICH']),
                                'student_address_number' => $faker->buildingNumber,
                                'student_address_street' => $faker->streetName,
                                'student_address_barangay' => 'Brgy. ' . $faker->numberBetween(1, 100),
                                'student_address_city' => $faker->city,
                                'student_living' => $faker->numberBetween(1, 4),
                                'student_work' => $faker->randomElement(['Full-time Student', 'Working Student', 'None']),
                                'student_scholarship' => $faker->randomElement(['None', 'Academic Scholar', 'Athletic Scholar']),
                                'student_language' => $faker->numberBetween(1, 4),
                                'student_last_school' => 'MCU SHS',
                                'date_created' => $now,
                                'is_active' => 1,
                            ];

                            // Build the Enrollment Record
                            $sectionBatch[] = [
                                'student_number' => $studentNumber,
                                'section' => $sectionName,
                                'year_level' => $yearLevel,
                                'program_id' => $program->program_id,
                                'semester' => $semester,
                                'academic_year' => '2025-2026',
                                'date_created' => $now,
                                'is_active' => 1,
                            ];

                            $studentCounter++;

                            // BULK INSERT: Once we hit 500 students, insert them to save memory and speed up the process
                            if (count($infoBatch) >= 500) {
                                DB::table('student_info')->insert($infoBatch);
                                DB::table('student_section')->insert($sectionBatch);
                                $infoBatch = [];
                                $sectionBatch = [];
                            }
                        }
                    }
                }
            }
        }

        // Insert any remaining students that didn't hit the 500-count threshold
        if (count($infoBatch) > 0) {
            DB::table('student_info')->insert($infoBatch);
            DB::table('student_section')->insert($sectionBatch);
        }
    }
}