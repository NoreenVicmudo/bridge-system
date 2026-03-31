<?php

namespace App\Models\ProgramMetric;

use Illuminate\Database\Eloquent\Model;

class StudentLicensureExam extends Model
{
    protected $table = 'student_licensure_exam';
    protected $primaryKey = 'exam_id';
    public $timestamps = false;

    protected $fillable = [
        'batch_id',
        'exam_result',
        'exam_date_taken',
        'date_created',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'exam_date_taken' => 'date',
    ];

    public function batch()
    {
        return $this->belongsTo(BoardBatch::class, 'batch_id', 'batch_id');
    }
}