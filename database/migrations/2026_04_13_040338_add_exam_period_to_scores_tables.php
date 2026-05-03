<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Update Mock Board Scores
        Schema::table('student_mock_board_scores', function (Blueprint $table) {
            if (!Schema::hasColumn('student_mock_board_scores', 'exam_period')) {
                $table->string('exam_period', 50)->default('Default')->after('mock_subject_id');
            }
            $table->unique(['batch_id', 'mock_subject_id', 'exam_period'], 'mock_score_period_unique');
        });

        // 2. Update Simulation Exams
        Schema::table('student_simulation_exam', function (Blueprint $table) {
            if (!Schema::hasColumn('student_simulation_exam', 'exam_period')) {
                $table->string('exam_period', 50)->default('Default')->after('simulation_id');
            }
            // Drop the old unique constraint named 'student_number'
            $table->dropUnique('student_number');
            // Add new composite unique key including exam_period
            $table->unique(['student_number', 'simulation_id', 'exam_period'], 'sim_exam_period_unique');
        });
    }

    public function down(): void
    {
        Schema::table('student_mock_board_scores', function (Blueprint $table) {
            $table->dropUnique('mock_score_period_unique');
            $table->unique(['batch_id', 'mock_subject_id'], 'batch_mock_unique');
            $table->dropColumn('exam_period');
        });

        Schema::table('student_simulation_exam', function (Blueprint $table) {
            $table->dropUnique('sim_exam_period_unique');
            // Restore old unique constraint
            $table->unique(['student_number', 'simulation_id'], 'student_number');
            $table->dropColumn('exam_period');
        });
    }
};