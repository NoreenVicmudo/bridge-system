<?php

namespace App\Actions\Student;

use App\Models\Student\StudentInfo;
use App\Models\Student\StudentSection;
use App\Models\ProgramMetric\BoardBatch;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DirectEnrollStudentAction
{
    public function execute(array $data): string
    {
        return DB::transaction(function () use ($data) {
            $now = Carbon::now();
            $studentNumber = $data['student_number'];

            $student = StudentInfo::where('student_number', $studentNumber)->first();
            if (!$student) {
                return 'Student not found.';
            }

            if ($data['mode'] === 'section') {
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
                return 'Student is already enrolled in this semester and/or section.';
            } else {
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