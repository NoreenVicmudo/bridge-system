<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class Language extends Model
{
    protected $table = 'languages';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = ['name'];
}