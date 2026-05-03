<?php

namespace App\Models\Academic;

use App\Models\Program;
use Illuminate\Database\Eloquent\Model;

class BoardSubject extends Model
{
    protected $table = 'board_subjects';
    protected $primaryKey = 'subject_id';
    public $timestamps = false;

    protected $fillable = [
        'program_id',
        'subject_name',
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