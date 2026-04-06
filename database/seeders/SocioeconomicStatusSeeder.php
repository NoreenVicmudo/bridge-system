<?php

namespace Database\Seeders;

use App\Models\Student\SocioeconomicStatus;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SocioeconomicStatusSeeder extends Seeder
{
    public function run()
    {
        // Clear table first (optional)
        DB::table('socioeconomic_status')->truncate();

        $categories = [
            [
                'status' => 'Poor',
                'minimum' => null,
                'maximum' => 14560,
            ],
            [
                'status' => 'Low Income',
                'minimum' => 14560,
                'maximum' => 29120,
            ],
            [
                'status' => 'Lower Middle Class',
                'minimum' => 29120,
                'maximum' => 58240,
            ],
            [
                'status' => 'Middle Class',
                'minimum' => 58240,
                'maximum' => 116480,
            ],
            [
                'status' => 'Upper Middle Class',
                'minimum' => 116480,
                'maximum' => 232960,
            ],
            [
                'status' => 'Upper Income',
                'minimum' => 232960,
                'maximum' => 465920,
            ],
            [
                'status' => 'Rich',
                'minimum' => 465920,
                'maximum' => null,
            ],
        ];

        foreach ($categories as $cat) {
            SocioeconomicStatus::create($cat);
        }

        $this->command->info('Socioeconomic status categories seeded successfully.');
    }
}