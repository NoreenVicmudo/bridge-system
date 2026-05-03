<?php

namespace App\Models\Student;

use App\Models\Program;
use Illuminate\Database\Eloquent\Model;

class StudentSection extends Model
{
    protected $table = 'student_section';
    protected $primaryKey = 'enroll_id';
    public $timestamps = false;

    protected $fillable = [
        'student_number',
        'section',
        'year_level',
        'program_id',
        'semester',
        'academic_year',
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

    public function program()
    {
        return $this->belongsTo(Program::class, 'program_id', 'program_id');
    }
}