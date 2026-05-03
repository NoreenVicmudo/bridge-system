<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_academic_audit', function (Blueprint $table) {
            $table->id();
            $table->string('student_number', 64)->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamp('updated_at')->useCurrent();
            $table->text('remarks')->nullable();
            $table->string('location', 50)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_academic_audit');
    }
};