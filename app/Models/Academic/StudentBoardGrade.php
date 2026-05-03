<?php

namespace App\Models\Academic;

use App\Models\Student\StudentInfo;
use Illuminate\Database\Eloquent\Model;

class StudentBoardGrade extends Model
{
    protected $table = 'student_board_subjects_grades';
    protected $primaryKey = 'grade_id';
    public $timestamps = false;

    protected $fillable = [
        'student_number',
        'subject_id',
        'subject_grade',
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

    public function subject()
    {
        return $this->belongsTo(BoardSubject::class, 'subject_id', 'subject_id');
    }
}