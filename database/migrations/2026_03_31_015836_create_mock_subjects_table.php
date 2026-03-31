<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mock_subjects', function (Blueprint $table) {
            $table->id('mock_subject_id');
            $table->unsignedBigInteger('program_id')->nullable();
            $table->string('mock_subject_name', 100)->nullable();
            $table->timestamp('date_created')->useCurrent();
            $table->boolean('is_active')->default(true);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mock_subjects');
    }
};