<?php

namespace App\Models\Academic;

use App\Models\Program;
use Illuminate\Database\Eloquent\Model;

class GeneralSubject extends Model
{
    protected $table = 'general_subjects';
    protected $primaryKey = 'general_subject_id';
    public $timestamps = false;

    protected $fillable = [
        'general_subject_name',
        'program_id',
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