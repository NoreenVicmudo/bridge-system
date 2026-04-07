<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RatingCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            // Psychology (Program 7)
            ['program_id' => 7, 'category_name' => 'Clinical Skills'],
            ['program_id' => 7, 'category_name' => 'Case Analysis'],
            ['program_id' => 7, 'category_name' => 'Ethics & Protocol'],
            ['program_id' => 7, 'category_name' => 'Peer Evaluation'],

            // Biology (Program 12 - Corrected ID)
            ['program_id' => 12, 'category_name' => 'Lab Techniques'],
            ['program_id' => 12, 'category_name' => 'Field Work'],
            ['program_id' => 12, 'category_name' => 'Research Paper'],
            ['program_id' => 12, 'category_name' => 'Data Analysis'],
        ];

        foreach ($categories as $category) {
            DB::table('rating_category')->insert([
                'program_id'    => $category['program_id'],
                'category_name' => $category['category_name'],
                'date_created'  => now(),
                'is_active'     => 1,
            ]);
        }
    }
}