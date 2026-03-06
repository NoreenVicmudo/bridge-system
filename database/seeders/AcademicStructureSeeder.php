<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AcademicStructureSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Insert Colleges
        DB::table('colleges')->insert([
            ['college_id' => 1, 'name' => 'COLLEGE OF MEDICAL TECHNOLOGY', 'brand_color' => '#930147', 'college_email' => 'mcucollegeofmedtech@gmail.com', 'date_created' => '2025-07-11', 'is_active' => 1, 'logo_path' => null],
            ['college_id' => 2, 'name' => 'COLLEGE OF NURSING', 'brand_color' => '#f0a71f', 'college_email' => 'mcunursing@gmail.com', 'date_created' => '2025-07-11', 'is_active' => 1, 'logo_path' => null],
            ['college_id' => 3, 'name' => 'COLLEGE OF DENTISTRY', 'brand_color' => '#ed145b', 'college_email' => 'dentistry@mcu.edu.ph', 'date_created' => '2025-07-11', 'is_active' => 1, 'logo_path' => null],
            ['college_id' => 4, 'name' => 'SCHOOL OF BUSINESS AND MANAGEMENT', 'brand_color' => '#fdc131', 'college_email' => 'sbm@mcu.edu.ph', 'date_created' => '2025-07-11', 'is_active' => 1, 'logo_path' => null],
            ['college_id' => 5, 'name' => 'COLLEGE OF OPTOMETRY', 'brand_color' => '#d07b61', 'college_email' => 'coo@mcu.edu.ph', 'date_created' => '2025-07-11', 'is_active' => 1, 'logo_path' => null],
            ['college_id' => 6, 'name' => 'COLLEGE OF ARTS AND SCIENCES', 'brand_color' => '#417784', 'college_email' => 'cas@mcu.edu.ph', 'date_created' => '2025-07-11', 'is_active' => 1, 'logo_path' => 'uploads/college_logo/college_6_1762255478_6909e276d5b93299585443.png'],
            ['college_id' => 7, 'name' => 'COLLEGE OF PHARMACY', 'brand_color' => '#b7c69c', 'college_email' => 'cph@mcu.edu.ph', 'date_created' => '2025-07-11', 'is_active' => 1, 'logo_path' => null],
            ['college_id' => 8, 'name' => 'INSTITUTE OF EDUCATION', 'brand_color' => '#b3ccc8', 'college_email' => 'ioe@mcu.edu.ph', 'date_created' => '2025-07-11', 'is_active' => 1, 'logo_path' => null],
            ['college_id' => 9, 'name' => 'COLLEGE OF PHYSICAL THERAPY', 'brand_color' => '#d69893', 'college_email' => 'cpt@mcu.edu.ph', 'date_created' => '2025-07-11', 'is_active' => 1, 'logo_path' => null],
            ['college_id' => 10, 'name' => 'COLLEGE OF MEDICINE', 'brand_color' => '#76a13d', 'college_email' => 'medicine@mcu.edu.ph', 'date_created' => '2025-07-11', 'is_active' => 1, 'logo_path' => null],
            ['college_id' => 11, 'name' => 'COLLEGE OF RADIOLOGIC TECHNOLOGY', 'brand_color' => '#5c297c', 'college_email' => 'hello@mcu.edu.ph', 'date_created' => '2025-10-23', 'is_active' => 0, 'logo_path' => null],
        ]);

        // 2. Insert Programs
        DB::table('programs')->insert([
            ['program_id' => 1, 'college_id' => 1, 'years' => 4, 'name' => 'BS MEDICAL TECHNOLOGY', 'date_created' => '2025-07-11', 'is_active' => 1],
            ['program_id' => 2, 'college_id' => 1, 'years' => 4, 'name' => 'BS RADIOLOGIC TECHNOLOGY', 'date_created' => '2025-07-11', 'is_active' => 1],
            ['program_id' => 3, 'college_id' => 2, 'years' => 4, 'name' => 'BS NURSING', 'date_created' => '2025-07-11', 'is_active' => 1],
            ['program_id' => 4, 'college_id' => 3, 'years' => 6, 'name' => 'DOCTOR OF DENTISTAL MEDICINE', 'date_created' => '2025-11-03', 'is_active' => 1],
            ['program_id' => 5, 'college_id' => 4, 'years' => 4, 'name' => 'BS ACCOUNTANCY', 'date_created' => '2025-07-11', 'is_active' => 1],
            ['program_id' => 6, 'college_id' => 5, 'years' => 6, 'name' => 'DOCTOR OF OPTOMETRY', 'date_created' => '2025-07-11', 'is_active' => 1],
            ['program_id' => 7, 'college_id' => 6, 'years' => 4, 'name' => 'BS PSYCHOLOGY', 'date_created' => '2025-07-11', 'is_active' => 1],
            ['program_id' => 8, 'college_id' => 7, 'years' => 4, 'name' => 'BS PHARMACY', 'date_created' => '2025-07-11', 'is_active' => 1],
            ['program_id' => 9, 'college_id' => 8, 'years' => 4, 'name' => 'BS SECONDARY EDUCATION', 'date_created' => '2025-07-11', 'is_active' => 1],
            ['program_id' => 10, 'college_id' => 9, 'years' => 4, 'name' => 'BS PHYSICAL THERAPY', 'date_created' => '2025-07-11', 'is_active' => 1],
            ['program_id' => 11, 'college_id' => 10, 'years' => 5, 'name' => 'DOCTOR OF MEDICINE', 'date_created' => '2025-11-03', 'is_active' => 1],
            ['program_id' => 12, 'college_id' => 6, 'years' => 4, 'name' => 'BS BIOLOGY', 'date_created' => '2025-11-03', 'is_active' => 1],
        ]);
    }
}