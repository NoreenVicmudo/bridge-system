<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_academic_recognition', function (Blueprint $table) {
            $table->id('recognition_id');
            $table->string('student_number', 15)->nullable();
            $table->integer('award_count')->default(0);
            $table->timestamp('date_created')->useCurrent();
            $table->boolean('is_active')->default(true);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_academic_recognition');
    }
};