<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class LivingArrangement extends Model
{
    protected $table = 'living_arrangements';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = ['name'];
}