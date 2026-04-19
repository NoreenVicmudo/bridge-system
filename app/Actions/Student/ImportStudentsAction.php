<?php

namespace App\Actions\Student;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ImportStudentsAction
{
    public function execute($file, array $context): string
    {
        $now = Carbon::now()->format('Y-m-d H:i:s');
        $successCount = 0;
        $enrollCount = 0;

        // 1. PRE-FETCH LOOKUPS (Prevents Database Overload)
        // We pluck the name and ID, convert names to lowercase, and strip spaces for fuzzy matching
        $livingMap = DB::table('living_arrangements')->pluck('id', 'name')
            ->mapWithKeys(fn($id, $name) => [strtolower(trim($name)) => $id])->toArray();

        $languageMap = DB::table('languages')->pluck('id', 'name')
            ->mapWithKeys(fn($id, $name) => [strtolower(trim($name)) => $id])->toArray();

        $handle = fopen($file->getRealPath(), 'r');
        fgetcsv($handle); // Skip the header row

        DB::beginTransaction();

        try {
            while (($row = fgetcsv($handle, 4000, ',')) !== false) {
                
                $studentNumber = trim($row[0] ?? '');
                if (!$studentNumber) continue; // Skip completely empty rows

                // 2. SMART STRING-TO-ID TRANSLATION
                $livingString = strtolower(trim($row[8] ?? ''));
                $livingId = $livingMap[$livingString] ?? null; // Returns the ID, or null if typo/not found

                $languageString = strtolower(trim($row[17] ?? ''));
                $languageId = $languageMap[$languageString] ?? null; // Returns the ID, or null if typo/not found

                // 3. CRASH-PROOF DATE PARSING
                $birthdate = null;
                if (!empty(trim($row[5] ?? ''))) {
                    try {
                        $birthdate = Carbon::parse(trim($row[5]))->format('Y-m-d');
                    } catch (\Exception $e) {
                        $birthdate = null; // If they typed gibberish, just leave it blank instead of crashing
                    }
                }

                // 4. CHECK IF PROFILE EXISTS
                $exists = DB::table('student_info')->where('student_number', $studentNumber)->exists();

                if (!$exists) {
                    // Create Profile (Will not overwrite existing students!)
                    DB::table('student_info')->insert([
                        'student_number'           => $studentNumber,
                        'student_lname'            => trim($row[1] ?? null),
                        'student_fname'            => trim($row[2] ?? null),
                        'student_mname'            => trim($row[3] ?? null),
                        'student_suffix'           => trim($row[4] ?? null),
                        'student_birthdate'        => $birthdate, // Using our safe date!
                        'student_sex'              => trim($row[6] ?? null),
                        'student_socioeconomic'    => trim($row[7] ?? null),
                        'student_living'           => $livingId,  // Using our translated ID!
                        'student_address_number'   => trim($row[9] ?? null),
                        'student_address_street'   => trim($row[10] ?? null),
                        'student_address_barangay' => trim($row[11] ?? null),
                        'student_address_city'     => trim($row[12] ?? null),
                        'student_address_province' => trim($row[13] ?? null),
                        'student_address_postal'   => trim($row[14] ?? null),
                        'student_work'             => trim($row[15] ?? null),
                        'student_scholarship'      => trim($row[16] ?? null),
                        'student_language'         => $languageId, // Using our translated ID!
                        'student_last_school'      => trim($row[18] ?? null),
                                                
                        'date_created'             => $now,
                        'is_active'                => 1,
                    ]);
                    DB::table('student_programs')->insert([
                        'student_number' => $studentNumber,
                        'program_id'     => $context['program'],
                        'status'         => 'Active',
                        'created_at'     => $now,
                        'updated_at'     => $now
                    ]);

                    \App\Services\AuditService::logStudentAdd($studentNumber, "Imported via CSV for {$context['academic_year']} {$context['semester']}");

                    $successCount++;
                }

                // 5. ENROLL IN SECTION (Prevents duplicates)
                $isEnrolled = DB::table('student_section')
                    ->where('student_number', $studentNumber)
                    ->where('academic_year', $context['academic_year'])
                    ->where('semester', $context['semester'])
                    ->exists();

                if (!$isEnrolled) {
                    DB::table('student_section')->insert([
                        'student_number' => $studentNumber,
                        'section'        => $context['section'],
                        'year_level'     => $context['year_level'],
                        'program_id'     => $context['program'],
                        'semester'       => $context['semester'],
                        'academic_year'  => $context['academic_year'],
                        'date_created'   => $now,
                        'is_active'      => 1,
                    ]);
                    $enrollCount++;
                }
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e; 
        } finally {
            fclose($handle);
        }

        return "Successfully created {$successCount} new profiles and enrolled {$enrollCount} students.";
    }
}