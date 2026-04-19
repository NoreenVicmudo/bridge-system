<?php

namespace App\Actions\Student;

use App\Models\Student\StudentInfo;
use App\Models\Student\StudentSection;
use App\Models\ProgramMetric\BoardBatch;
use App\Services\AuditService; // 🧠 ADD THIS
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class EnrollStudentAction
{
    public function execute(array $data): string
    {
        return DB::transaction(function () use ($data) {
            $now = Carbon::now();
            $studentNumber = $data['student_number'];
            $programId = $data['mode'] === 'section' ? $data['program'] : $data['batch_program'];

            $existingStudent = StudentInfo::where('student_number', $studentNumber)->first();

            $student = StudentInfo::updateOrCreate(
                ['student_number' => $studentNumber],
                [
                    'student_fname'  => $data['first_name'] ?? 'Unknown',
                    'student_mname'  => $data['middle_name'] ?? null,
                    'student_lname'  => $data['last_name'] ?? 'Unknown',
                    'student_suffix' => $data['suffix'] ?? null,
                    'student_birthdate' => $data['birthdate'] ?? null,
                    'student_sex'        => $data['sex'] ?? null,
                    'student_socioeconomic' => $data['socioeconomic_status'] ?? null,
                    'student_living'     => $data['living_arrangement'] ?? null,
                    'student_address_number' => $data['house_no'] ?? null,
                    'student_address_street' => $data['street'] ?? null,
                    'student_address_barangay' => $data['barangay'] ?? null,
                    'student_address_city' => $data['city'] ?? null,
                    'student_address_province' => $data['province'] ?? null,
                    'student_address_postal' => $data['postal_code'] ?? null,
                    'student_work'       => $data['work_status'] ?? null,
                    'student_scholarship'=> $data['scholarship'] ?? null,
                    'student_language'   => $data['language'] ?? null,
                    'student_last_school'=> $data['last_school_type'] ?? null,
                    'date_created'       => $existingStudent ? $existingStudent->date_created : $now,
                    'is_active'          => true,
                ]
            );

            $student->programs()->syncWithoutDetaching([
                $programId => ['status' => 'Active', 'updated_at' => $now]
            ]);

            $message = '';

            if ($data['mode'] === 'section') {
                // 🧠 FIXED: Use updateOrCreate to restore previous enrollments
                StudentSection::updateOrCreate(
                    [
                        'student_number' => $studentNumber,
                        'academic_year'  => $data['academic_year'],
                        'semester'       => $data['semester'],
                    ],
                    [
                        'section'        => $data['section'],
                        'year_level'     => $data['year_level'],
                        'program_id'     => $data['program'],
                        'date_created'   => $now,
                        'is_active'      => 1, // 🧠 Restore
                    ]
                );
                
                if (!$existingStudent) {
                    AuditService::logStudentAdd($studentNumber, "Profile created and enrolled in Section {$data['section']} ({$data['semester']})");
                } else {
                    AuditService::logStudentUpdate($studentNumber, "Enrolled in / Restored to Section {$data['section']} ({$data['semester']})");
                }
                return 'Student enrolled in section successfully.';
            } else {
                // 🧠 FIXED: Use updateOrCreate for batches
                BoardBatch::updateOrCreate(
                    [
                        'student_number' => $studentNumber,
                        'year'           => $data['batch_year'],
                        'program_id'     => $data['batch_program'],
                        'batch_number'   => $data['batch_number'],
                    ],
                    [
                        'date_created'   => $now,
                        'is_active'      => 1, // 🧠 Restore
                    ]
                );
                
                if (!$existingStudent) {
                    AuditService::logStudentAdd($studentNumber, "Profile created and enrolled in Board Batch {$data['batch_number']} ({$data['batch_year']})");
                } else {
                    AuditService::logStudentUpdate($studentNumber, "Enrolled in / Restored to Board Batch {$data['batch_number']} ({$data['batch_year']})");
                }
                return 'Student enrolled in batch successfully.';
            }
        });
    }
}