<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('simulation_exams', function (Blueprint $table) {
            $table->id('simulation_id');
            $table->string('simulation_name', 50)->nullable();
            $table->unsignedBigInteger('program_id')->nullable();
            $table->timestamp('date_created')->useCurrent();
            $table->boolean('is_active')->default(true);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('simulation_exams');
    }
};