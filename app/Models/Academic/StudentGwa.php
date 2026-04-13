<?php

namespace App\Models\Academic;

use App\Models\Student\StudentInfo;
use Illuminate\Database\Eloquent\Model;

class StudentGwa extends Model
{
    protected $table = 'student_gwa';
    protected $primaryKey = 'gwa_id';
    public $timestamps = false;

    protected $fillable = [
        'student_number',
        'program_id',
        'year_level',
        'semester',
        'gwa',
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