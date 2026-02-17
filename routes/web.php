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

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/main', function () {
    return Inertia::render('Main');
})->name('main');

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

Route::get('/edit-student', function () {
    return Inertia::render('Student/Edit'); 
})->name('edit.student');



Route::get('/academic-profile-filter', function () {
    return Inertia::render('Academic/AcademicProfileFilter'); 
})->name('academic.profile.filter');

Route::get('/program-metrics-filter', function () {
    return Inertia::render('Program/ProgramMetricsFilter'); 
})->name('program.metrics.filter');

Route::get('/report-generation-filter', function () {
    return Inertia::render('Reports/ReportGenerationFilter'); 
})->name('report.generation.filter');



Route::get('/gwa-info', function () {
    return Inertia::render('Academic/GWAInfo'); 
})->name('gwa.info');

Route::get('/board-subject-grades', function () {
    return Inertia::render('Academic/BoardSubjectGrades'); 
})->name('board.subject.grades');

Route::get('/retakes-info', function () {
    return Inertia::render('Academic/RetakesInfo'); 
})->name('retakes.info');

Route::get('/performance-rating', function () {
    return Inertia::render('Academic/PerformanceRating'); 
})->name('performance.rating');

Route::get('/simulation-exam', function () {
    return Inertia::render('Academic/SimulationExam'); 
})->name('simulation.exam');

Route::get('/review-attendance', function () {
    return Inertia::render('Academic/ReviewAttendance'); 
})->name('review.attendance');

Route::get('/academic-recognition', function () {
    return Inertia::render('Academic/AcademicRecognition'); 
})->name('academic.recognition');

Route::get('/review-center', function () {
    return Inertia::render('Program/ReviewCenter'); 
})->name('review.center');

Route::get('/mock-board-scores', function () {
    return Inertia::render('Program/MockBoardScores'); 
})->name('mock.board.scores');

Route::get('/licensure-exam', function () {
    return Inertia::render('Program/LicensureExam'); 
})->name('licensure.exam');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
