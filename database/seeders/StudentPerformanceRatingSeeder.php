<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StudentPerformanceRatingSeeder extends Seeder
{
    public function run(): void
    {
        $students = DB::table('student_programs')
            ->where('status', 'Active')
            ->get();

        foreach ($students as $student) {
            $categories = DB::table('rating_category')
                ->where('program_id', $student->program_id)
                ->where('is_active', 1)
                ->get();

            foreach ($categories as $cat) {
                $exists = DB::table('student_performance_rating')
                    ->where('student_number', $student->student_number)
                    ->where('category_id', $cat->category_id)
                    ->exists();

                if (!$exists) {
                    DB::table('student_performance_rating')->insert([
                        'student_number' => $student->student_number,
                        'category_id'    => $cat->category_id,
                        'rating'  => rand(70, 100),
                        'date_created'   => now(),
                        'is_active'      => 1,
                    ]);
                }
            }
        }
    }
}