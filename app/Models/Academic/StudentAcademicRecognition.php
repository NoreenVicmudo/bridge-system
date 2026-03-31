<?php

namespace App\Models\Academic;

use App\Models\Student\StudentInfo;
use Illuminate\Database\Eloquent\Model;

class StudentAcademicRecognition extends Model
{
    protected $table = 'student_academic_recognition';
    protected $primaryKey = 'recognition_id';
    public $timestamps = false;

    protected $fillable = [
        'student_number',
        'award_count',
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