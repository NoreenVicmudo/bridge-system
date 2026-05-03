<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_gwa', function (Blueprint $table) {
            $table->id('gwa_id');
            $table->string('student_number', 15)->nullable();
            $table->integer('year_level')->nullable();
            $table->string('semester', 5)->nullable();
            $table->float('gwa')->nullable();
            $table->timestamp('date_created')->useCurrent();
            $table->boolean('is_active')->default(true);
            $table->unique(['student_number', 'year_level', 'semester'], 'student_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_gwa');
    }
};