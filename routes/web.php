<?php

use App\Http\Controllers\Academic\{
    AcademicController, AttendanceController, BackSubjectsController, 
    BoardGradeController, GwaController, PerformanceRatingController, 
    RecognitionController, SimulationExamController
};
use App\Http\Controllers\Program\{ProgramFilterController, ReviewCenterController, MockBoardController, LicensureExamController};
use App\Http\Controllers\Report\{ReportController};
use App\Http\Controllers\DataEntry\{AcademicProfileController, ProgramMetricsController, StudentInfoController};
use App\Http\Controllers\{ProfileController, TransactionController, UserController, Student\StudentController};
use App\Models\{College, Program};
use Illuminate\Support\Facades\{Auth, DB, Route};
use Inertia\Inertia;

// ==========================================
// ⚠️ DEV LOGIN & REDIRECTS
// ==========================================
Route::get('/dev-login/{id}', function ($id) {
    Auth::loginUsingId($id);
    return redirect()->route('main');
});
Route::redirect('/', '/login');

// ==========================================
// AUTHENTICATED ROUTES
// ==========================================
Route::middleware('auth', 'verified')->group(function () {
    
    // --- CORE ---
    Route::get('/dashboard', fn() => Inertia::render('Dashboard'))->name('dashboard');
    Route::get('/main', fn() => Inertia::render('Main'))->name('main');

    // --- STUDENT MASTERLIST & PROFILE ---
    Route::prefix('students')->group(function () {
        Route::get('/masterlist', [StudentController::class, 'masterlist'])->name('student.masterlist');
        Route::get('/filtered-info', [StudentController::class, 'filteredInfo'])->name('student.info');
        Route::get('/export/csv', [StudentController::class, 'export'])->name('students.export');
        Route::get('/{student}/edit', [StudentController::class, 'edit'])->name('students.edit');
        
        Route::post('/', [StudentController::class, 'store'])->name('students.store');
        Route::post('/masterlist-store', [StudentController::class, 'storeMasterlist'])->name('students.masterlist.store');
        Route::post('/import', [StudentController::class, 'import'])->name('students.import');
        Route::post('/import-batch', [StudentController::class, 'importBatch'])->name('students.import.batch');
        Route::post('/direct-enroll', [StudentController::class, 'directEnroll'])->name('students.direct-enroll');
        Route::post('/bulk-destroy', [StudentController::class, 'bulkDestroy'])->name('students.bulk-destroy');
        
        Route::put('/{student}', [StudentController::class, 'update'])->name('students.update');
        Route::delete('/{student}', [StudentController::class, 'destroy'])->name('students.destroy');
    });

    // --- ACADEMIC METRICS (SECTION-BASED) ---
    Route::prefix('academic')->group(function () {
        Route::get('/filter-options', [AcademicController::class, 'getOptions'])->name('academic.filter-options');
        
        // GWA
        Route::get('/gwa', [GwaController::class, 'index'])->name('gwa.info');
        Route::get('/gwa-entry', [GwaController::class, 'edit'])->name('gwa.entry');
        Route::put('/gwa/{student}', [GwaController::class, 'update'])->name('gwa.update');
        Route::get('/gwa-export', [GwaController::class, 'export'])->name('gwa.export');
        Route::post('/gwa-import', [GwaController::class, 'import'])->name('gwa.import');
        
        // Board Grades
        Route::get('/board-grades', [BoardGradeController::class, 'index'])->name('board.subject.grades');
        Route::get('/board-grades-entry', [BoardGradeController::class, 'edit'])->name('board.grades.entry');
        Route::put('/board-grades/{student}', [BoardGradeController::class, 'update'])->name('board-grades.update');
        Route::get('/board-grades-export', [BoardGradeController::class, 'export'])->name('board-grades.export');
        Route::post('/board-grades-import', [BoardGradeController::class, 'import'])->name('board-grades.import');

        // Performance
        Route::get('/performance', [PerformanceRatingController::class, 'index'])->name('performance.rating');
        Route::get('/performance-entry', [PerformanceRatingController::class, 'edit'])->name('performance.rating.entry');
        Route::put('/performance/{student}', [PerformanceRatingController::class, 'update'])->name('performance-rating.update');
        Route::get('/performance-export', [PerformanceRatingController::class, 'export'])->name('performance-rating.export');
        Route::post('/performance-import', [PerformanceRatingController::class, 'import'])->name('performance-rating.import');

        // Simulation
        Route::get('/simulation', [SimulationExamController::class, 'index'])->name('simulation.exam');
        Route::get('/simulation-entry', [SimulationExamController::class, 'edit'])->name('simulation.exam.entry');
        Route::put('/simulation/{student}', [SimulationExamController::class, 'update'])->name('simulation-exam.update');
        Route::get('/simulation-export', [SimulationExamController::class, 'export'])->name('simulation-exam.export');
        Route::post('/simulation-import', [SimulationExamController::class, 'import'])->name('simulation-exam.import');

        // Retakes / Back Subjects
        Route::get('/retakes', [BackSubjectsController::class, 'index'])->name('retakes.info');
        Route::get('/retakes-entry', [BackSubjectsController::class, 'edit'])->name('retakes.entry');
        Route::put('/retakes/{student}', [BackSubjectsController::class, 'update'])->name('retakes.update');
        Route::get('/retakes-export', [BackSubjectsController::class, 'export'])->name('retakes.export');
        Route::post('/retakes-import', [BackSubjectsController::class, 'import'])->name('retakes.import');

        // Attendance
        Route::get('/attendance', [AttendanceController::class, 'index'])->name('review.attendance');
        Route::get('/attendance-entry', [AttendanceController::class, 'edit'])->name('review.attendance.entry');
        Route::put('/attendance/{student}', [AttendanceController::class, 'update'])->name('review.attendance.update');
        Route::get('/attendance-export', [AttendanceController::class, 'export'])->name('review.attendance.export');
        Route::post('/attendance-import', [AttendanceController::class, 'import'])->name('review.attendance.import');

        // Recognition
        Route::get('/recognition', [RecognitionController::class, 'index'])->name('academic.recognition');
        Route::get('/recognition-entry', [RecognitionController::class, 'edit'])->name('academic.recognition.entry');
        Route::put('/recognition/{student}', [RecognitionController::class, 'update'])->name('academic.recognition.update');
        Route::get('/recognition-export', [RecognitionController::class, 'export'])->name('academic.recognition.export');
        Route::post('/recognition-import', [RecognitionController::class, 'import'])->name('academic.recognition.import');
    });

    // --- PROGRAM METRICS (BATCH-BASED) ---
    Route::prefix('program')->group(function () {
        Route::get('/filter-options', [ProgramFilterController::class, 'getOptions'])->name('program.filter-options');
        
        // Review Center (ZIGGY FIX APPLIED HERE)
        // --- inside Route::prefix('program')->group(...) ---

        // Combine the two entry routes into one bulletproof route
        Route::get('/review-center/edit/{batchId?}', [ReviewCenterController::class, 'edit'])->name('review.center.edit');

        // Keep the rest as they are (matching your ReviewCenter.jsx names)
        Route::get('/review-center', [ReviewCenterController::class, 'index'])->name('review.center');
        Route::put('/review-center/{batchId}', [ReviewCenterController::class, 'update'])->name('review.center.update');
        Route::get('/review-center-export', [ReviewCenterController::class, 'export'])->name('review.center.export');
        Route::post('/review-center-import', [ReviewCenterController::class, 'import'])->name('review.center.import');

        // Mock Board Scores
        Route::get('/mock-board', [MockBoardController::class, 'index'])->name('mock.board.scores');
        Route::get('/mock-board-entry', [MockBoardController::class, 'edit'])->name('mock.scores.entry');
        Route::put('/mock-board/{batch}', [MockBoardController::class, 'update'])->name('mock-scores.update');
        Route::get('/mock-board-export', [MockBoardController::class, 'export'])->name('mock-scores.export');
        Route::post('/mock-board-import', [MockBoardController::class, 'import'])->name('mock-scores.import');

        // Licensure
        Route::get('/licensure', [LicensureExamController::class, 'index'])->name('licensure.exam');
        Route::get('/licensure/edit/{batchId?}', [LicensureExamController::class, 'edit'])->name('licensure.exam.edit');
        Route::put('/licensure/{batchId}', [LicensureExamController::class, 'update'])->name('licensure.exams.update');
        Route::get('/licensure/export', [LicensureExamController::class, 'export'])->name('licensure.exam.export');
        Route::post('/licensure/import', [LicensureExamController::class, 'import'])->name('licensure.exam.import');
    });

    // --- FILTER PAGES (STATIC INERTIA RENDERS) ---
    Route::get('/filter/student-info', fn() => Inertia::render('Student/StudentInfoFilter', [
        'dbColleges' => College::where('is_active', true)->get(),
        'dbPrograms' => Program::where('is_active', true)->get(),
    ]))->name('student.info.filter');

    Route::get('/filter/academic-profile', function () {
        $dbSections = DB::table('student_section')->where('is_active', 1)->select('program_id', 'year_level', 'section')->distinct()->get();
        $sectionsMap = [];
        foreach ($dbSections as $sec) { $sectionsMap["{$sec->program_id}-{$sec->year_level}"][] = ['value' => $sec->section, 'label' => $sec->section]; }
        return Inertia::render('Academic/AcademicProfileFilter', [
            'dbColleges' => College::where('is_active', true)->get(),
            'dbPrograms' => Program::where('is_active', true)->get(),
            'dbSections' => $sectionsMap,
        ]);
    })->name('academic.profile.filter');

    Route::get('/filter/program-metrics', fn() => Inertia::render('Program/ProgramMetricsFilter', [
        'dbColleges' => College::where('is_active', true)->get()->map(fn($c) => ['value' => $c->college_id, 'label' => $c->name]),
        'dbPrograms' => Program::where('is_active', true)->get(),
    ]))->name('program.metrics.filter');

    Route::get('/filter/report', fn() => Inertia::render('Reports/ReportGenerationFilter', [
        'dbColleges' => College::where('is_active', true)->get()->map(fn($c) => ['value' => $c->college_id, 'label' => $c->name]),
        'dbPrograms' => Program::where('is_active', true)->get(),
    ]))->name('report.filter');

    Route::get('/report', [ReportController::class, 'index'])->name('report.index');
    Route::post('/report/generate', [ReportController::class, 'generate'])->name('report.generate');
    Route::post('/report/categories', [ReportController::class, 'getCategories'])->name('report.categories');
    // --- DATA ENTRY & LOGS (Aligned with Tabs) ---

    // Student Information Entry (Landing Page)
    Route::get('/student-additional', [StudentInfoController::class, 'index'])->name('student-info-entry.index');
    Route::post('/entry/student', [StudentInfoController::class, 'store'])->name('student-info-entry.store');

    // Academic Profile Entry
    Route::get('/academic-additional', [AcademicProfileController::class, 'index'])->name('academic-profile-entry.index');
    Route::post('/entry/academic', [AcademicProfileController::class, 'store'])->name('academic-profile-entry.store');

    // Program Metrics Entry
    Route::get('/program-additional', [ProgramMetricsController::class, 'index'])->name('program-metrics-entry.index');
    Route::post('/entry/program', [ProgramMetricsController::class, 'store'])->name('program-metrics-entry.store');

    // --- PROFILE ---
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // --- TRANSACTION LOGS (COMBINED AUDIT TRAIL) ---
    Route::get('/transaction-logs', [TransactionController::class, 'index'])->name('transactions.index');

    // --- USER MANAGEMENT ---
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index'])->name('users.index');
        
        // Add these two!
        Route::get('/create', [UserController::class, 'create'])->name('users.create');
        Route::post('/', [UserController::class, 'store'])->name('users.store');
        
        Route::get('/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::put('/{user}', [UserController::class, 'update'])->name('users.update');
        Route::post('/bulk-destroy', [UserController::class, 'bulkDestroy'])->name('users.bulk-destroy');
    });

    // --- APIS ---
    Route::get('/api/check-student/{student_number}', [StudentController::class, 'checkStudent'])->name('api.check.student');
    Route::get('/api/get-student-id/{student_number}', [StudentController::class, 'getStudentIdByNumber'])->name('api.get-student-id');
});

require __DIR__ . '/auth.php';