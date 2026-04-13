<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add columns
        $tables = ['student_gwa', 'student_attendance_reviews', 'student_academic_recognition'];
        
        foreach ($tables as $tableName) {
            if (!Schema::hasColumn($tableName, 'program_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->unsignedBigInteger('program_id')->nullable()->after('student_number');
                });

                // 2. Backfill existing data using the new pivot table
                // This grabs the student's currently 'Active' program and applies it to their historical records
                DB::statement("
                    UPDATE {$tableName} t
                    JOIN student_programs sp ON t.student_number = sp.student_number
                    SET t.program_id = sp.program_id
                    WHERE sp.status = 'Active'
                ");
            }
        }
    }

    public function down(): void
    {
        $tables = ['student_gwa', 'student_attendance_reviews', 'student_academic_recognition'];
        
        foreach ($tables as $tableName) {
            if (Schema::hasColumn($tableName, 'program_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropColumn('program_id');
                });
            }
        }
    }
};