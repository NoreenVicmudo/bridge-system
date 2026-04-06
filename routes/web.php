<?php

use App\Http\Controllers\Academic\AcademicController;
use App\Http\Controllers\Academic\GwaController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Student\StudentController;
use App\Models\College;
use App\Models\Program;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ⚠️ DELETE THIS BEFORE GOING TO PRODUCTION!
Route::get('/dev-login/{id}', function ($id) {
    Auth::loginUsingId($id);
    return redirect()->route('dashboard');
});

Route::redirect('/', '/login');

Route::get('/signup', function () {
    return Inertia::render('Signup');
})->name('signup');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/main', function () {
    return Inertia::render('Main');
})->name('main');

// ==========================================
// PUBLIC / UNPROTECTED ROUTES (minimal)
// ==========================================
Route::get('/student-entry', [StudentController::class, 'create'])->name('student.entry');

// ==========================================
// AUTHENTICATED ROUTES
// ==========================================
Route::middleware('auth')->group(function () {
    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Student Management
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

    // Student Views (Masterlist & Filtered)
    Route::get('/student-masterlist', [StudentController::class, 'masterlist'])->name('student.masterlist');
    Route::get('/student-info', [StudentController::class, 'filteredInfo'])->name('student.info');
    Route::get('/student-info-filter', function () {
        return Inertia::render('Student/StudentInfoFilter', [
            'dbColleges' => College::where('is_active', true)->get(),
            'dbPrograms' => Program::where('is_active', true)->get(),
        ]);
    })->name('student.info.filter');

    // API endpoints for student lookup
    Route::get('/api/check-student/{student_number}', [StudentController::class, 'checkStudent'])->name('api.check.student');
    Route::get('/api/get-student-id/{student_number}', [StudentController::class, 'getStudentIdByNumber'])->name('api.get-student-id');

    // Academic Profile – Filter & Options
    Route::get('/academic/filter-options', [AcademicController::class, 'getOptions'])->name('academic.filter-options');
    Route::get('/academic-profile-filter', function () {
        $dbSections = DB::table('student_section')
            ->where('is_active', 1)
            ->select('program_id', 'year_level', 'section')
            ->distinct()
            ->get();

        $sectionsMap = [];
        foreach ($dbSections as $sec) {
            $key = "{$sec->program_id}-{$sec->year_level}";
            $sectionsMap[$key][] = ['value' => $sec->section, 'label' => $sec->section];
        }

        return Inertia::render('Academic/AcademicProfileFilter', [
            'dbColleges' => College::where('is_active', true)->get(),
            'dbPrograms' => Program::where('is_active', true)->get(),
            'dbSections' => $sectionsMap,
        ]);
    })->name('academic.profile.filter');

    // GWA Module
    Route::prefix('academic')->group(function () {
        Route::get('/gwa-info', [GwaController::class, 'index'])->name('gwa.info');
        Route::get('/gwa-entry', [GwaController::class, 'edit'])->name('gwa.entry');
        Route::put('/gwa/{student}', [GwaController::class, 'update'])->name('gwa.update');
        Route::post('/gwa/import', [GwaController::class, 'import'])->name('gwa.import');
    });

    // Other Academic Metrics (placeholders – keep static for now)
    Route::get('/academic/gwa/export', [GwaController::class, 'export'])->name('gwa.export');
    Route::get('/board-subject-grades', fn() => Inertia::render('Academic/BoardSubjectGrades'))->name('board.subject.grades');
    Route::get('/board-grades-entry', fn() => Inertia::render('Academic/BoardGradesEntry'))->name('board.grades.entry');
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

    // Program Metrics (placeholders)
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

    // Additional Entry Pages (global configs)
    Route::get('/student-additional', fn() => Inertia::render('Entry/StudentInformationEntry'))->name('student.additional');
    Route::get('/academic-additional', fn() => Inertia::render('Entry/AcademicProfileEntry'))->name('academic.additional');
    Route::get('/program-additional', fn() => Inertia::render('Entry/ProgramMetricsEntry'))->name('program.additional');

    // Reports
    Route::prefix('report')->group(function () {
        Route::get('/generation-filter', fn() => Inertia::render('Reports/ReportGenerationFilter'))->name('report.generation.filter');
        Route::get('/generation', fn() => Inertia::render('Reports/ReportGeneration'))->name('report.generation');
        Route::get('/programs', fn() => Inertia::render('Reports/ReportGenerationPrograms'))->name('report.programs');
    });

    // Transaction Logs & User Management
    Route::get('/transaction-logs', fn() => Inertia::render('Transactions/TransactionLogs'))->name('transaction.logs');
    Route::get('/users', fn() => Inertia::render('User/UserList'))->name('users');
    Route::get('/edit-users', fn() => Inertia::render('User/EditUser'))->name('edit.users');
});

require __DIR__ . '/auth.php';