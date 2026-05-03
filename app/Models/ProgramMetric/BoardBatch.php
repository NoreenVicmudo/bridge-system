<?php

namespace App\Models\ProgramMetric;

use App\Models\Program;
use App\Models\Student\StudentInfo;
use Illuminate\Database\Eloquent\Model;

class BoardBatch extends Model
{
    protected $table = 'board_batch';
    protected $primaryKey = 'batch_id';
    public $timestamps = false;

    protected $fillable = [
        'student_number',
        'year',
        'program_id',
        'batch_number',
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

    public function reviewCenter()
    {
        return $this->hasOne(StudentReviewCenter::class, 'batch_id', 'batch_id');
    }

    public function mockScores()
    {
        return $this->hasMany(StudentMockBoardScore::class, 'batch_id', 'batch_id');
    }

    public function licensureExam()
    {
        return $this->hasOne(StudentLicensureExam::class, 'batch_id', 'batch_id');
    }
}