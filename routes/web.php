<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
/*
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});*/

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



//Student Information
Route::get('/student-info-filter', function () {
        return Inertia::render('Student/StudentInfoFilter'); 
    })->name('student.info.filter');

Route::get('/student-masterlist', function () {
    return Inertia::render('Student/StudentMasterlist'); 
})->name('student.masterlist');

Route::get('/student-information', function () {
    return Inertia::render('Student/StudentInfo'); 
})->name('student.information');

Route::get('/student-entry', function () {
    return Inertia::render('Student/StudentEntryPage'); 
})->name('student.entry');


//ACADEMIC PROFILE
Route::get('/academic-profile-filter', function () {
    return Inertia::render('Academic/AcademicProfileFilter'); 
})->name('academic.profile.filter');

Route::get('/gwa-info', function () {
    return Inertia::render('Academic/GWAInfo'); 
})->name('gwa.info');

Route::get('/gwa-entry', function () {
    return Inertia::render('Academic/GWAEntry'); 
})->name('gwa.entry');

Route::get('/board-subject-grades', function () {
    return Inertia::render('Academic/BoardSubjectGrades'); 
})->name('board.subject.grades');

Route::get('/board-grades-entry', function () {
    return Inertia::render('Academic/BoardGradesEntry'); 
})->name('board.grades.entry');

Route::get('/retakes-info', function () {
    return Inertia::render('Academic/RetakesInfo'); 
})->name('retakes.info');

Route::get('/retakes-entry', function () {
    return Inertia::render('Academic/RetakesEntry'); 
})->name('retakes.entry');

Route::get('/performance-rating', function () {
    return Inertia::render('Academic/PerformanceRating'); 
})->name('performance.rating');

Route::get('/performance-rating-entry', function () {
    return Inertia::render('Academic/PerformanceRatingEntry'); 
})->name('performance.rating.entry');

Route::get('/simulation-exam', function () {
    return Inertia::render('Academic/SimulationExam'); 
})->name('simulation.exam');

Route::get('/simulation-exam-entry', function () {
    return Inertia::render('Academic/SimExamResultsEntry'); 
})->name('simulation.exam.entry');

Route::get('/review-attendance', function () {
    return Inertia::render('Academic/ReviewAttendance'); 
})->name('review.attendance');

Route::get('/review-attendance-entry', function () {
    return Inertia::render('Academic/AttendanceEntry'); 
})->name('review.attendance.entry');

Route::get('/academic-recognition', function () {
    return Inertia::render('Academic/AcademicRecognition'); 
})->name('academic.recognition');

Route::get('/recognition-entry', function () {
    return Inertia::render('Academic/RecognitionEntry'); 
})->name('academic.recognition.entry');


// PROGRAM METRICS
Route::get('/program-metrics-filter', function () {
    return Inertia::render('Program/ProgramMetricsFilter'); 
})->name('program.metrics.filter');

Route::get('/review-center', function () {
    return Inertia::render('Program/ReviewCenter'); 
})->name('review.center');

Route::get('/review-center-entry', function () {
    return Inertia::render('Program/ReviewCenterEntry'); 
})->name('review.center.entry');

Route::get('/mock-board-scores', function () {
    return Inertia::render('Program/MockBoardScores'); 
})->name('mock.board.scores');

Route::get('/mock-scores-entry', function () {
    return Inertia::render('Program/MockScoresEntry'); 
})->name('mock.scores.entry');

Route::get('/licensure-exam', function () {
    return Inertia::render('Program/LicensureExam'); 
})->name('licensure.exam');

Route::get('/licensure-entry', function () {
    return Inertia::render('Program/LicensureEntry'); 
})->name('licensure.entry');


//Additional Entry
Route::get('/student-additional', function () {
    return Inertia::render('Entry/StudentInformationEntry'); 
})->name('student.additional');

Route::get('/academic-additional', function () {
    return Inertia::render('Entry/AcademicProfileEntry'); 
})->name('academic.additional');

Route::get('/program-additional', function () {
    return Inertia::render('Entry/ProgramMetricsEntry'); 
})->name('program.additional');



//REPORT GENERATION
Route::get('/report-generation-filter', function () {
    return Inertia::render('Reports/ReportGenerationFilter'); 
})->name('report.generation.filter');



//TRANSACTION LOGS
Route::get('/transaction-logs', function () {
    return Inertia::render('Transactions/TransactionLogs'); 
})->name('transaction.logs');


//MANAGE USERS
Route::get('/users', function () {
    return Inertia::render('User/UserList'); 
})->name('users');

Route::get('/edit-users', function () {
    return Inertia::render('User/EditUser'); 
})->name('edit.users');

//REPORT GENERATION
Route::get('/report-generation', function () {
    return Inertia::render('Reports/ReportGeneration'); 
})->name('report.generation');

Route::get('/report-programs', function () {
    return Inertia::render('Reports/ReportGenerationPrograms'); 
})->name('report.programs');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
