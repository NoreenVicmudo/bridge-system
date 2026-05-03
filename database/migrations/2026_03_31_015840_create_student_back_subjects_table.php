<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_back_subjects', function (Blueprint $table) {
            $table->id('back_id');
            $table->string('student_number', 15)->nullable();
            $table->unsignedBigInteger('general_subject_id')->nullable();
            $table->integer('terms_repeated')->nullable();
            $table->timestamp('date_created')->useCurrent();
            $table->boolean('is_active')->default(true);
            $table->unique(['student_number', 'general_subject_id'], 'student_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_back_subjects');
    }
};