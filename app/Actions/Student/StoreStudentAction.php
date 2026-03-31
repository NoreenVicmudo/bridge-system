<?php

namespace App\Actions\Student;

use App\Models\Student\StudentInfo;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StoreStudentAction
{
    public function execute(array $data): string
    {
        return DB::transaction(function () use ($data) {
            $now = Carbon::now();
            $studentNumber = $data['student_number'];

            StudentInfo::create([
                'student_number' => $studentNumber,
                'student_fname'  => $data['first_name'] ?? 'Unknown',
                'student_mname'  => $data['middle_name'] ?? null,
                'student_lname'  => $data['last_name'] ?? 'Unknown',
                'student_suffix' => $data['suffix'] ?? null,
                'college_id'     => $data['college'] ?? null,
                'program_id'     => $data['program'] ?? null,
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
            ]);

            return 'Student profile created successfully.';
        });
    }
}