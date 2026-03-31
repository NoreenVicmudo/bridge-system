<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_simulation_exam', function (Blueprint $table) {
            $table->id('sim_id');
            $table->string('student_number', 15)->nullable();
            $table->unsignedBigInteger('simulation_id')->nullable();
            $table->integer('student_score')->nullable();
            $table->integer('total_score')->nullable();
            $table->timestamp('date_created')->useCurrent();
            $table->boolean('is_active')->default(true);
            $table->unique(['student_number', 'simulation_id'], 'student_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_simulation_exam');
    }
};