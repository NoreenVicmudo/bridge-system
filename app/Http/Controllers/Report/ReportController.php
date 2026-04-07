<?php

namespace App\Http\Controllers\Report;

use App\Http\Controllers\Controller;
use App\Models\Student\StudentInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->only(['college', 'program', 'year_start', 'year_end', 'college_name', 'program_name']);

        if (!$filters['program']) {
            return redirect()->route('report.filter');
        }

        // 1. Fetch Mock Subjects
        $mockSubjects = \App\Models\ProgramMetric\MockSubject::where('program_id', $filters['program'])
            ->where('is_active', 1)
            ->get()
            ->map(fn($s) => ['value' => $s->mock_subject_id, 'label' => $s->mock_subject_name]);

        // 2. Fetch Board Subjects (From your subject grades table or subjects table)
        $boardSubjects = DB::table('student_board_subjects_grades')
            ->join('board_subjects', 'student_board_subjects_grades.subject_id', '=', 'board_subjects.subject_id')
            ->where('board_subjects.program_id', $filters['program'])
            ->select('board_subjects.subject_id as value', 'board_subjects.subject_name as label')
            ->distinct()
            ->get();

        // 3. Fetch Performance Criteria
        $performanceCriteria = DB::table('student_performance_rating')
            ->select('category_id as value', 'category_id as label') // Adjust if you have a separate criteria table
            ->distinct()
            ->get();

        // 4. Fetch Simulation Exams
        $simExams = DB::table('student_simulation_exam')
            ->select('simulation_id as value', 'simulation_id as label') // Adjust if you have a titles table
            ->distinct()
            ->get();

        $subMetricMap = [
            'MockScores'        => $mockSubjects,
            'BoardGrades'       => $boardSubjects,
            'PerformanceRating' => $performanceCriteria,
            'SimExam'           => $simExams,
        ];

        return Inertia::render('Reports/ReportGeneration', [
            'filters' => $filters,
            'subMetricMap' => $subMetricMap
        ]);
    }

    private function processPearsonR($students, $config)
    {
        $xData = $this->extractMetricData($students, $config['var1Field'], $config['var1Sub']);
        $yData = $this->extractMetricData($students, $config['var2Field'], $config['var2Sub']);

        // MAGIC: Find students who have BOTH an X and a Y score by intersecting the keys!
        $commonKeys = array_intersect_key($xData, $yData);
        $n = count($commonKeys);

        if ($n < 2) {
            return response()->json(['error' => 'Not enough paired data points (students with both scores) to calculate Pearson R.'], 400);
        }

        $sumX = 0; $sumY = 0; $sumXY = 0; $sumX2 = 0; $sumY2 = 0;
        $rawData = [];

        foreach ($commonKeys as $key => $dummy) {
            $x = (float) $xData[$key];
            $y = (float) $yData[$key];

            $sumX += $x; $sumY += $y;
            $sumXY += ($x * $y);
            $sumX2 += ($x * $x); $sumY2 += ($y * $y);

            // Save the paired coordinates for the React Scatter Plot
            $rawData[] = ['x' => $x, 'y' => $y];
        }

        // Pearson R Formula
        $numerator = ($n * $sumXY) - ($sumX * $sumY);
        $denominatorX = ($n * $sumX2) - pow($sumX, 2);
        $denominatorY = ($n * $sumY2) - pow($sumY, 2);
        
        $denominator = sqrt(max(0, $denominatorX)) * sqrt(max(0, $denominatorY));
        $r = $denominator != 0 ? $numerator / $denominator : 0;

        // Interpretation
        $absR = abs($r);
        if ($absR >= 0.9) $interp = 'Very High';
        elseif ($absR >= 0.7) $interp = 'High';
        elseif ($absR >= 0.5) $interp = 'Moderate';
        elseif ($absR >= 0.3) $interp = 'Low';
        else $interp = 'Negligible';

        $direction = $r < 0 ? 'Negative' : 'Positive';
        $interpretation = $absR < 0.3 ? 'Negligible Correlation' : "$interp $direction Correlation";

        return response()->json([
            'success' => true,
            'title' => 'Pearson R Correlation',
            'variable_name' => $config['var1FieldLabel'] . ' vs ' . $config['var2FieldLabel'],
            'statistics' => [
                'N (Sample Size)' => $n,
                'Pearson r Value' => round($r, 4),
                'Interpretation' => $interpretation
            ],
            'raw_data' => $rawData,
            'chart_type' => 'scatter' // Flags React to render the Scatter Plot
        ]);
    }

    private function extractMetricData($students, $field, $subField)
{
    $batchIds = $students->pluck('batch_id')->toArray();
    $studentNumbers = $students->pluck('student_number')->toArray();
    // Map batch_id to student_number for batch-based tables
    $batchToStudent = $students->pluck('student_number', 'batch_id')->toArray();
    
    $records = [];

    switch ($field) {
        case 'Gender':
            $records = DB::table('student_info')
                ->whereIn('student_number', $studentNumbers)
                ->where('is_active', 1)
                ->pluck('student_sex', 'student_number')->toArray();
            break;

        case 'Age':
            $records = DB::table('student_info')
                ->whereIn('student_number', $studentNumbers)
                ->where('is_active', 1)
                ->selectRaw('student_number, TIMESTAMPDIFF(YEAR, student_birthdate, CURDATE()) as age')
                ->pluck('age', 'student_number')->toArray();
            break;

        case 'Socioeconomic':
            $records = DB::table('student_info')
                ->whereIn('student_number', $studentNumbers)
                ->where('is_active', 1)
                ->pluck('student_socioeconomic', 'student_number')->toArray();
            break;

        case 'WorkStatus':
            $records = DB::table('student_info')
                ->whereIn('student_number', $studentNumbers)
                ->where('is_active', 1)
                ->pluck('student_work', 'student_number')->toArray();
            break;

        case 'GWA':
            $records = DB::table('student_gwa')
                ->whereIn('student_number', $studentNumbers)
                ->where('is_active', 1)
                ->groupBy('student_number')
                ->selectRaw('student_number, AVG(gwa) as value')
                ->pluck('value', 'student_number')->toArray();
            break;

        case 'BoardGrades':
            $query = DB::table('student_board_subjects_grades')
                ->whereIn('student_number', $studentNumbers)
                ->where('is_active', 1);

            // If a specific subject is chosen, filter by it. 
            // If 'overall', this is skipped and AVG() gets the mean of all subjects.
            if ($subField !== 'overall') {
                $query->where('subject_id', $subField); 
            }

            $records = $query->groupBy('student_number')
                ->selectRaw('student_number, AVG(subject_grade) as value')
                ->pluck('value', 'student_number')->toArray();
            break;

        case 'MockScores':
            $query = DB::table('student_mock_board_scores')
                ->whereIn('batch_id', $batchIds)
                ->where('is_active', 1);

            if ($subField !== 'overall') {
                $query->where('mock_subject_id', $subField);
            }

            $raw = $query->groupBy('batch_id')
                ->selectRaw('batch_id, AVG(score) as value')
                ->pluck('value', 'batch_id')->toArray();
            
            foreach($raw as $bId => $val) {
                if(isset($batchToStudent[$bId])) $records[$batchToStudent[$bId]] = $val;
            }
            break;

        case 'Licensure':
            $raw = DB::table('student_licensure_exam') 
                ->whereIn('batch_id', $batchIds)
                ->whereIn('exam_result', ['PASSED', 'FAILED'])
                ->where('is_active', 1)
                ->pluck('exam_result', 'batch_id')->toArray();
            
            foreach($raw as $bId => $result) {
                if(isset($batchToStudent[$bId])) {
                    $records[$batchToStudent[$bId]] = strtoupper($result) === 'PASSED' ? 1.0 : 0.0;
                }
            }
            break;

        case 'PerformanceRating':
            $query = DB::table('student_performance_rating') 
                ->whereIn('student_number', $studentNumbers)
                ->where('is_active', 1);

            // Added subField check for individual criteria vs overall rating
            if ($subField !== 'overall') {
                $query->where('criteria_id', $subField); 
            }

            $records = $query->groupBy('student_number')
                ->selectRaw('student_number, AVG(rating) as value') 
                ->pluck('value', 'student_number')->toArray();
            break;

        case 'SimExam':
            $query = DB::table('student_simulation_exam') 
                ->whereIn('student_number', $studentNumbers)
                ->where('is_active', 1);

            if ($subField !== 'overall') {
                $query->where('simulation_id', $subField); 
            }

            $records = $query->groupBy('student_number')
                ->selectRaw('student_number, AVG(score) as value') 
                ->pluck('value', 'student_number')->toArray();
            break;

        case 'Attendance':
            $records = DB::table('student_attendance_reviews') 
                ->whereIn('student_number', $studentNumbers)
                ->where('is_active', 1)
                ->groupBy('student_number')
                ->selectRaw('student_number, AVG(sessions_attended) as value') 
                ->pluck('value', 'student_number')->toArray();
            break;

        case 'Retakes':
            $records = DB::table('student_back_subjects') 
                ->whereIn('student_number', $studentNumbers)
                ->where('is_active', 1)
                ->groupBy('student_number')
                ->selectRaw('student_number, SUM(terms_repeated) as value') 
                ->pluck('value', 'student_number')->toArray();
            break;
    }

    // Clean data while preserving student_number keys
    return array_filter($records, function($val) {
        return is_numeric($val) || (is_string($val) && strlen($val) > 0);
    });
}
    /**
     * This is the master endpoint that receives the request from StatToolModal.
     */
    public function generate(Request $request)
    {
        try {
            // 1. Accept the new range variables
            $filters = $request->only(['college', 'program', 'year_start', 'year_end']);
            $config = $request->except(['college', 'program', 'year_start', 'year_end']);

            // 2. Query the students
            $studentQuery = StudentInfo::query()
                ->join('board_batch', 'student_info.student_number', '=', 'board_batch.student_number')
                ->where('student_info.is_active', 1)
                ->where('board_batch.is_active', 1)
                ->where('student_info.college_id', $filters['college'])
                ->where('student_info.program_id', $filters['program'])
                ->whereBetween('board_batch.year', [$filters['year_start'], $filters['year_end']])
                ->select('board_batch.batch_id', 'student_info.student_number');

            $batchStudents = $studentQuery->get();

            if ($batchStudents->isEmpty()) {
                return response()->json(['error' => 'No students found in this range.'], 404);
            }

            // 3. Route to the correct statistical treatment
            if ($config['tool'] === 'descriptive') {
                return $this->processDescriptive($batchStudents, $config);
            }
        
            if ($config['tool'] === 'inferential') {
                switch ($config['inferentialType']) {
                    case 'pearson':
                        return $this->processPearsonR($batchStudents, $config);
                    case 'regression':
                        return $this->processRegression($batchStudents, $config);
                    case 'ttest_ind':
                        return $this->processTTestIndependent($batchStudents, $config);
                    case 'ttest_dep':
                        return $this->processTTestDependent($batchStudents, $config);
                    case 'chi_sq_gof':
                        return $this->processChiSquareGoF($batchStudents, $config);
                    case 'chi_sq_toi':
                        return $this->processChiSquareToI($batchStudents, $config);
                    default:
                        return response()->json(['error' => 'Unknown inferential type.'], 400);
                }
            }

        return response()->json(['error' => 'Invalid tool configuration.'], 400);
        } catch (\Exception $e) {
            // THIS WILL CATCH THE CRASH AND SEND IT TO REACT
            return response()->json([
                'error' => 'PHP Crash: ' . $e->getMessage() . ' (Line: ' . $e->getLine() . ')'
            ], 500);
        }
    }

    // ==========================================
    // STATISTICAL PROCESSING METHODS (Placeholders for now)
    // ==========================================

    private function processDescriptive($students, $config)
    {
        // 1. Extract the raw numerical data using our helper
        $data = $this->extractMetricData($students, $config['descField'], $config['descSub']);

        $n = count($data);

        // 2. Error handling if no data is found
        if ($n === 0) {
            return response()->json([
                'success' => false,
                'error' => 'No numerical data found for the selected variable in this batch.'
            ], 404);
        }

        // 3. Perform the Math
        $sum = array_sum($data);
        $mean = $sum / $n;

        // Calculate Sample Variance and Standard Deviation
        $sumOfSquares = 0.0;
        foreach ($data as $value) {
            $sumOfSquares += pow($value - $mean, 2);
        }
        
        $variance = $n > 1 ? $sumOfSquares / ($n - 1) : 0.0;
        $stdDev = sqrt($variance);

        // Calculate Median
        $sortedData = $data;
        sort($sortedData);
        $middle = floor($n / 2);
        if ($n % 2 == 0) {
            $median = ($sortedData[$middle - 1] + $sortedData[$middle]) / 2.0;
        } else {
            $median = $sortedData[$middle];
        }

        $min = min($data);
        $max = max($data);

        // 4. Return the beautifully formatted JSON response to React
        return response()->json([
            'success' => true,
            'title' => 'Descriptive Statistics Analysis',
            'variable_name' => $config['descFieldLabel'] . ($config['descSubLabel'] !== 'Overall ' . $config['descField'] ? ' - ' . $config['descSubLabel'] : ''),
            'statistics' => [
                'N (Sample Size)' => $n,
                'Mean' => round($mean, 4),
                'Median' => round($median, 4),
                'Standard Deviation' => round($stdDev, 4),
                'Variance' => round($variance, 4),
                'Minimum' => round($min, 4),
                'Maximum' => round($max, 4),
            ],
            // Sending raw data back is great for drawing charts (like histograms/boxplots) in React later!
            'raw_data' => $data 
        ]);
    }

    private function processRegression($students, $config)
    {
        $xData = $this->extractMetricData($students, $config['var1Field'], $config['var1Sub']);
        $yData = $this->extractMetricData($students, $config['var2Field'], $config['var2Sub']);

        $commonKeys = array_intersect_key($xData, $yData);
        $n = count($commonKeys);

        if ($n < 2) {
            return response()->json(['error' => 'Insufficient paired data for Regression.'], 400);
        }

        $sumX = 0; $sumY = 0; $sumXY = 0; $sumX2 = 0; $sumY2 = 0;
        $rawData = [];

        foreach ($commonKeys as $key => $dummy) {
            $x = (float) $xData[$key];
            $y = (float) $yData[$key];
            $sumX += $x; $sumY += $y;
            $sumXY += ($x * $y);
            $sumX2 += ($x * $x);
            $sumY2 += ($y * $y);
            $rawData[] = ['x' => $x, 'y' => $y];
        }

        // Regression Formula: y = mx + b
        // Slope (m)
        $slopeNumerator = ($n * $sumXY) - ($sumX * $sumY);
        $slopeDenominator = ($n * $sumX2) - pow($sumX, 2);
        $m = $slopeDenominator != 0 ? $slopeNumerator / $slopeDenominator : 0;

        // Intercept (b)
        $b = ($sumY - ($m * $sumX)) / $n;

        // R-Squared (Coefficient of Determination)
        $pearsonNumerator = $slopeNumerator;
        $pearsonDenominator = sqrt(max(0, ($n * $sumX2 - pow($sumX, 2)) * ($n * $sumY2 - pow($sumY, 2))));
        $r = $pearsonDenominator != 0 ? $pearsonNumerator / $pearsonDenominator : 0;
        $rSquared = pow($r, 2);

        $equation = "y = " . round($m, 4) . "x + " . round($b, 4);

        return response()->json([
            'success' => true,
            'title' => 'Linear Regression Analysis',
            'variable_name' => $config['var1FieldLabel'] . ' (X) vs ' . $config['var2FieldLabel'] . ' (Y)',
            'statistics' => [
                'N (Sample Size)' => $n,
                'Regression Equation' => $equation,
                'Slope (m)' => round($m, 4),
                'Y-Intercept (b)' => round($b, 4),
                'R-Squared (R²)' => round($rSquared, 4),
                'Strength' => round($rSquared * 100, 2) . "% of Y variation is explained by X",
            ],
            'raw_data' => $rawData,
            'regression_line' => [
                'm' => $m,
                'b' => $b,
                'minX' => min(array_column($rawData, 'x')),
                'maxX' => max(array_column($rawData, 'x')),
            ],
            'chart_type' => 'regression' 
        ]);
    }

    private function processTTestIndependent($students, $config)
    {
        $xData = $this->extractMetricData($students, $config['var1Field'], $config['var1Sub']); // Grouping Variable (X)
        $yData = $this->extractMetricData($students, $config['var2Field'], $config['var2Sub']); // Continuous Score (Y)

        $commonKeys = array_intersect_key($xData, $yData);

        $group1 = [];
        $group2 = [];
        $group1Label = "Group A";
        $group2Label = "Group B";

        // SMART SPLITTING LOGIC
        // We need to split the Y scores into two groups based on the X variable
        $uniqueX = array_unique($xData);

        if ($config['var1Field'] === 'Licensure') {
            // Specifically handle Pass (1.0) vs Fail (0.0)
            foreach ($commonKeys as $key => $dummy) {
                if ($xData[$key] == 1.0) $group1[] = $yData[$key];
                else $group2[] = $yData[$key];
            }
            $group1Label = "Passed Licensure";
            $group2Label = "Failed Licensure";
        } else if (count($uniqueX) > 2) {
            // If X is continuous (like Retakes or Absences), split by > 0 and 0
            foreach ($commonKeys as $key => $dummy) {
                if ($xData[$key] > 0) $group1[] = $yData[$key];
                else $group2[] = $yData[$key];
            }
            $group1Label = $config['var1FieldLabel'] . " (> 0)";
            $group2Label = "Zero " . $config['var1FieldLabel'];
        } else {
            // Generic 2-category split (e.g., Gender, Work Status)
            $vals = array_values($uniqueX);
            $val1 = $vals[0] ?? null;
            $val2 = $vals[1] ?? null;

            foreach ($commonKeys as $key => $dummy) {
                // Use strtoupper to ensure "male" matches "MALE"
                $currentX = strtoupper(trim($xData[$key]));
                
                if ($currentX === strtoupper(trim($val1))) {
                    $group1[] = $yData[$key];
                } else if ($currentX === strtoupper(trim($val2))) {
                    $group2[] = $yData[$key];
                }
            }
            $group1Label = $val1 ?? "Group 1";
            $group2Label = $val2 ?? "Group 2";
        }

        $n1 = count($group1);
        $n2 = count($group2);

        if ($n1 < 2 || $n2 < 2) {
            return response()->json(['error' => "Not enough data to compare groups. $group1Label has $n1 records, $group2Label has $n2 records. Both need at least 2."], 400);
        }

        // T-Test Mathematics
        $mean1 = array_sum($group1) / $n1;
        $mean2 = array_sum($group2) / $n2;

        $ss1 = 0; foreach ($group1 as $y) $ss1 += pow($y - $mean1, 2);
        $ss2 = 0; foreach ($group2 as $y) $ss2 += pow($y - $mean2, 2);

        $var1 = $ss1 / ($n1 - 1);
        $var2 = $ss2 / ($n2 - 1);

        $df = $n1 + $n2 - 2;
        $sp2 = ($ss1 + $ss2) / $df; // Pooled Variance
        $se = sqrt($sp2 * ((1 / $n1) + (1 / $n2))); // Standard Error

        $t = $se > 0 ? ($mean1 - $mean2) / $se : 0;

        // Significance check (using standard 1.96 roughly for alpha 0.05 two-tailed)
        // Note: For smaller sample sizes, this uses a generic approximation.
        $criticalValue = $df > 30 ? 1.96 : 2.0; 
        $isSignificant = abs($t) >= $criticalValue;
        $interpretation = $isSignificant 
            ? "Statistically Significant Difference (Reject Null)" 
            : "No Statistically Significant Difference (Fail to Reject)";

        return response()->json([
            'success' => true,
            'title' => 'Independent Samples T-Test',
            'variable_name' => $config['var2FieldLabel'] . ' grouped by ' . $config['var1FieldLabel'],
            'statistics' => [
                'N (' . $group1Label . ')' => $n1,
                'N (' . $group2Label . ')' => $n2,
                'Mean (' . $group1Label . ')' => round($mean1, 4),
                'Mean (' . $group2Label . ')' => round($mean2, 4),
                't-Statistic' => round($t, 4),
                'Degrees of Freedom (df)' => $df,
                'Conclusion' => $interpretation
            ],
            'chart_type' => 'ttest_ind', // Flag for React
            'chart_data' => [
                'labels' => [$group1Label, $group2Label],
                'means' => [$mean1, $mean2]
            ]
        ]);
    }

    private function processTTestDependent($students, $config)
    {
        $xData = $this->extractMetricData($students, $config['var1Field'], $config['var1Sub']);
        $yData = $this->extractMetricData($students, $config['var2Field'], $config['var2Sub']);

        // INTERSECT: Ensure we only use students who have both scores
        $commonKeys = array_intersect_key($xData, $yData);
        $n = count($commonKeys);

        if ($n < 2) {
            return response()->json(['error' => 'Not enough paired observations for a Dependent T-Test.'], 400);
        }

        $differences = [];
        foreach ($commonKeys as $key => $dummy) {
            $differences[] = (float)$yData[$key] - (float)$xData[$key];
        }

        $meanX = array_sum($xData) / count($xData);
        $meanY = array_sum($yData) / count($yData);
        $sumDiff = array_sum($differences);
        $meanDiff = $sumDiff / $n;

        $sumSqDiff = 0;
        foreach ($differences as $d) {
            $sumSqDiff += pow($d - $meanDiff, 2);
        }

        $df = $n - 1;
        $varianceDiff = $sumSqDiff / $df;
        $sdDiff = sqrt($varianceDiff);
        $se = $sdDiff / sqrt($n); // Standard Error of the Mean Difference

        $t = $se > 0 ? $meanDiff / $se : 0;

        // Significance check (Approximation for alpha 0.05)
        $criticalValue = $df > 30 ? 2.042 : 2.145; // Basic t-table lookup approximation
        $isSignificant = abs($t) >= $criticalValue;
        $interpretation = $isSignificant 
            ? "Significant Change/Difference Detected" 
            : "No Significant Change Detected";

        return response()->json([
            'success' => true,
            'title' => 'Dependent (Paired) Samples T-Test',
            'variable_name' => $config['var1FieldLabel'] . ' to ' . $config['var2FieldLabel'],
            'statistics' => [
                'N (Pairs)' => $n,
                'Mean (Variable 1)' => round($meanX, 4),
                'Mean (Variable 2)' => round($meanY, 4),
                'Mean Difference' => round($meanDiff, 4),
                't-Statistic' => round($t, 4),
                'Degrees of Freedom (df)' => $df,
                'Conclusion' => $interpretation
            ],
            'chart_type' => 'ttest_dep',
            'chart_data' => [
                'labels' => [$config['var1FieldLabel'], $config['var2FieldLabel']],
                'means' => [$meanX, $meanY]
            ]
        ]);
    }

    private function processChiSquareToI($students, $config)
    {
        $xData = $this->extractMetricData($students, $config['var1Field'], $config['var1Sub']);
        $yData = $this->extractMetricData($students, $config['var2Field'], $config['var2Sub']);

        $commonKeys = array_intersect_key($xData, $yData);
        $n = count($commonKeys);

        if ($n < 5) {
            return response()->json(['error' => 'Chi-Square requires a larger sample size (N >= 5).'], 400);
        }

        // 1. Create Contingency Table (Observed Frequencies)
        $observed = [];
        $rows = []; // Unique values of X
        $cols = []; // Unique values of Y

        foreach ($commonKeys as $key => $dummy) {
            $r = $xData[$key];
            $c = $yData[$key];
            
            // Format Licensure 1/0 back to Pass/Fail labels for readability
            if ($config['var1Field'] === 'Licensure') $r = $r == 1 ? 'PASSED' : 'FAILED';
            if ($config['var2Field'] === 'Licensure') $c = $c == 1 ? 'PASSED' : 'FAILED';

            if (!isset($observed[$r][$c])) $observed[$r][$c] = 0;
            $observed[$r][$c]++;
            
            $rows[$r] = ($rows[$r] ?? 0) + 1;
            $cols[$c] = ($cols[$c] ?? 0) + 1;
        }

        // 2. Calculate Chi-Square Statistic
        $chiSq = 0;
        $expectedTable = [];
        foreach ($rows as $rName => $rTotal) {
            foreach ($cols as $cName => $cTotal) {
                $exp = ($rTotal * $cTotal) / $n;
                $obs = $observed[$rName][$cName] ?? 0;
                
                $chiSq += $exp > 0 ? pow($obs - $exp, 2) / $exp : 0;
                $expectedTable[$rName][$cName] = round($exp, 2);
            }
        }

        $df = (count($rows) - 1) * (count($cols) - 1);
        $isSignificant = $chiSq > ($df == 1 ? 3.84 : 5.99); // Approx for alpha 0.05

        return response()->json([
            'success' => true,
            'title' => 'Chi-Square Test of Independence',
            'variable_name' => $config['var1FieldLabel'] . ' vs ' . $config['var2FieldLabel'],
            'statistics' => [
                'N (Total Count)' => $n,
                'Chi-Square Value' => round($chiSq, 4),
                'Degrees of Freedom' => $df,
                'Conclusion' => $isSignificant ? "Variables are Dependent (Significant)" : "Variables are Independent (Not Significant)"
            ],
            'chart_type' => 'chi_sq',
            'chart_data' => [
                'labels' => array_keys($cols),
                'datasets' => array_map(function($rName) use ($observed, $cols) {
                    return [
                        'label' => $rName,
                        'data' => array_map(fn($cName) => $observed[$rName][$cName] ?? 0, array_keys($cols))
                    ];
                }, array_keys($rows))
            ]
        ]);
    }

    private function processChiSquareGoF($students, $config)
    {
        $data = $this->extractMetricData($students, $config['var1Field'], $config['var1Sub']);
        $observed = array_count_values($data);
        $n = count($data);
        
        // FIX: Define numCategories so $df doesn't crash
        $numCategories = count($observed);

        if ($n < 5 || $numCategories < 2) {
            return response()->json(['error' => 'Insufficient data or categories for Chi-Square GoF.'], 400);
        }

        $chiSq = 0;
        $userRatios = $config['expected_ratios'] ?? []; 

        foreach ($observed as $cat => $obs) {
            // Use user ratio if provided, otherwise default to equal split
            $ratio = isset($userRatios[$cat]) ? (float)$userRatios[$cat] / 100 : 1 / $numCategories;
            $exp = $n * $ratio;
            
            $chiSq += ($exp > 0) ? pow($obs - $exp, 2) / $exp : 0;
        }

        $df = $numCategories - 1;
        
        // Critical Value check (Approx for alpha 0.05)
        // 1 df = 3.84, 2 df = 5.99, 3 df = 7.81
        $criticalValue = ($df == 1) ? 3.84 : (($df == 2) ? 5.99 : 7.81);
        $isSignificant = $chiSq > $criticalValue;

        return response()->json([
            'success' => true,
            'title' => 'Chi-Square Goodness of Fit',
            'variable_name' => $config['var1FieldLabel'],
            'statistics' => [
                'N (Total)' => $n,
                'Chi-Square Value' => round($chiSq, 4),
                'Degrees of Freedom' => $df,
                'Expected Distribution' => !empty($config['expected_ratios']) ? 'Custom Proportions' : 'Equal Split (Uniform)',
                'Conclusion' => $isSignificant ? "Significant Deviation from Target" : "Fits Target Distribution"
            ],
            'chart_type' => 'bar',
            'raw_data' => $observed 
        ]);
    }

    public function getCategories(Request $request)
    {
        // Use input() with defaults to prevent "Undefined array key" crashes
        $collegeId = $request->input('college');
        $programId = $request->input('program');
        $yearStart = $request->input('year_start');
        $yearEnd   = $request->input('year_end');
        $field     = $request->input('field');
        $subField  = $request->input('subField', 'overall');

        if (!$collegeId || !$programId) {
            return response()->json(['categories' => []]);
        }

        // Query the students
        $students = \App\Models\Student\StudentInfo::query()
            ->join('board_batch', 'student_info.student_number', '=', 'board_batch.student_number')
            ->where('student_info.college_id', $collegeId)
            ->where('student_info.program_id', $programId)
            ->whereBetween('board_batch.year', [$yearStart, $yearEnd])
            ->get();

        if ($students->isEmpty()) {
            return response()->json(['categories' => []]);
        }

        $data = $this->extractMetricData($students, $field, $subField);
        
        // Get unique non-empty values
        $uniqueCategories = array_values(array_unique(array_filter($data)));

        return response()->json(['categories' => $uniqueCategories]);
    }
}