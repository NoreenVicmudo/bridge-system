<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Program extends Model
{
    protected $primaryKey = 'program_id';
    public $timestamps = false;

    // 🧠 ADDED: Mass Assignment Protection
    protected $fillable = [
        'name',
        'college_id',
        'is_active',
        'date_created'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function college()
    {
        return $this->belongsTo(College::class, 'college_id', 'college_id');
    }
}