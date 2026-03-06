<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Student\StudentController;
use App\Models\College;
use App\Models\Program;
use Illuminate\Support\Facades\Auth;
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
// 🚨 NOTE: I moved all the duplicate filter 
// and masterlist routes down to the auth group!
// ==========================================

Route::get('/student-entry', function () {
    return Inertia::render('Student/StudentEntryPage'); 
})->name('student.entry');

// ACADEMIC PROFILE (Static routes for now)
Route::get('/gwa-info', function () { return Inertia::render('Academic/GWAInfo'); })->name('gwa.info');
Route::get('/gwa-entry', function () { return Inertia::render('Academic/GWAEntry'); })->name('gwa.entry');
Route::get('/board-subject-grades', function () { return Inertia::render('Academic/BoardSubjectGrades'); })->name('board.subject.grades');
Route::get('/board-grades-entry', function () { return Inertia::render('Academic/BoardGradesEntry'); })->name('board.grades.entry');
Route::get('/retakes-info', function () { return Inertia::render('Academic/RetakesInfo'); })->name('retakes.info');
Route::get('/retakes-entry', function () { return Inertia::render('Academic/RetakesEntry'); })->name('retakes.entry');
Route::get('/performance-rating', function () { return Inertia::render('Academic/PerformanceRating'); })->name('performance.rating');
Route::get('/performance-rating-entry', function () { return Inertia::render('Academic/PerformanceRatingEntry'); })->name('performance.rating.entry');
Route::get('/simulation-exam', function () { return Inertia::render('Academic/SimulationExam'); })->name('simulation.exam');
Route::get('/simulation-exam-entry', function () { return Inertia::render('Academic/SimExamResultsEntry'); })->name('simulation.exam.entry');
Route::get('/review-attendance', function () { return Inertia::render('Academic/ReviewAttendance'); })->name('review.attendance');
Route::get('/review-attendance-entry', function () { return Inertia::render('Academic/AttendanceEntry'); })->name('review.attendance.entry');
Route::get('/academic-recognition', function () { return Inertia::render('Academic/AcademicRecognition'); })->name('academic.recognition');
Route::get('/recognition-entry', function () { return Inertia::render('Academic/RecognitionEntry'); })->name('academic.recognition.entry');

// PROGRAM METRICS (Static routes for now)
Route::get('/review-center', function () { return Inertia::render('Program/ReviewCenter'); })->name('review.center');
Route::get('/review-center-entry', function () { return Inertia::render('Program/ReviewCenterEntry'); })->name('review.center.entry');
Route::get('/mock-board-scores', function () { return Inertia::render('Program/MockBoardScores'); })->name('mock.board.scores');
Route::get('/mock-scores-entry', function () { return Inertia::render('Program/MockScoresEntry'); })->name('mock.scores.entry');
Route::get('/licensure-exam', function () { return Inertia::render('Program/LicensureExam'); })->name('licensure.exam');
Route::get('/licensure-entry', function () { return Inertia::render('Program/LicensureEntry'); })->name('licensure.entry');

// Additional Entry
Route::get('/student-additional', function () { return Inertia::render('Entry/StudentInformationEntry'); })->name('student.additional');
Route::get('/academic-additional', function () { return Inertia::render('Entry/AcademicProfileEntry'); })->name('academic.additional');
Route::get('/program-additional', function () { return Inertia::render('Entry/ProgramMetricsEntry'); })->name('program.additional');
Route::get('/document-design', function () { return Inertia::render('Entry/DocumentFormat'); })->name('document.design');

// REPORT GENERATION & LOGS
Route::get('/report-generation-filter', function () { return Inertia::render('Reports/ReportGenerationFilter'); })->name('report.generation.filter');
Route::get('/transaction-logs', function () { return Inertia::render('Transactions/TransactionLogs'); })->name('transaction.logs');

// MANAGE USERS
Route::get('/users', function () { return Inertia::render('User/UserList'); })->name('users');
Route::get('/edit-users', function () { return Inertia::render('User/EditUser'); })->name('edit.users');


// ==========================================
// 🛡️ AUTHENTICATED & WIRED-UP ROUTES
// ==========================================
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // The Filter Forms (Sending the active colleges & programs)
    Route::get('/student-info-filter', function () {
        return Inertia::render('Student/StudentInfoFilter', [
            'dbColleges' => College::where('is_active', true)->get(), 
            'dbPrograms' => Program::where('is_active', true)->get()
        ]);
    })->name('student.info.filter'); // Fixed route name to match your sidebar

    Route::get('/academic-profile-filter', function () {
        return Inertia::render('Academic/AcademicProfileFilter', [
            'dbColleges' => College::where('is_active', true)->get(), 
            'dbPrograms' => Program::where('is_active', true)->get()
        ]);
    })->name('academic.profile.filter');

    Route::get('/program-metrics-filter', function () {
        return Inertia::render('Program/ProgramMetricsFilter', [
            'dbColleges' => College::where('is_active', true)->get(), 
            'dbPrograms' => Program::where('is_active', true)->get()
        ]);
    })->name('program.metrics.filter');

    // The Masterlist & Filtered Info pages (Pointing to the Controller!)
    Route::get('/student-masterlist', [StudentController::class, 'masterlist'])->name('student.masterlist');
    Route::get('/student-info', [StudentController::class, 'filteredInfo'])->name('student.info');
});

require __DIR__.'/auth.php';