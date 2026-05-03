<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            // ... your other seeders ...
            StudentGwaSeeder::class,
            StudentBackSubjectSeeder::class,
            StudentSimulationExamSeeder::class,
            StudentAttendanceReviewSeeder::class,
            StudentAcademicRecognitionSeeder::class,
            StudentLicensureAndReviewSeeder::class,
            StudentActualBoardScoresSeeder::class,
        ]);
        
        // 1. Colleges & Programs
        $this->call(AcademicStructureSeeder::class);

        // 2. Lookup tables
        DB::table('living_arrangements')->insert([
            ['id' => 1, 'name' => 'Living with Parents'],
            ['id' => 2, 'name' => 'Living with Relatives'],
            ['id' => 3, 'name' => 'Boarding House / Dormitory'],
            ['id' => 4, 'name' => 'Own House / Apartment'],
        ]);

        DB::table('languages')->insert([
            ['id' => 1, 'name' => 'English'],
            ['id' => 2, 'name' => 'Filipino'],
            ['id' => 3, 'name' => 'Bilingual (English & Filipino)'],
            ['id' => 4, 'name' => 'Other Regional Dialect'],
        ]);

        $this->call(SocioeconomicStatusSeeder::class);

        // 3. Subject & exam definitions
        $this->call(BoardSubjectSeeder::class);
        $this->call(GeneralSubjectsSeeder::class);
        $this->call(MockSubjectSeeder::class);
        $this->call(RatingCategorySeeder::class);
        $this->call(SimulationExamSeeder::class);

        // 4. Users
        $this->call(UserSeeders::class);

        // 5. Students (basic info + sections)
        $this->call(StudentSeeder::class);

        // 6. Student academic data (grades, ratings, scores)
        $this->call(StudentBoardSubjectGradesSeeder::class);
        $this->call(StudentPerformanceRatingSeeder::class);
        $this->call(StudentSimulationExamSeeder::class);
        $this->call(StudentMockBoardScoresSeeder::class);
        $this->call(StudentActualBoardScoresSeeder::class);
    } 
}