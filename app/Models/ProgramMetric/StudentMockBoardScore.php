<?php

namespace App\Models\ProgramMetric;

use Illuminate\Database\Eloquent\Model;

class StudentMockBoardScore extends Model
{
    protected $table = 'student_mock_board_scores';
    protected $primaryKey = 'score_id';
    public $timestamps = false;

    protected $fillable = [
        'batch_id',
        'mock_subject_id',
        'score', // Changed to single score
        'date_created',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'score'     => 'float',
    ];

    public function batch()
    {
        return $this->belongsTo(BoardBatch::class, 'batch_id', 'batch_id');
    }

    public function mockSubject()
    {
        return $this->belongsTo(MockSubject::class, 'mock_subject_id', 'mock_subject_id');
    }
}