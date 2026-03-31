<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_attendance_reviews', function (Blueprint $table) {
            $table->id('attendance_id');
            $table->string('student_number', 15)->nullable()->unique();
            $table->integer('sessions_attended')->nullable();
            $table->integer('sessions_total')->nullable();
            $table->timestamp('date_created')->useCurrent();
            $table->boolean('is_active')->default(true);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_attendance_reviews');
    }
};