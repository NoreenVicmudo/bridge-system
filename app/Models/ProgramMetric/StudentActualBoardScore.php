<?php

namespace App\Models\ProgramMetric;

use Illuminate\Database\Eloquent\Model;

class StudentActualBoardScore extends Model
{
    protected $table = 'student_actual_board_scores';
    protected $primaryKey = 'score_id';
    public $timestamps = false;

    protected $fillable = [
        'batch_id',
        'mock_subject_id', // Represents the PRC Subject (NP1, NP2, etc.)
        'score',
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

    // Links perfectly to your existing MockSubject model!
    public function prcSubject()
    {
        return $this->belongsTo(MockSubject::class, 'mock_subject_id', 'mock_subject_id');
    }
}