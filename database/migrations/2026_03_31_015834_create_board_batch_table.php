<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('board_batch', function (Blueprint $table) {
            $table->id('batch_id');
            $table->string('student_number', 25)->nullable();
            $table->integer('year')->nullable();
            $table->unsignedBigInteger('program_id')->nullable();
            $table->integer('batch_number')->nullable();
            $table->timestamp('date_created')->useCurrent();
            $table->boolean('is_active')->default(true);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('board_batch');
    }
};