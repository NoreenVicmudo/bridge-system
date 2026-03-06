<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create Colleges Table
        Schema::create('colleges', function (Blueprint $table) {
            $table->id('college_id'); // Custom PK name matching your SQL
            $table->string('name', 100);
            $table->string('brand_color', 7)->nullable();
            $table->string('college_email', 255)->nullable();
            $table->date('date_created')->useCurrent();
            $table->boolean('is_active')->default(true);
            $table->string('logo_path', 255)->nullable();
        });

        // 2. Create Programs Table
        Schema::create('programs', function (Blueprint $table) {
            $table->id('program_id'); // Custom PK name matching your SQL
            $table->unsignedBigInteger('college_id')->nullable();
            $table->integer('years')->default(4);
            $table->string('name', 100)->nullable();
            $table->date('date_created')->useCurrent();
            $table->boolean('is_active')->default(true);

            // Establish the relationship
            $table->foreign('college_id')
                  ->references('college_id')->on('colleges')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('programs');
        Schema::dropIfExists('colleges');
    }
};