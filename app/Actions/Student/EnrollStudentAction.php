<?php

namespace App\Actions\Student;

use App\Models\Student\StudentInfo;
use App\Models\Student\StudentSection;
use App\Models\ProgramMetric\BoardBatch;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class EnrollStudentAction
{
    public function execute(array $data): string
    {
        return DB::transaction(function () use ($data) {
            $now = Carbon::now();
            $studentNumber = $data['student_number'];

            // 1. Create or update student profile
            $student = StudentInfo::updateOrCreate(
                ['student_number' => $studentNumber],
                [
                    'student_fname'  => $data['first_name'] ?? 'Unknown',
                    'student_mname'  => $data['middle_name'] ?? null,
                    'student_lname'  => $data['last_name'] ?? 'Unknown',
                    'student_suffix' => $data['suffix'] ?? null,
                    'college_id'     => $data['mode'] === 'section' ? $data['college'] : $data['batch_college'],
                    'program_id'     => $data['mode'] === 'section' ? $data['program'] : $data['batch_program'],
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
                    'date_created'       => $now,
                    'is_active'          => true,
                ]
            );

            // 2. Enroll in section or batch
            if ($data['mode'] === 'section') {
                // Check if already enrolled in this section for this semester/year
                $exists = StudentSection::where('student_number', $studentNumber)
                    ->where('academic_year', $data['academic_year'])
                    ->where('semester', $data['semester'])
                    ->exists();

                if (!$exists) {
                    StudentSection::create([
                        'student_number' => $studentNumber,
                        'section'        => $data['section'],
                        'year_level'     => $data['year_level'],
                        'program_id'     => $data['program'],
                        'semester'       => $data['semester'],
                        'academic_year'  => $data['academic_year'],
                        'date_created'   => $now,
                        'is_active'      => true,
                    ]);
                    return 'Student enrolled in section successfully.';
                }
                return 'Student is already enrolled in this section.';
            } else {
                // Batch mode
                $exists = BoardBatch::where('student_number', $studentNumber)
                    ->where('year', $data['batch_year'])
                    ->where('program_id', $data['batch_program'])
                    ->where('batch_number', $data['batch_number'])
                    ->exists();

                if (!$exists) {
                    BoardBatch::create([
                        'student_number' => $studentNumber,
                        'year'           => $data['batch_year'],
                        'program_id'     => $data['batch_program'],
                        'batch_number'   => $data['batch_number'],
                        'date_created'   => $now,
                        'is_active'      => true,
                    ]);
                    return 'Student enrolled in batch successfully.';
                }
                return 'Student is already enrolled in this batch.';
            }
        });
    }
}