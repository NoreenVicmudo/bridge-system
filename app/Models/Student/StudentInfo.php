<?php

namespace App\Models\Student;

use App\Models\Academic\StudentAcademicRecognition;
use App\Models\Academic\StudentAttendanceReview;
use App\Models\Academic\StudentBackSubject;
use App\Models\Academic\StudentBoardGrade;
use App\Models\Academic\StudentGwa;
use App\Models\Academic\StudentPerformanceRating;
use App\Models\Academic\StudentSimulationExam;
use App\Models\College;
use App\Models\Program;
use App\Models\ProgramMetric\BoardBatch;
use App\Models\Student\Language;
use App\Models\Student\LivingArrangement;
use App\Models\Student\SocioeconomicStatus;
use App\Models\Student\StudentSection;
use Illuminate\Database\Eloquent\Model;

class StudentInfo extends Model
{
    protected $table = 'student_info';
    protected $primaryKey = 'student_id';
    public $timestamps = false;

    protected $fillable = [
        'student_number',
        'student_fname',
        'student_mname',
        'student_lname',
        'student_suffix',
        'college_id',
        'program_id',
        'student_birthdate',
        'student_sex',
        'student_socioeconomic',
        'student_address_number',
        'student_address_street',
        'student_address_barangay',
        'student_address_city',
        'student_address_province',
        'student_address_postal',
        'student_living',
        'student_work',
        'student_scholarship',
        'student_language',
        'student_last_school',
        'date_created',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'date_created' => 'datetime',
        'student_birthdate' => 'date:Y-m-d',
    ];

    public function college()
    {
        return $this->belongsTo(College::class, 'college_id', 'college_id');
    }

    public function program()
    {
        return $this->belongsTo(Program::class, 'program_id', 'program_id');
    }

    public function living()
    {
        return $this->belongsTo(LivingArrangement::class, 'student_living', 'id');
    }

    public function language()
    {
        return $this->belongsTo(Language::class, 'student_language', 'id');
    }

    public function sections()
    {
        return $this->hasMany(StudentSection::class, 'student_number', 'student_number');
    }

    public function currentSection()
    {
        return $this->hasOne(StudentSection::class, 'student_number', 'student_number')
            ->where('is_active', true)
            ->latest('date_created');
    }

    public function batches()
    {
        return $this->hasMany(BoardBatch::class, 'student_number', 'student_number');
    }

    // Academic metrics
    public function gwa()
    {
        return $this->hasMany(StudentGwa::class, 'student_number', 'student_number');
    }

    public function boardGrades()
    {
        return $this->hasMany(StudentBoardGrade::class, 'student_number', 'student_number');
    }

    public function backSubjects()
    {
        return $this->hasMany(StudentBackSubject::class, 'student_number', 'student_number');
    }

    public function performanceRatings()
    {
        return $this->hasMany(StudentPerformanceRating::class, 'student_number', 'student_number');
    }

    public function simulationExams()
    {
        return $this->hasMany(StudentSimulationExam::class, 'student_number', 'student_number');
    }

    public function attendanceReview()
    {
        return $this->hasOne(StudentAttendanceReview::class, 'student_number', 'student_number');
    }

    public function academicRecognition()
    {
        return $this->hasOne(StudentAcademicRecognition::class, 'student_number', 'student_number');
    }

    public function currentEnrollment()
    {
        return $this->hasOne(StudentSection::class, 'student_number', 'student_number')
                    ->where('is_active', 1)
                    ->latest('date_created');
    }
    
    public function getSocioeconomicCategoryAttribute()
    {
        $income = $this->student_socioeconomic;
        if (is_null($income)) return 'N/A';

        $category = SocioeconomicStatus::where(function($q) use ($income) {
                $q->where('minimum', '<=', $income)
                ->where(function($sub) use ($income) {
                    $sub->where('maximum', '>=', $income)
                        ->orWhereNull('maximum');
                });
            })
            ->orWhere(function($q) use ($income) {
                $q->whereNull('minimum')
                ->where('maximum', '>=', $income);
            })
            ->first();

        return $category ? $category->status : 'Unknown';
    }
}