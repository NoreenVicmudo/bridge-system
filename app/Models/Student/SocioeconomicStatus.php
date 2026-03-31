<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class SocioeconomicStatus extends Model
{
    protected $table = 'socioeconomic_status';
    protected $primaryKey = 'status';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = ['status', 'minimum', 'maximum', 'date_created'];
}