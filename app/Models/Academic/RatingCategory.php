<?php

namespace App\Models\Academic;

use App\Models\Program;
use Illuminate\Database\Eloquent\Model;

class RatingCategory extends Model
{
    protected $table = 'rating_category';
    protected $primaryKey = 'category_id';
    public $timestamps = false;

    protected $fillable = [
        'category_name',
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