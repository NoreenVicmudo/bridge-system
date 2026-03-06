<?php

namespace App\Models\Student;

use App\Models\Student\StudentSection;
use Illuminate\Database\Eloquent\Model;

class StudentInfo extends Model
{
    protected $table = 'student_info';
    protected $primaryKey = 'student_id';
    public $timestamps = false; // We use date_created instead

    protected $fillable = [
        'student_number', 'student_fname', 'student_mname', 'student_lname',
        'student_college', 'student_program', 'is_active'
    ];

    // Relationship to find their current section
    public function enrollments()
    {
        return $this->hasMany(StudentSection::class, 'student_number', 'student_number');
    }

    public function currentEnrollment()
    {
        return $this->hasOne(StudentSection::class, 'student_number', 'student_number')
                    ->where('is_active', 1)
                    ->latest('date_created');
    }
}