<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_performance_rating', function (Blueprint $table) {
            $table->id('rating_id');
            $table->string('student_number', 15)->nullable();
            $table->unsignedBigInteger('category_id')->nullable();
            $table->decimal('rating', 10, 2)->nullable();
            $table->timestamp('date_created')->useCurrent();
            $table->boolean('is_active')->default(true);
            $table->unique(['student_number', 'category_id'], 'student_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_performance_rating');
    }
};