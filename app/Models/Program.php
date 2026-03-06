<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Program extends Model
{
    protected $primaryKey = 'program_id';
    public $timestamps = false;

    public function college()
    {
        return $this->belongsTo(College::class, 'college_id', 'college_id');
    }
}