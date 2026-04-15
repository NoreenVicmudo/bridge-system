<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_mock_board_scores', function (Blueprint $table) {
            $table->id('score_id');
            $table->unsignedBigInteger('batch_id')->nullable();
            $table->unsignedBigInteger('mock_subject_id')->nullable();
            $table->decimal('score', 5, 2)->nullable();
            $table->timestamp('date_created')->useCurrent();
            $table->boolean('is_active')->default(true);
            $table->unique(['batch_id', 'mock_subject_id'], 'batch_mock_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_mock_board_scores');
    }
};