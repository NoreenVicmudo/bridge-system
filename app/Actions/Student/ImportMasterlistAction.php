<?php

namespace App\Actions\Student;

use App\Models\Student\StudentInfo;
use App\Services\AuditService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ImportMasterlistAction
{
    public function execute($file): array
    {
        $now = Carbon::now()->format('Y-m-d H:i:s');
        $insertedCount = 0;
        $updatedCount = 0;
        $errorCount = 0;
        $errorDetails = [];

        $handle = fopen($file->getRealPath(), 'r');
        fgetcsv($handle); // Skip header row
        $rowNumber = 1; // Start at 1 (Header was row 1, data starts at 2, but we'll increment immediately)

        while (($row = fgetcsv($handle, 4000, ',')) !== false) {
            $rowNumber++;
            
            try {
                $studentNumber = trim($row[0] ?? '');
                if (empty($studentNumber)) {
                    continue; // Skip completely blank rows without throwing an error
                }

                // Clean the monetary amount
                $rawIncome = trim($row[7] ?? '');
                $cleanIncome = preg_replace('/[^0-9.]/', '', $rawIncome);
                $incomeAmount = $cleanIncome !== '' ? (float)$cleanIncome : null;

                // Auto-create Living Arrangement
                $livingText = trim($row[16] ?? '');
                $livingId = null;
                if (!empty($livingText)) {
                    $livingRecord = DB::table('living_arrangements')->whereRaw('LOWER(name) = ?', [strtolower($livingText)])->first();
                    $livingId = $livingRecord ? $livingRecord->id : DB::table('living_arrangements')->insertGetId(['name' => $livingText, 'created_at' => $now, 'updated_at' => $now]);
                }

                // Auto-create Language
                $languageText = trim($row[17] ?? '');
                $languageId = null;
                if (!empty($languageText)) {
                    $languageRecord = DB::table('languages')->whereRaw('LOWER(name) = ?', [strtolower($languageText)])->first();
                    $languageId = $languageRecord ? $languageRecord->id : DB::table('languages')->insertGetId(['name' => $languageText, 'created_at' => $now, 'updated_at' => $now]);
                }

                // Parse Birthdate
                $birthdate = null;
                if (!empty(trim($row[5] ?? ''))) {
                    try { $birthdate = Carbon::parse(trim($row[5]))->format('Y-m-d'); } 
                    catch (\Exception $e) { $birthdate = null; }
                }

                $existingStudent = StudentInfo::where('student_number', $studentNumber)->first();
                $isNew = !$existingStudent;

                $updateData = [
                    'student_lname'            => trim($row[1] ?? 'Unknown'),
                    'student_fname'            => trim($row[2] ?? 'Unknown'),
                    'student_mname'            => trim($row[3] ?? null),
                    'student_suffix'           => trim($row[4] ?? null),
                    'student_birthdate'        => $birthdate,
                    'student_sex'              => strtoupper(trim($row[6] ?? null)),
                    'student_socioeconomic'    => $incomeAmount,
                    'student_address_number'   => trim($row[8] ?? null),
                    'student_address_street'   => trim($row[9] ?? null),
                    'student_address_barangay' => trim($row[10] ?? null),
                    'student_address_city'     => trim($row[11] ?? null),
                    'student_address_province' => trim($row[12] ?? null),
                    'student_address_postal'   => trim($row[13] ?? null),
                    'student_work'             => trim($row[14] ?? null),
                    'student_scholarship'      => trim($row[15] ?? null),
                    'student_living'           => $livingId,  
                    'student_language'         => $languageId, 
                    'student_last_school'      => trim($row[18] ?? null),
                    'is_active'                => 1,
                ];

                if ($isNew) $updateData['date_created'] = $now;

                // Execute the Upsert
                StudentInfo::updateOrCreate(['student_number' => $studentNumber], $updateData);

                if ($isNew) {
                    AuditService::logStudentAdd($studentNumber, "Imported new profile via CSV");
                    $insertedCount++;
                } else {
                    AuditService::logStudentUpdate($studentNumber, "Updated profile via CSV Import");
                    $updatedCount++;
                }

            } catch (\Exception $e) {
                // 🧠 THE FIX: If this specific row fails, log the error and keep the loop running!
                $errorCount++;
                $errorDetails[] = "Row {$rowNumber} ({$studentNumber}): " . $e->getMessage();
            }
        }
        
        fclose($handle);

        return [
            'success' => true,
            'inserted' => $insertedCount,
            'updated' => $updatedCount,
            'errors' => $errorCount,
            'error_log' => $errorDetails // You can return this to the frontend if you want to display a detailed log later!
        ];
    }
}