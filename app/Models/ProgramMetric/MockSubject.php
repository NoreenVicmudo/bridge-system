<?php

namespace App\Models\ProgramMetric;

use App\Models\Program;
use Illuminate\Database\Eloquent\Model;

class MockSubject extends Model
{
    protected $table = 'mock_subjects';
    protected $primaryKey = 'mock_subject_id';
    public $timestamps = false;

    protected $fillable = [
        'program_id',
        'mock_subject_name',
        'date_created',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function program()
    {
        return $this->belongsTo(Program::class, 'program_id', 'program_id');
    }
}