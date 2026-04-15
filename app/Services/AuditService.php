<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class AuditService
{
    /**
     * 1. REPORT GENERATION AUDIT
     * Table: user_generate_report_audit
     */
    public static function logReportGeneration($batch, $treatment, $remarks = null)
    {
        DB::table('user_generate_report_audit')->insert([
            'batch'        => $batch,
            'generated_by' => Auth::id(),
            'generated_at' => now(),
            'remarks'      => $remarks,
            'treatment'    => $treatment,
        ]);
    }

    /**
     * 2. USER AUTHENTICATION AUDIT (Login/Logout)
     * Table: user_auth_audit
     */
    public static function logUserAuth($remarks)
    {
        DB::table('user_auth_audit')->insert([
            'action_by' => Auth::id(),
            'action_at' => now(),
            'remarks'   => $remarks,
            'location'  => request()->ip(),
        ]);
    }

    /**
     * 3. USER MANAGEMENT AUDIT (Add/Edit Users)
     * Table: user_manage_audit
     */
    public static function logUserManagement($targetUsername, $remarks)
    {
        DB::table('user_manage_audit')->insert([
            'user_username' => $targetUsername,
            'action_by'     => Auth::id(),
            'action_at'     => now(),
            'remarks'       => $remarks,
            'location'      => request()->ip(),
        ]);
    }

    /**
     * 4. ADDITIONAL ENTRY AUDIT (Dropdowns, Metrics, Settings)
     * Table: user_additional_entry_audit
     */
    public static function logAdditionalEntry($field, $remarks)
    {
        DB::table('user_additional_entry_audit')->insert([
            'field'      => $field,
            'updated_by' => Auth::id(),
            'updated_at' => now(),
            'remarks'    => $remarks,
            'location'   => request()->ip(),
        ]);
    }

    /**
     * 5. STUDENT ADD AUDIT
     * Table: student_add_audit
     */
    public static function logStudentAdd($studentNumber, $remarks = 'Student registered')
    {
        DB::table('student_add_audit')->insert([
            'student_number' => $studentNumber,
            'added_by'       => Auth::id(),
            'added_at'       => now(),
            'remarks'        => $remarks,
            'location'       => request()->ip(),
        ]);
    }

    /**
     * 6. STUDENT UPDATE AUDIT (General Info)
     * Table: student_update_audit
     */
    public static function logStudentUpdate($studentNumber, $remarks)
    {
        DB::table('student_update_audit')->insert([
            'student_number' => $studentNumber,
            'updated_by'     => Auth::id(),
            'updated_at'     => now(),
            'remarks'        => $remarks,
            'location'       => request()->ip(),
        ]);
    }

    /**
     * 7. STUDENT DELETE/ARCHIVE AUDIT
     * Table: student_delete_audit (Note: Uses 'reason' instead of 'remarks')
     */
    public static function logStudentDelete($studentNumber, $reason)
    {
        DB::table('student_delete_audit')->insert([
            'student_number' => $studentNumber,
            'deleted_by'     => Auth::id(),
            'deleted_at'     => now(),
            'reason'         => $reason,
            'location'       => request()->ip(),
        ]);
    }

    /**
     * 8. STUDENT ACADEMIC AUDIT (Academic Profile)
     * Table: student_academic_audit
     */
    public static function logStudentAcademic($studentNumber, $remarks)
    {
        DB::table('student_academic_audit')->insert([
            'student_number' => $studentNumber,
            'updated_by'     => Auth::id(),
            'updated_at'     => now(),
            'remarks'        => $remarks,
            'location'       => request()->ip(),
        ]);
    }

    /**
     * 9. STUDENT PROGRAM AUDIT (Program Metrics)
     * Table: student_program_audit
     */
    public static function logStudentProgram($studentNumber, $remarks)
    {
        DB::table('student_program_audit')->insert([
            'student_number' => $studentNumber,
            'updated_by'     => Auth::id(),
            'updated_at'     => now(),
            'remarks'        => $remarks,
            'location'       => request()->ip(),
        ]);
    }
}