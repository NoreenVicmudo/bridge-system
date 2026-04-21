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
                'maximum' => 14559,
            ],
            [
                'status' => 'Low Income',
                'minimum' => 14560,
                'maximum' => 29119,
            ],
            [
                'status' => 'Lower Middle',
                'minimum' => 29120,
                'maximum' => 58239,
            ],
            [
                'status' => 'Middle Class',
                'minimum' => 58240,
                'maximum' => 116479,
            ],
            [
                'status' => 'Upper Middle',
                'minimum' => 116480,
                'maximum' => 232959,
            ],
            [
                'status' => 'High Income',
                'minimum' => 232960,
                'maximum' => 465919,
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