<?php

namespace App\Actions\Student;

use App\Models\ProgramMetric\BoardBatch;
use App\Models\Student\StudentInfo;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ImportBatchAction
{
    public function execute($file, array $context): string
    {
        $now = Carbon::now();
        $successCount = 0;
        $errorCount = 0;
        $errors = [];

        $handle = fopen($file->getRealPath(), 'r');
        fgetcsv($handle); // skip header

        DB::beginTransaction();
        try {
            while (($row = fgetcsv($handle, 4000, ',')) !== false) {
                $studentNumber = trim($row[0] ?? '');
                if (!$studentNumber) continue;

                $student = StudentInfo::where('student_number', $studentNumber)->first();
                if (!$student) {
                    $errorCount++;
                    $errors[] = "Student $studentNumber not found";
                    continue;
                }

                // Optional: verify college/program match
                if ($student->college_id != $context['college_id'] || $student->program_id != $context['program_id']) {
                    $errorCount++;
                    $errors[] = "Student $studentNumber does not belong to the selected college/program";
                    continue;
                }

                $exists = BoardBatch::where('student_number', $studentNumber)
                    ->where('year', $context['year'])
                    ->where('program_id', $context['program_id'])
                    ->where('batch_number', $context['batch_number'])
                    ->exists();

                if ($exists) {
                    $errorCount++;
                    $errors[] = "Student $studentNumber already enrolled in this batch";
                    continue;
                }

                BoardBatch::create([
                    'student_number' => $studentNumber,
                    'year'           => $context['year'],
                    'program_id'     => $context['program_id'],
                    'batch_number'   => $context['batch_number'],
                    'date_created'   => $now,
                    'is_active'      => true,
                ]);
                $successCount++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        } finally {
            fclose($handle);
        }

        $message = "Successfully enrolled {$successCount} students in batch.";
        if ($errorCount > 0) {
            $message .= " Errors: " . implode('; ', $errors);
        }
        return $message;
    }
}