<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('student_mock_board_scores', function (Blueprint $table) {
            // 1. Just in case you haven't added the column yet, let's add it safely
            if (!Schema::hasColumn('student_mock_board_scores', 'exam_period')) {
                $table->string('exam_period', 50)->default('Default')->after('mock_subject_id');
            }

            // 2. Drop the old strict constraint (The exact name from your error)
            $table->dropUnique('batch_mock_unique');

            // 3. Create the new, flexible composite unique key
            $table->unique(['batch_id', 'mock_subject_id', 'exam_period'], 'batch_mock_period_unique');
        });
    }

    public function down()
    {
        Schema::table('student_mock_board_scores', function (Blueprint $table) {
            $table->dropUnique('batch_mock_period_unique');
            $table->unique(['batch_id', 'mock_subject_id'], 'batch_mock_unique');
            
            if (Schema::hasColumn('student_mock_board_scores', 'exam_period')) {
                $table->dropColumn('exam_period');
            }
        });
    }
};