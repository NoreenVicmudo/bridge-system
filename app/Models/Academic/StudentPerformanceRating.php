<?php

namespace App\Models\Academic;

use App\Models\Student\StudentInfo;
use Illuminate\Database\Eloquent\Model;

class StudentPerformanceRating extends Model
{
    protected $table = 'student_performance_rating';
    protected $primaryKey = 'rating_id';
    public $timestamps = false;

    protected $fillable = [
        'student_number',
        'category_id',
        'rating',
        'date_created',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'rating' => 'decimal:2',
    ];

    public function student()
    {
        return $this->belongsTo(StudentInfo::class, 'student_number', 'student_number');
    }

    public function category()
    {
        return $this->belongsTo(RatingCategory::class, 'category_id', 'category_id');
    }
}