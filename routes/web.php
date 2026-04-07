<?php

use App\Http\Controllers\Academic\AcademicController;
use App\Http\Controllers\Academic\AttendanceController;
use App\Http\Controllers\Academic\BackSubjectsController;
use App\Http\Controllers\Academic\BoardGradeController;
use App\Http\Controllers\Academic\GwaController;
use App\Http\Controllers\Academic\PerformanceRatingController;
use App\Http\Controllers\Academic\RecognitionController;
use App\Http\Controllers\Academic\SimulationExamController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Program\ProgramFilterController;
use App\Http\Controllers\Program\ReviewCenterController;
use App\Http\Controllers\Student\StudentController;
use App\Models\College;
use App\Models\Program;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ==========================================
// ⚠️ DEV LOGIN (DELETE BEFORE PRODUCTION)
// ==========================================
Route::get('/dev-login/{id}', function ($id) {
    Auth::loginUsingId($id);
    return redirect()->route('dashboard');
});

// ==========================================
// PUBLIC & GUEST ROUTES
// ==========================================
Route::redirect('/', '/login');

Route::get('/signup', function () {
    return Inertia::render('Signup');
})->name('signup');

Route::get('/student-entry', [StudentController::class, 'create'])->name('student.entry');

// ==========================================
// AUTHENTICATED ROUTES
// ==========================================
Route::middleware('auth')->group(function () {
    
    // --- MAIN DASHBOARD VIEWS ---
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->middleware('verified')->name('dashboard');

    Route::get('/main', function () {
        return Inertia::render('Main');
    })->name('main');

    // --- PROFILE MANAGEMENT ---
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // --- STUDENT MANAGEMENT (CRUD & Actions) ---
    Route::prefix('students')->group(function () {
        Route::get('/{student}/edit', [StudentController::class, 'edit'])->name('students.edit');
        Route::put('/{student}', [StudentController::class, 'update'])->name('students.update');
        Route::delete('/{student}', [StudentController::class, 'destroy'])->name('students.destroy');
        Route::post('/', [StudentController::class, 'store'])->name('students.store');
        Route::post('/import', [StudentController::class, 'import'])->name('students.import');
        Route::post('/import-batch', [StudentController::class, 'importBatch'])->name('students.import.batch');
        Route::post('/masterlist', [StudentController::class, 'storeMasterlist'])->name('students.masterlist.store');
        Route::post('/direct-enroll', [StudentController::class, 'directEnroll'])->name('students.direct-enroll');
        Route::post('/bulk-destroy', [StudentController::class, 'bulkDestroy'])->name('students.bulk-destroy');
    });

    // --- STUDENT LOOKUP & APIS ---
    Route::get('/api/check-student/{student_number}', [StudentController::class, 'checkStudent'])->name('api.check.student');
    Route::get('/api/get-student-id/{student_number}', [StudentController::class, 'getStudentIdByNumber'])->name('api.get-student-id');

    // --- STUDENT FRONTEND VIEWS ---
    Route::get('/student-masterlist', [StudentController::class, 'masterlist'])->name('student.masterlist');
    Route::get('/student-info', [StudentController::class, 'filteredInfo'])->name('student.info');
    Route::get('/student-info-filter', function () {
        return Inertia::render('Student/StudentInfoFilter', [
            'dbColleges' => College::where('is_active', true)->get(),
            'dbPrograms' => Program::where('is_active', true)->get(),
        ]);
    })->name('student.info.filter');

    // --- ACADEMIC METRICS (Controllers Built) ---
    Route::get('/academic/filter-options', [AcademicController::class, 'getOptions'])->name('academic.filter-options');
    
    Route::get('/academic-profile-filter', function () {
        $dbSections = DB::table('student_section')
            ->where('is_active', 1)->select('program_id', 'year_level', 'section')
            ->distinct()->get();

        $sectionsMap = [];
        foreach ($dbSections as $sec) {
            $sectionsMap["{$sec->program_id}-{$sec->year_level}"][] = ['value' => $sec->section, 'label' => $sec->section];
        }

        return Inertia::render('Academic/AcademicProfileFilter', [
            'dbColleges' => College::where('is_active', true)->get(),
            'dbPrograms' => Program::where('is_active', true)->get(),
            'dbSections' => $sectionsMap,
        ]);
    })->name('academic.profile.filter');

    // Grouping only the working Academic Controllers (URLs start with /academic/...)
    Route::prefix('academic')->group(function () {
        // GWA
        Route::get('/gwa-info', [GwaController::class, 'index'])->name('gwa.info');
        Route::get('/gwa-entry', [GwaController::class, 'edit'])->name('gwa.entry');
        Route::put('/gwa/{student}', [GwaController::class, 'update'])->name('gwa.update');
        Route::post('/gwa/import', [GwaController::class, 'import'])->name('gwa.import');
        Route::get('/gwa/export', [GwaController::class, 'export'])->name('gwa.export');
        
        // Board Subjects
        Route::get('/board-subject-grades', [BoardGradeController::class, 'index'])->name('board.subject.grades');
        Route::get('/board-grades-entry', [BoardGradeController::class, 'edit'])->name('board.grades.entry');
        Route::put('/board-grades/{student}', [BoardGradeController::class, 'update'])->name('board-grades.update');
        Route::post('/board-grades/import', [BoardGradeController::class, 'import'])->name('board-grades.import');
        Route::get('/board-grades/export', [BoardGradeController::class, 'export'])->name('board-grades.export');
    
        // Performance Rating
        Route::get('/performance-rating', [PerformanceRatingController::class, 'index'])->name('performance.rating');
        Route::get('/performance-rating-entry', [PerformanceRatingController::class, 'edit'])->name('performance.rating.entry');
        Route::put('/performance-rating/{student}', [PerformanceRatingController::class, 'update'])->name('performance-rating.update');
        Route::post('/performance-rating/import', [PerformanceRatingController::class, 'import'])->name('performance-rating.import');
        Route::get('/performance-rating/export', [PerformanceRatingController::class, 'export'])->name('performance-rating.export');
        
        // Simulation Exam
        Route::get('/simulation-exam', [SimulationExamController::class, 'index'])->name('simulation.exam');
        Route::get('/simulation-exam-entry', [SimulationExamController::class, 'edit'])->name('simulation.exam.entry');
        Route::put('/simulation-exam/{student}', [SimulationExamController::class, 'update'])->name('simulation-exam.update');
        Route::post('/simulation-exam/import', [SimulationExamController::class, 'import'])->name('simulation-exam.import');
        Route::get('/simulation-exam/export', [SimulationExamController::class, 'export'])->name('simulation-exam.export');
    
        Route::get('/retakes-info', [BackSubjectsController::class, 'index'])->name('retakes.info');
        Route::get('/retakes-entry', [BackSubjectsController::class, 'edit'])->name('retakes.entry');
        Route::put('/retakes/{student}', [BackSubjectsController::class, 'update'])->name('retakes.update');
        Route::post('/retakes/import', [BackSubjectsController::class, 'import'])->name('retakes.import');
        Route::get('/retakes/export', [BackSubjectsController::class, 'export'])->name('retakes.export');
    
        Route::get('/review-attendance', [AttendanceController::class, 'index'])->name('review.attendance');
        Route::get('/review-attendance-entry', [AttendanceController::class, 'edit'])->name('review.attendance.entry');
        Route::put('/review-attendance/{student}', [AttendanceController::class, 'update'])->name('review.attendance.update');
        Route::post('/review-attendance/import', [AttendanceController::class, 'import'])->name('review.attendance.import');
        Route::get('/review-attendance/export', [AttendanceController::class, 'export'])->name('review.attendance.export');

        // Academic Recognition
        Route::get('/academic-recognition', [RecognitionController::class, 'index'])->name('academic.recognition');
        Route::get('/recognition-entry', [RecognitionController::class, 'edit'])->name('academic.recognition.entry');
        Route::put('/recognition/{student}', [RecognitionController::class, 'update'])->name('academic.recognition.update');
        Route::post('/recognition/import', [RecognitionController::class, 'import'])->name('academic.recognition.import');
        Route::get('/recognition/export', [RecognitionController::class, 'export'])->name('academic.recognition.export');

    });

    // --- PROGRAM METRICS GROUP ---
    Route::prefix('program')->group(function () {
        Route::get('/filter-options', [ProgramFilterController::class, 'getOptions'])
        ->name('program.filter-options');
        
        // Review Center Routes
        Route::get('/review-center', [ReviewCenterController::class, 'index'])->name('review.center');
        Route::get('/review-center-entry', [ReviewCenterController::class, 'edit'])->name('review.center.entry');
        Route::put('/review-center/{student}', [ReviewCenterController::class, 'update'])->name('review.center.update');
        Route::post('/review-center/import', [ReviewCenterController::class, 'import'])->name('review.center.import');
        Route::get('/review-center/export', [ReviewCenterController::class, 'export'])->name('review.center.export');
        
        // You can add Mock Boards and Licensure here later...
    });

    // --- ACADEMIC METRICS (Placeholders) ---
    // (Kept outside the prefix so your current frontend URLs do not break!)
    Route::get('/retakes-info', fn() => Inertia::render('Academic/RetakesInfo'))->name('retakes.info');
    Route::get('/retakes-entry', fn() => Inertia::render('Academic/RetakesEntry'))->name('retakes.entry');
    Route::get('/performance-rating', fn() => Inertia::render('Academic/PerformanceRating'))->name('performance.rating');
    Route::get('/performance-rating-entry', fn() => Inertia::render('Academic/PerformanceRatingEntry'))->name('performance.rating.entry');
    Route::get('/simulation-exam', fn() => Inertia::render('Academic/SimulationExam'))->name('simulation.exam');
    Route::get('/simulation-exam-entry', fn() => Inertia::render('Academic/SimExamResultsEntry'))->name('simulation.exam.entry');
    Route::get('/review-attendance', fn() => Inertia::render('Academic/ReviewAttendance'))->name('review.attendance');
    Route::get('/review-attendance-entry', fn() => Inertia::render('Academic/AttendanceEntry'))->name('review.attendance.entry');
    Route::get('/academic-recognition', fn() => Inertia::render('Academic/AcademicRecognition'))->name('academic.recognition');
    Route::get('/recognition-entry', fn() => Inertia::render('Academic/RecognitionEntry'))->name('academic.recognition.entry');

    // --- PROGRAM METRICS (Placeholders) ---
    Route::get('/program-metrics-filter', function () {
        return Inertia::render('Program/ProgramMetricsFilter', [
            'dbColleges' => College::where('is_active', true)->get(),
            'dbPrograms' => Program::where('is_active', true)->get(),
        ]);
    })->name('program.metrics.filter');
    
    Route::get('/review-center', fn() => Inertia::render('Program/ReviewCenter'))->name('review.center');
    Route::get('/review-center-entry', fn() => Inertia::render('Program/ReviewCenterEntry'))->name('review.center.entry');
    Route::get('/mock-board-scores', fn() => Inertia::render('Program/MockBoardScores'))->name('mock.board.scores');
    Route::get('/mock-scores-entry', fn() => Inertia::render('Program/MockScoresEntry'))->name('mock.scores.entry');
    Route::get('/licensure-exam', fn() => Inertia::render('Program/LicensureExam'))->name('licensure.exam');
    Route::get('/licensure-entry', fn() => Inertia::render('Program/LicensureEntry'))->name('licensure.entry');

    // --- ADDITIONAL ENTRY PAGES ---
    Route::get('/student-additional', fn() => Inertia::render('Entry/StudentInformationEntry'))->name('student.additional');
    Route::get('/academic-additional', fn() => Inertia::render('Entry/AcademicProfileEntry'))->name('academic.additional');
    Route::get('/program-additional', fn() => Inertia::render('Entry/ProgramMetricsEntry'))->name('program.additional');

    // --- REPORTS ---
    Route::prefix('report')->group(function () {
        Route::get('/generation-filter', fn() => Inertia::render('Reports/ReportGenerationFilter'))->name('report.generation.filter');
        Route::get('/generation', fn() => Inertia::render('Reports/ReportGeneration'))->name('report.generation');
        Route::get('/programs', fn() => Inertia::render('Reports/ReportGenerationPrograms'))->name('report.programs');
    });

    // --- SYSTEM LOGS & USERS ---
    Route::get('/transaction-logs', fn() => Inertia::render('Transactions/TransactionLogs'))->name('transaction.logs');
    Route::get('/users', fn() => Inertia::render('User/UserList'))->name('users');
    Route::get('/edit-users', fn() => Inertia::render('User/EditUser'))->name('edit.users');
});

require __DIR__ . '/auth.php';