<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\Academic\RatingCategory;
use App\Models\Academic\StudentPerformanceRating;
use App\Models\College;
use App\Models\Program;
use App\Models\Student\StudentInfo;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PerformanceRatingController extends Controller
{
    public function index(Request $request)
    {
        $filter = $request->validate([
            'academic_year' => 'required|string',
            'college'       => 'required|integer',
            'program'       => 'required|integer',
            'year_level'    => 'required|integer',
            'semester'      => 'required|string',
            'section'       => 'required|string',
        ]);

        $college = College::where('college_id', $filter['college'])->first();
        $program = Program::where('program_id', $filter['program'])->first();
        $filter['college_name'] = $college ? $college->name : 'N/A';
        $filter['program_name'] = $program ? $program->name : 'N/A';

        $categories = RatingCategory::where('program_id', $filter['program'])->where('is_active', 1)->get();
        $categoryHeaders = $categories->pluck('category_name')->toArray();

        $query = StudentInfo::whereHas('sections', function ($q) use ($filter) {
            $q->where('academic_year', $filter['academic_year'])
              ->where('program_id', $filter['program'])
              ->where('year_level', $filter['year_level'])
              ->where('semester', $filter['semester'])
              ->where('section', $filter['section'])
              ->where('is_active', 1);
        });

        $search = $request->get('search');
        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $q->where('student_info.student_number', 'LIKE', "%{$search}%")
                  ->orWhereRaw("CONCAT(student_info.student_lname, ', ', student_info.student_fname) LIKE ?", ["%{$search}%"]);
            });
        }

        $sortColumn = $request->get('sort', 'student_info.student_id');
        $sortDirection = $request->get('direction', 'desc');
        $query->orderBy($sortColumn, $sortDirection === 'asc' ? 'asc' : 'desc');

        $students = $query->paginate(10)->withQueryString();

        $ratings = StudentPerformanceRating::whereIn('student_number', $students->pluck('student_number'))
            ->where('is_active', 1)
            ->get()
            ->groupBy('student_number');

        $students->getCollection()->transform(function ($student) use ($ratings, $categories) {
            $studentRatings = $ratings->get($student->student_number) ?? collect();
            
            $ratingMap = [];
            foreach ($categories as $cat) {
                $record = $studentRatings->where('category_id', $cat->category_id)->first();
                $ratingMap[$cat->category_name] = $record ? $record->rating : null; 
            }

            return [
                'id' => $student->student_id,
                'student_number' => $student->student_number,
                'name' => "{$student->student_lname}, {$student->student_fname}",
                'ratings' => $ratingMap,
            ];
        });

        return Inertia::render('Academic/PerformanceRating', [
            'students' => [
                'data' => $students,
                'categories' => $categoryHeaders 
            ],
            'filter' => $filter,
            'search' => $search ?? '',
            'sort' => $sortColumn,
            'direction' => $sortDirection,
        ]);
    }

    public function edit(Request $request)
    {
        $studentId = $request->query('student_id');
        $programId = $request->query('program_id');

        $student = StudentInfo::findOrFail($studentId);

        // 🔒 THE BOUNCER
        $this->authorizeStudentAccess($request->user(), $student, $programId);
        
        $targetProgram = $programId ?? $student->activeProgram->first()?->program_id;

        $categories = RatingCategory::where('program_id', $targetProgram)
            ->where('is_active', 1)
            ->get()
            ->map(fn($cat) => ['value' => $cat->category_id, 'label' => $cat->category_name]);

        $ratings = StudentPerformanceRating::where('student_number', $student->student_number)
            ->where('is_active', 1)
            ->pluck('rating', 'category_id');

        return Inertia::render('Academic/PerformanceRatingEntry', [
            'student' => $student,
            'categoryOptions' => $categories,
            'currentRatings' => $ratings,
        ]);
    }

    public function update(Request $request, $studentId)
    {
        $validated = $request->validate([
            'student_number' => 'required|exists:student_info,student_number',
            'category_id'    => 'required|integer|exists:rating_category,category_id',
            'rating'         => 'required|numeric|min:0|max:100', 
        ]);

        $student = StudentInfo::findOrFail($studentId);

        $category = RatingCategory::findOrFail($validated['category_id']);

        // 🔒 THE BOUNCER
        $this->authorizeStudentAccess($request->user(), $student, $category->program_id);

        StudentPerformanceRating::updateOrCreate(
            [
                'student_number' => $validated['student_number'],
                'category_id'    => $validated['category_id'],
            ],
            [
                'rating'       => $validated['rating'],
                'date_created' => now(),
                'is_active'    => 1,
            ]
        );

        // 📝 AUDIT LOG
        AuditService::logStudentAcademic($student->student_number, "Updated Performance Rating for {$category->category_name}: {$validated['rating']}%");

        return redirect()->back()->with('success', 'Performance rating updated successfully.');
    }

    public function export(Request $request)
    {
        $filter = $request->validate([
            'academic_year' => 'required|string', 'college' => 'required|integer', 'program' => 'required|integer',
            'year_level' => 'required|integer', 'semester' => 'required|string', 'section' => 'required|string',
        ]);

        $sortColumn = $request->get('sort', 'student_info.student_id');
        $sortDirection = $request->get('direction', 'asc');
        $sortColumn = $sortColumn === 'name' ? 'student_info.student_lname' : $sortColumn;

        $categories = RatingCategory::where('program_id', $filter['program'])->where('is_active', 1)->get();
        
        $students = StudentInfo::whereHas('sections', function ($q) use ($filter) {
            $q->where('academic_year', $filter['academic_year'])->where('program_id', $filter['program'])
              ->where('year_level', $filter['year_level'])->where('semester', $filter['semester'])
              ->where('section', $filter['section'])->where('is_active', 1);
        })->orderBy($sortColumn, $sortDirection)->get();

        $ratings = StudentPerformanceRating::whereIn('student_number', $students->pluck('student_number'))->where('is_active', 1)->get()->groupBy('student_number');
        $headers = ['Student Number', 'Student Name'];
        foreach ($categories as $cat) $headers[] = $cat->category_name;

        $callback = function() use ($students, $ratings, $categories, $headers) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);
            foreach ($students as $student) {
                $studentRatings = $ratings->get($student->student_number) ?? collect();
                $row = [$student->student_number, "{$student->student_lname}, {$student->student_fname}"];
                foreach ($categories as $cat) {
                    $record = $studentRatings->where('category_id', $cat->category_id)->first();
                    $row[] = $record ? $record->rating : '';
                }
                fputcsv($file, $row);
            }
            fclose($file);
        };

        $timestamp = now()->format('Y-m-d_H-i');
        $fileName = "PerformanceRatings_{$filter['section']}_{$timestamp}.csv";

        return response()->stream($callback, 200, [
            "Content-type" => "text/csv", "Content-Disposition" => "attachment; filename=\"{$fileName}\"",
            "Pragma" => "no-cache", "Cache-Control" => "must-revalidate, post-check=0, pre-check=0", "Expires" => "0"
        ]);
    }

    public function import(Request $request)
    {
        if (is_string($request->filter)) $request->merge(['filter' => json_decode($request->filter, true)]);
        $request->validate(['file' => 'required|file|mimes:csv,txt', 'filter' => 'required|array', 'filter.program' => 'required|integer']);

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');
        $headers = fgetcsv($handle);
        if (!$headers) return response()->json(['success' => false, 'message' => 'Empty file'], 422);

        $categories = RatingCategory::where('program_id', $request->filter['program'])->where('is_active', 1)->get();
        $categoryMap = [];
        foreach ($categories as $cat) $categoryMap[strtolower(trim($cat->category_name))] = $cat->category_id;

        $categoryColumns = [];
        foreach ($headers as $index => $header) {
            $cleanHeader = strtolower(trim($header));
            if (isset($categoryMap[$cleanHeader])) {
                $categoryColumns[] = ['category_id' => $categoryMap[$cleanHeader], 'index' => $index];
            }
        }

        if (empty($categoryColumns)) return response()->json(['success' => false, 'message' => 'No matching categories found in headers.'], 422);

        $recordsProcessed = 0;
        $now = now();
        $targetProgram = $request->filter['program']; // Make sure you have this variable defined above the loop!

        while (($row = fgetcsv($handle)) !== false) {
            $studentNumber = $row[0] ?? null;
            if (!$studentNumber) continue;

            // 1. Fetch the actual student model
            $student = StudentInfo::where('student_number', $studentNumber)->first();
            if (!$student) continue;

            // 2. 🔒 THE BOUNCER: Test the student against the user's permissions and the target program
            try {
                $this->authorizeStudentAccess($request->user(), $student, $targetProgram);
            } catch (\Exception $e) {
                // If the user doesn't have access, or the student was never in this program, SKIP them!
                continue; 
            }

            foreach ($categoryColumns as $col) {
                $ratingValue = $row[$col['index']] ?? null;
                if ($ratingValue !== null && $ratingValue !== '') {
                    StudentPerformanceRating::updateOrCreate(
                        ['student_number' => $studentNumber, 'category_id' => $col['category_id']],
                        ['rating' => (float)$ratingValue, 'date_created' => $now, 'is_active' => 1]
                    );
                    // 📝 AUDIT LOG
                    AuditService::logStudentAcademic($studentNumber, "Imported CSV Performance Rating for Category ID: {$col['category_id']}");
                    $recordsProcessed++;
                }
            }
        }
        fclose($handle);

        return response()->json(['success' => true, 'message' => 'Import completed', 'records_processed' => $recordsProcessed]);
    }

    /**
     * Prevent IDOR: Check if the logged-in user is allowed to access this student.
     */
    private function authorizeStudentAccess($user, $student, $requestedProgramId = null)
    {
        if (!$user->college_id && !$user->program_id) return;

        if ($user->college_id) {
            $hasCollegeRecord = $student->programs()
                ->join('programs as p', 'student_programs.program_id', '=', 'p.program_id')
                ->where('p.college_id', $user->college_id)
                ->exists();
            if (!$hasCollegeRecord) abort(403, 'Unauthorized: Student has no historical or active records in your College.');
        }

        if ($user->program_id) {
            $hasProgramRecord = DB::table('student_programs')
                ->where('student_number', $student->student_number)
                ->where('program_id', $user->program_id)
                ->exists();
            if (!$hasProgramRecord) abort(403, 'Unauthorized: Student has no historical or active records in your Program.');
        }

        if ($requestedProgramId) {
            $isValidRequest = DB::table('student_programs')
                ->where('student_number', $student->student_number)
                ->where('program_id', $requestedProgramId)
                ->exists();
            if (!$isValidRequest) abort(404, 'Invalid Context: Student has never been enrolled in the requested program.');
        }
    }
}