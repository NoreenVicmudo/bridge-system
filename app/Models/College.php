<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class College extends Model
{
    // Tell Laravel the primary key is not 'id'
    protected $primaryKey = 'college_id';
    
    // Disable default timestamps since you use 'date_created'
    public $timestamps = false; 

    // 🧠 ADDED: Mass Assignment Protection
    protected $fillable = [
        'name',
        'is_active',
        'date_created'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function programs()
    {
        return $this->hasMany(Program::class, 'college_id', 'college_id');
    }
}