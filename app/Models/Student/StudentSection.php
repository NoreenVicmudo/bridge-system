<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class StudentSection extends Model
{
    // Use the exact table name from your SQL
    protected $table = 'student_section';
    
    // Set the primary key as enroll_id
    protected $primaryKey = 'enroll_id';

    // Disable timestamps as your SQL uses date_created
    public $timestamps = false;

    protected $fillable = [
        'student_number',
        'section',
        'year_level',
        'program_id',
        'semester',
        'academic_year',
        'is_active'
    ];

    /**
     * Link back to the main student profile
     */
    public function info()
    {
        return $this->belongsTo(StudentInfo::class, 'student_number', 'student_number');
    }
}