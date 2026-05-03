<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Living Arrangements Table
        Schema::create('living_arrangements', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->timestamp('date_created')->useCurrent();
            $table->boolean('is_active')->default(true);
        });

        // 2. Languages Table
        Schema::create('languages', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->timestamp('date_created')->useCurrent();
            $table->boolean('is_active')->default(true);
        });
        
        // Note: In your 'create_student_info_table' migration, you can now add these foreign keys:
        // $table->foreign('student_living')->references('id')->on('living_arrangements')->onDelete('set null');
        // $table->foreign('student_language')->references('id')->on('languages')->onDelete('set null');
    }

    public function down(): void
    {
        Schema::dropIfExists('languages');
        Schema::dropIfExists('living_arrangements');
    }
};