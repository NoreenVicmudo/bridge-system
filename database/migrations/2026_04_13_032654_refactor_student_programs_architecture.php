<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create the new Pivot Table ONLY if it doesn't already exist
        if (!Schema::hasTable('student_programs')) {
            Schema::create('student_programs', function (Blueprint $table) {
                $table->id();
                $table->string('student_number', 64);
                $table->unsignedBigInteger('program_id');
                $table->string('status', 20)->default('Active'); // 'Active', 'Shifted', 'Graduated', 'Dropped'
                $table->timestamps();
            });

            // 2. Migrate existing data
            $students = DB::table('student_info')->whereNotNull('program_id')->get();
            $inserts = [];
            foreach ($students as $s) {
                $inserts[] = [
                    'student_number' => $s->student_number,
                    'program_id'     => $s->program_id,
                    'status'         => 'Active',
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ];
            }
            if (!empty($inserts)) {
                DB::table('student_programs')->insert($inserts);
            }
        }

        // 3. Add Contextual Program IDs (ONLY if they don't already exist)
        if (!Schema::hasColumn('board_batch', 'program_id')) {
            Schema::table('board_batch', function (Blueprint $table) {
                $table->unsignedBigInteger('program_id')->nullable()->after('student_number');
            });
            DB::statement('UPDATE board_batch bb JOIN student_info si ON bb.student_number = si.student_number SET bb.program_id = si.program_id');
        }

        if (!Schema::hasColumn('student_section', 'program_id')) {
            Schema::table('student_section', function (Blueprint $table) {
                $table->unsignedBigInteger('program_id')->nullable()->after('student_number');
            });
            DB::statement('UPDATE student_section ss JOIN student_info si ON ss.student_number = si.student_number SET ss.program_id = si.program_id');
        }

        // 4. Finally, drop the old foreign keys AND hardcoded columns from student_info
        if (Schema::hasColumn('student_info', 'college_id')) {
            Schema::table('student_info', function (Blueprint $table) {
                // Drop the foreign key relationships first
                $table->dropForeign(['college_id']);
                $table->dropForeign(['program_id']);
                
                // Now it is safe to drop the columns
                $table->dropColumn(['college_id', 'program_id']);
            });
        }
    }

    public function down(): void
    {
        // Add columns back
        Schema::table('student_info', function (Blueprint $table) {
            $table->unsignedBigInteger('college_id')->nullable();
            $table->unsignedBigInteger('program_id')->nullable();
        });

        Schema::table('board_batch', function (Blueprint $table) {
            $table->dropColumn('program_id');
        });

        Schema::table('student_section', function (Blueprint $table) {
            $table->dropColumn('program_id');
        });

        Schema::dropIfExists('student_programs');
    }
};