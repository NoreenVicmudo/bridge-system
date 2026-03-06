<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('student_info', function (Blueprint $table) {
            $table->id('student_id'); // Primary Key
            $table->string('student_number', 15)->unique()->nullable(); // Joining Key
            $table->string('student_fname', 50)->nullable();
            $table->string('student_mname', 50)->nullable();
            $table->string('student_lname', 50)->nullable();
            $table->string('student_suffix', 50)->nullable();
            $table->unsignedBigInteger('college_id')->nullable(); // Foreign key to colleges
            $table->unsignedBigInteger('program_id')->nullable(); // Foreign key to programs
            $table->date('student_birthdate')->nullable();
            $table->string('student_sex', 10)->nullable();
            $table->string('student_socioeconomic', 50)->nullable();
            $table->string('student_address_number', 10)->nullable();
            $table->string('student_address_street', 100)->nullable();
            $table->string('student_address_barangay', 50)->nullable();
            $table->string('student_address_city', 100)->nullable();
            $table->string('student_address_province', 100)->nullable();
            $table->string('student_address_postal', 100)->nullable();
            $table->unsignedBigInteger('student_living')->nullable();
            $table->string('student_work', 50)->nullable();
            $table->string('student_scholarship', 50)->nullable();
            $table->unsignedBigInteger('student_language')->nullable();
            $table->string('student_last_school', 7)->nullable();
            $table->date('date_created')->useCurrent();
            $table->boolean('is_active')->default(true);

            $table->foreign('college_id')->references('college_id')->on('colleges')->onDelete('cascade');
            $table->foreign('program_id')->references('program_id')->on('programs')->onDelete('cascade');
            $table->foreign('student_living')->references('id')->on('living_arrangements')->onDelete('set null');
            $table->foreign('student_language')->references('id')->on('languages')->onDelete('set null');
        });

        Schema::create('student_section', function (Blueprint $table) {
            $table->id('enroll_id'); // Primary Key
            $table->string('student_number', 15)->nullable(); // Links to info table
            $table->string('section', 10)->nullable();
            $table->integer('year_level')->nullable();
            $table->integer('program_id')->nullable();
            $table->string('semester', 10)->nullable();
            $table->string('academic_year', 9)->nullable();
            $table->date('date_created')->useCurrent();
            $table->boolean('is_active')->default(true);

            // Set up relationship
            $table->foreign('student_number')->references('student_number')->on('student_info')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_section');
        Schema::dropIfExists('student_info');
    }
};
