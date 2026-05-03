<?php

namespace App\Models\Academic;

use App\Models\Student\StudentInfo;
use Illuminate\Database\Eloquent\Model;

class StudentBackSubject extends Model
{
    protected $table = 'student_back_subjects';
    protected $primaryKey = 'back_id';
    public $timestamps = false;

    protected $fillable = [
        'student_number',
        'general_subject_id',
        'terms_repeated',
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

    public function generalSubject()
    {
        return $this->belongsTo(GeneralSubject::class, 'general_subject_id', 'general_subject_id');
    }
}