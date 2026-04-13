<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Update Mock Board Scores
        Schema::table('student_mock_board_scores', function (Blueprint $table) {
            // We add the column with a default of 'Default' to handle existing data
            $table->string('exam_period', 50)->default('Default')->after('mock_subject_id');
            
            // If you have an existing unique index, you must drop it first
            // $table->dropUnique(['batch_id', 'mock_subject_id']); 
            
            // New unique constraint: Batch + Subject + Period
            $table->unique(['batch_id', 'mock_subject_id', 'exam_period'], 'mock_score_period_unique');
        });

        // 2. Update Simulation Exams
        Schema::table('student_simulation_exam', function (Blueprint $table) {
            $table->string('exam_period', 50)->default('Default')->after('simulation_id');
            
            // New unique constraint: Student + Exam + Period
            $table->unique(['student_number', 'simulation_id', 'exam_period'], 'sim_exam_period_unique');
        });
    }

    public function down(): void
    {
        Schema::table('student_mock_board_scores', function (Blueprint $table) {
            $table->dropUnique('mock_score_period_unique');
            $table->dropColumn('exam_period');
        });

        Schema::table('student_simulation_exam', function (Blueprint $table) {
            $table->dropUnique('sim_exam_period_unique');
            $table->dropColumn('exam_period');
        });
    }
};