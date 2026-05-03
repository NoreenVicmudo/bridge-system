<?php

namespace App\Actions\Student;

use App\Models\Student\StudentInfo;
use App\Services\AuditService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ImportMasterlistAction
{
    // 🧠 THE FIX: Removed the $programId parameter completely!
    public function execute($file): string
    {
        $now = Carbon::now()->format('Y-m-d H:i:s');
        $successCount = 0;
        $errorCount = 0;
        $errors = [];

        $livingMap = DB::table('living_arrangements')->pluck('id', 'name')
            ->mapWithKeys(fn($id, $name) => [strtolower(trim($name)) => $id])->toArray();

        $languageMap = DB::table('languages')->pluck('id', 'name')
            ->mapWithKeys(fn($id, $name) => [strtolower(trim($name)) => $id])->toArray();

        $handle = fopen($file->getRealPath(), 'r');
        fgetcsv($handle); 

        DB::beginTransaction();

        try {
            while (($row = fgetcsv($handle, 4000, ',')) !== false) {
                
                $studentNumber = trim($row[0] ?? '');
                if (!$studentNumber) continue; 

                $student = StudentInfo::where('student_number', $studentNumber)->first();

                if ($student) {
                    if (!$student->is_active) {
                        // 🧠 RESTORE DELETED STUDENT (No Program Pivot needed)
                        $student->update(['is_active' => 1]);
                        AuditService::logStudentAdd($studentNumber, "Restored profile to Masterlist via CSV Import");
                        $successCount++;
                    } else {
                        $errorCount++;
                        $errors[] = "Row skipped: {$studentNumber} already exists and is active.";
                    }
                    continue; 
                }

                $livingString = strtolower(trim($row[8] ?? ''));
                $livingId = $livingMap[$livingString] ?? null; 

                $languageString = strtolower(trim($row[17] ?? ''));
                $languageId = $languageMap[$languageString] ?? null; 

                $birthdate = null;
                if (!empty(trim($row[5] ?? ''))) {
                    try {
                        $birthdate = Carbon::parse(trim($row[5]))->format('Y-m-d');
                    } catch (\Exception $e) {
                        $birthdate = null; 
                    }
                }

                // 🧠 INSERT PURE STUDENT PROFILE (No Program Pivot)
                DB::table('student_info')->insert([
                    'student_number'           => $studentNumber,
                    'student_lname'            => trim($row[1] ?? 'Unknown'),
                    'student_fname'            => trim($row[2] ?? 'Unknown'),
                    'student_mname'            => trim($row[3] ?? null),
                    'student_suffix'           => trim($row[4] ?? null),
                    'student_birthdate'        => $birthdate,
                    'student_sex'              => trim($row[6] ?? null),
                    'student_socioeconomic'    => trim($row[7] ?? null),
                    'student_living'           => $livingId,  
                    'student_address_number'   => trim($row[9] ?? null),
                    'student_address_street'   => trim($row[10] ?? null),
                    'student_address_barangay' => trim($row[11] ?? null),
                    'student_address_city'     => trim($row[12] ?? null),
                    'student_address_province' => trim($row[13] ?? null),
                    'student_address_postal'   => trim($row[14] ?? null),
                    'student_work'             => trim($row[15] ?? null),
                    'student_scholarship'      => trim($row[16] ?? null),
                    'student_language'         => $languageId, 
                    'student_last_school'      => trim($row[18] ?? null),
                    'date_created'             => $now,
                    'is_active'                => 1,
                ]);

                AuditService::logStudentAdd($studentNumber, "Imported profile directly to Masterlist via CSV");
                $successCount++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e; 
        } finally {
            fclose($handle);
        }

        $message = "Successfully imported {$successCount} new profiles to the Masterlist.";
        if ($errorCount > 0) $message .= " Skipped {$errorCount} duplicates.";

        return $message;
    }
}