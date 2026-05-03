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
            $now = \Carbon\Carbon::now();
            $studentNumber = $data['student_number'];

            $student = StudentInfo::where('student_number', $studentNumber)->first();
            if (!$student) {
                return 'Student not found.';
            }

            // 🧠 RESTORE THE PROFILE: If they were removed, bring them back!
            $student->update(['is_active' => 1]);

            // Ensure the pivot table knows this student is now Active in this program
            $programId = $data['mode'] === 'section' ? $data['program'] : $data['batch_program'];
            
            $student->programs()->syncWithoutDetaching([
                $programId => ['status' => 'Active', 'updated_at' => $now]
            ]);

            if ($data['mode'] === 'section') {
                // 🧠 RESTORE ENROLLMENT: Use updateOrCreate instead of checking exists() and create()
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
                        'is_active'      => 1, // 🧠 Forces it to be active!
                    ]
                );
                return 'Student enrolled in section successfully.';
            } else {
                // 🧠 RESTORE ENROLLMENT: Use updateOrCreate for batches too
                BoardBatch::updateOrCreate(
                    [
                        'student_number' => $studentNumber,
                        'year'           => $data['batch_year'],
                        'program_id'     => $data['batch_program'],
                        'batch_number'   => $data['batch_number'],
                    ],
                    [
                        'date_created'   => $now,
                        'is_active'      => 1, // 🧠 Forces it to be active!
                    ]
                );
                return 'Student enrolled in batch successfully.';
            }
        });
    }
}