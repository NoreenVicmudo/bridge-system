<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_review_center', function (Blueprint $table) {
            $table->id('center_id');
            $table->unsignedBigInteger('batch_id')->nullable()->unique();
            $table->string('review_center', 100)->nullable();
            $table->timestamp('date_created')->useCurrent();
            $table->boolean('is_active')->default(true);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_review_center');
    }
};