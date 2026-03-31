<?php

namespace App\Models\Academic;

use App\Models\Student\StudentInfo;
use Illuminate\Database\Eloquent\Model;

class StudentSimulationExam extends Model
{
    protected $table = 'student_simulation_exam';
    protected $primaryKey = 'sim_id';
    public $timestamps = false;

    protected $fillable = [
        'student_number',
        'simulation_id',
        'student_score',
        'total_score',
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

    public function simulation()
    {
        return $this->belongsTo(SimulationExam::class, 'simulation_id', 'simulation_id');
    }
}