<?php

namespace App\Actions\Student;

use App\Models\Student\StudentInfo;
use App\Models\ProgramMetric\BoardBatch;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StoreOrEnrollBatchAction
{
    /**
     * Execute the creation/enrollment logic.
     *
     * @param array $data
     * @return string
     */
    public function execute(array $data): string
    {
        return DB::transaction(function () use ($data) {
            $now = Carbon::now();
            $studentNumber = $data['student_number'];

            // 1. Check if student profile exists
            $student = StudentInfo::where('student_number', $studentNumber)->first();
            $message = '';

            if (!$student) {
                // Create student profile with minimal required data
                StudentInfo::create([
                    'student_number' => $studentNumber,
                    'student_fname'  => $data['first_name'] ?? 'Unknown',
                    'student_mname'  => $data['middle_name'] ?? null,
                    'student_lname'  => $data['last_name'] ?? 'Unknown',
                    'student_suffix' => $data['suffix'] ?? null,
                    'college_id'     => $data['college_id'],
                    'program_id'     => $data['program_id'],
                    'date_created'   => $now,
                    'is_active'      => true,
                ]);
                $message = 'New student profile created and enrolled in batch successfully!';
            } else {
                // Optionally, we might want to update profile data if provided
                // For now, we just note that it exists
                $message = 'Existing student found! Added to the batch successfully.';
            }

            // 2. Check if already enrolled in this batch
            $exists = BoardBatch::where('student_number', $studentNumber)
                ->where('year', $data['year'])
                ->where('program_id', $data['program_id'])
                ->where('batch_number', $data['batch_number'])
                ->exists();

            if ($exists) {
                return 'Student is already enrolled in this batch.';
            }

            // 3. Enroll in batch
            BoardBatch::create([
                'student_number' => $studentNumber,
                'year'           => $data['year'],
                'program_id'     => $data['program_id'],
                'batch_number'   => $data['batch_number'],
                'date_created'   => $now,
                'is_active'      => true,
            ]);

            return $message;
        });
    }
}