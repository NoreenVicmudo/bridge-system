<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_board_subjects_grades', function (Blueprint $table) {
            $table->id('grade_id');
            $table->string('student_number', 25)->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->integer('subject_grade')->nullable();
            $table->timestamp('date_created')->useCurrent();
            $table->boolean('is_active')->default(true);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_board_subjects_grades');
    }
};