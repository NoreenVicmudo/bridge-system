<?php

namespace App\Models\ProgramMetric;

use Illuminate\Database\Eloquent\Model;

class StudentReviewCenter extends Model
{
    protected $table = 'student_review_center';
    protected $primaryKey = 'center_id';
    public $timestamps = false;

    protected $fillable = [
        'batch_id',
        'review_center',
        'date_created',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function batch()
    {
        return $this->belongsTo(BoardBatch::class, 'batch_id', 'batch_id');
    }
}