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

        // Income ranges based on 2025 PSA data
        $incomeRanges = [
            ['status' => 'Poor', 'min' => null, 'max' => 14560],
            ['status' => 'Low Income', 'min' => 14560, 'max' => 29120],
            ['status' => 'Lower Middle Class', 'min' => 29120, 'max' => 58240],
            ['status' => 'Middle Class', 'min' => 58240, 'max' => 116480],
            ['status' => 'Upper Middle Class', 'min' => 116480, 'max' => 232960],
            ['status' => 'Upper Income', 'min' => 232960, 'max' => 465920],
            ['status' => 'Rich', 'min' => 465920, 'max' => null],
        ];

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
        $programsBatch = [];

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

                        // Formats as "1-1", "1-2", "2-1"
                        $sectionName = "{$yearLevel}-{$sectionNum}";

                        // 10 STUDENTS PER SECTION
                        for ($i = 0; $i < 10; $i++) {

                            $studentNumber = '2025-' . str_pad($studentCounter, 5, '0', STR_PAD_LEFT);
                            $now = Carbon::now()->format('Y-m-d H:i:s');

                            // Pick random income range
                            $range = $faker->randomElement($incomeRanges);
                            $income = null;

                            if ($range['min'] === null && $range['max'] !== null) {
                                // Poor: 0 to max
                                $income = $faker->numberBetween(0, $range['max']);
                            } elseif ($range['max'] === null && $range['min'] !== null) {
                                // Rich: min to min + 200,000 (capped at 1,000,000)
                                $income = $faker->numberBetween($range['min'], min($range['min'] + 200000, 1000000));
                            } else {
                                // Normal range
                                $income = $faker->numberBetween($range['min'], $range['max']);
                            }

                            // Build the Profile (NO college_id or program_id)
                            $infoBatch[] = [
                                'student_number' => $studentNumber,
                                'student_fname' => $faker->firstName,
                                'student_mname' => $faker->lastName,
                                'student_lname' => $faker->lastName,
                                'student_birthdate' => $faker->dateTimeBetween($birthYearStart, $birthYearEnd)->format('Y-m-d'),
                                'student_sex' => $faker->randomElement(['Male', 'Female']),
                                'student_socioeconomic' => $income,
                                'student_address_number' => $faker->buildingNumber,
                                'student_address_street' => $faker->streetName,
                                'student_address_barangay' => 'Brgy. ' . $faker->numberBetween(1, 100),
                                'student_address_city' => $faker->city,
                                'student_living' => $faker->numberBetween(1, 4),
                                'student_work' => $faker->randomElement(['Full-time', 'Part-time', 'Not Working']),
                                'student_scholarship' => $faker->randomElement(['None', 'Internal', 'External']),
                                'student_language' => $faker->numberBetween(1, 4),
                                'student_last_school' => $faker->randomElement(['Private', 'Public']),
                                'date_created' => $now,
                                'is_active' => 1,
                            ];

                            // Build the Enrollment Record (includes program_id)
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

                            // Build the student_programs pivot entry (Active status)
                            $programsBatch[] = [
                                'student_number' => $studentNumber,
                                'program_id' => $program->program_id,
                                'status' => 'Active',
                                'created_at' => $now,
                                'updated_at' => $now,
                            ];

                            $studentCounter++;

                            // BULK INSERT: Once we hit 500 students, insert them to save memory
                            if (count($infoBatch) >= 500) {
                                DB::table('student_info')->insert($infoBatch);
                                DB::table('student_section')->insert($sectionBatch);
                                DB::table('student_programs')->insert($programsBatch);
                                $infoBatch = [];
                                $sectionBatch = [];
                                $programsBatch = [];
                            }
                        }
                    }
                }
            }
        }

        // Insert any remaining students
        if (count($infoBatch) > 0) {
            DB::table('student_info')->insert($infoBatch);
            DB::table('student_section')->insert($sectionBatch);
            DB::table('student_programs')->insert($programsBatch);
        }
    }
}