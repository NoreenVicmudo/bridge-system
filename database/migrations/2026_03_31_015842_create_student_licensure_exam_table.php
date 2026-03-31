<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_licensure_exam', function (Blueprint $table) {
            $table->id('exam_id');
            $table->unsignedBigInteger('batch_id')->nullable();
            $table->string('exam_result', 10)->nullable();
            $table->date('exam_date_taken')->nullable();
            $table->timestamp('date_created')->useCurrent();
            $table->boolean('is_active')->default(true);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_licensure_exam');
    }
};