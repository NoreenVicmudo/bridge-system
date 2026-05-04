<?php

namespace App\Actions\Student;

use Illuminate\Support\Facades\DB;
use App\Services\AuditService;

class ImportBatchAction
{
    public function execute($file, array $data): array
    {
        $csvData = array_map('str_getcsv', file($file->getRealPath()));
        if (empty($csvData)) throw new \Exception('The uploaded file is empty.');

        // Normalize headers to snake_case
        $headers = array_map(function($header) {
            return strtolower(trim(str_replace(' ', '_', $header)));
        }, array_shift($csvData));

        $importedCount = 0;
        $errorCount = 0;
        $rowNumber = 1;

        foreach ($csvData as $row) {
            $rowNumber++;

            try {
                if (empty(array_filter($row))) continue; 

                // Map row data to header keys safely
                $rowData = [];
                foreach ($headers as $index => $key) {
                    $rowData[$key] = $row[$index] ?? null;
                }

                // Look for common ID header variations
                $studentNumber = trim($rowData['student_number'] ?? $rowData['studentid'] ?? $rowData['id'] ?? '');
                if (empty($studentNumber)) {
                    throw new \Exception("Missing Student Number");
                }

                // 🧠 THE FIX: Check if the student exists in the masterlist
                $studentExists = DB::table('student_info')->where('student_number', $studentNumber)->exists();

                if (!$studentExists) {
                    // Extract name from either split columns or a single name column
                    $lastName = trim($rowData['last_name'] ?? $rowData['lastname'] ?? '');
                    $firstName = trim($rowData['first_name'] ?? $rowData['firstname'] ?? '');
                    
                    if (empty($lastName) && empty($firstName)) {
                        $fullName = trim($rowData['student_name'] ?? $rowData['name'] ?? 'Unknown');
                        $nameParts = explode(',', $fullName);
                        $lastName = trim($nameParts[0]);
                        $firstName = isset($nameParts[1]) ? trim($nameParts[1]) : '';
                    }

                    // Create basic shell profile
                    DB::table('student_info')->insert([
                        'student_number' => $studentNumber,
                        'student_lname'  => $lastName ?: 'Unknown',
                        'student_fname'  => $firstName,
                        'is_active'      => 1,
                        'date_created'   => now(),
                    ]);

                    // Assign historically to the program
                    DB::table('student_programs')->insert([
                        'student_number' => $studentNumber,
                        'program_id'     => $data['program_id'],
                        'status'         => 'Active',
                        'created_at'     => now(),
                        'updated_at'     => now(),
                    ]);
                }

                // Now safely assign to the Board Batch
                $batchExists = DB::table('board_batch')
                    ->where('student_number', $studentNumber)
                    ->where('program_id', $data['program_id'])
                    ->where('year', $data['year'])
                    ->where('batch_number', $data['batch_number'])
                    ->exists();

                if (!$batchExists) {
                    DB::table('board_batch')->insert([
                        'student_number' => $studentNumber,
                        'program_id'     => $data['program_id'],
                        'year'           => $data['year'],
                        'batch_number'   => $data['batch_number'],
                        'is_active'      => 1,
                        'date_created'   => now(),
                    ]);
                    $importedCount++;
                }

            } catch (\Exception $e) {
                // If this row fails, skip it and continue
                $errorCount++;
            }
        }

        AuditService::logStudentUpdate('BATCH', "Imported {$importedCount} students into Program ID {$data['program_id']}, Year {$data['year']}, Batch {$data['batch_number']}");

        return [
            'success' => true,
            'imported' => $importedCount,
            'errors' => $errorCount
        ];
    }
}