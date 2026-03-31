<?php

namespace App\Models\Academic;

use App\Models\Student\StudentInfo;
use Illuminate\Database\Eloquent\Model;

class StudentAttendanceReview extends Model
{
    protected $table = 'student_attendance_reviews';
    protected $primaryKey = 'attendance_id';
    public $timestamps = false;

    protected $fillable = [
        'student_number',
        'sessions_attended',
        'sessions_total',
        'date_created',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function student()
    {
        return $this->belongsTo(StudentInfo::class, 'student_number', 'student_number');
    }
}