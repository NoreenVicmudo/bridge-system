<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;

class UserSeeders extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Super Admin',
            'username' => 'Super Admin',
            'email' => 'superadmin@mcu.edu.ph',
            'password' => bcrypt('password123'),
            'position' => 'Admin',
            'status' => 'APPROVED'
        ]);
        /*User::create([
            'name' => 'Opto Dean',
            'username' => 'Opto Dean',
            'email' => 'optodean@mcu.edu.ph',
            'password' => bcrypt('password123'),
            'position' => 'Dean',
            'status' => 'APPROVED',
            'college_id' => 5
        ]);

        User::create([
            'name' => 'Nursing Dean',
            'username' => 'nursing_dean',
            'email' => 'nursingdean@mcu.edu.ph',
            'password' => bcrypt('password123'),
            'position' => 'Dean',
            'status' => 'APPROVED',
            'college_id' => 2
        ]);

        User::create([
            'name' => 'MedTech Chair',
            'username' => 'medtech_chair',
            'email' => 'medtechchair@mcu.edu.ph',
            'password' => bcrypt('password123'),
            'position' => 'Assistant',
            'status' => 'APPROVED',
            'college_id' => 1,
            'program_id' => 1
        ]);*/
    }
}
