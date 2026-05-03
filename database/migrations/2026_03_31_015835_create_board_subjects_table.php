<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('board_subjects', function (Blueprint $table) {
            $table->id('subject_id');
            $table->unsignedBigInteger('program_id')->nullable();
            $table->string('subject_name', 50)->nullable();
            $table->timestamp('date_created')->useCurrent();
            $table->boolean('is_active')->default(true);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('board_subjects');
    }
};