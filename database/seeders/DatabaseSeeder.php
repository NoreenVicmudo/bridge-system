<?php

namespace Database\Seeders;

use App\Models\User;
use Database\Seeders\AcademicStructureSeeder;
use Database\Seeders\StudentSeeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed the Colleges and Programs
        $this->call([
            AcademicStructureSeeder::class,
        ]);

        // 2. Seed Lookup Tables
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

        // 3. Automatically generate your Test Users linked to the College of Medical Technology (ID: 1)
        User::create([
            'name' => 'Dr. Dean Admin',
            'username' => 'dean_admin',
            'email' => 'dean@mcu.edu.ph',
            'password' => bcrypt('password123'),
            'position' => 'Dean',
            'status' => 'APPROVED',
            'college_id' => 6
        ]);

        User::create([
            'name' => 'Staff Assistant',
            'username' => 'staff_01',
            'email' => 'staff@mcu.edu.ph',
            'password' => bcrypt('password123'),
            'position' => 'Assistant',
            'status' => 'APPROVED',
            'college_id' => 6,
            'program_id' => 7
        ]);

        $this->call([
            StudentSeeder::class,
        ]);
    }
}
