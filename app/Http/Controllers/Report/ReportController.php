<?php

namespace App\Http\Controllers\Report;

use App\Http\Controllers\Controller;
use App\Models\Student\StudentInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Services\StatisticsService;
use App\Services\AuditService;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->only(['college', 'program', 'year_start', 'year_end', 'college_name', 'program_name']);

        $user = $request->user();

        if ($user->college_id && $filters['college'] != $user->college_id) {
            abort(403, 'Unauthorized: You cannot generate reports outside your assigned College.');
        }
        if ($user->program_id && $filters['program'] != $user->program_id) {
            abort(403, 'Unauthorized: You cannot generate reports outside your assigned Program.');
        }

        if (!$filters['program']) {
            return redirect()->route('report.filter');
        }

        $mockSubjects = \App\Models\ProgramMetric\MockSubject::where('program_id', $filters['program'])
            ->where('is_active', 1)
            ->get()
            ->map(fn($s) => ['value' => $s->mock_subject_id, 'label' => $s->mock_subject_name]);

        $boardSubjects = DB::table('student_board_subjects_grades')
            ->join('board_subjects', 'student_board_subjects_grades.subject_id', '=', 'board_subjects.subject_id')
            ->where('board_subjects.program_id', $filters['program'])
            ->select('board_subjects.subject_id as value', 'board_subjects.subject_name as label')
            ->distinct()
            ->get();

        $performanceCriteria = \App\Models\Academic\RatingCategory::where('program_id', $filters['program'])
            ->where('is_active', 1)
            ->get()
            ->map(fn($c) => ['value' => $c->category_id, 'label' => $c->category_name]);

        $simExams = \App\Models\Academic\SimulationExam::where('program_id', $filters['program'])
            ->where('is_active', 1)
            ->get()
            ->map(fn($s) => ['value' => $s->simulation_id, 'label' => $s->simulation_name]);

        $gwaTerms = DB::table('student_gwa')
            ->select('year_level', 'semester')
            ->distinct()
            ->orderBy('year_level')
            ->orderBy('semester')
            ->get()
            ->map(function ($gwa) {
                return [
                    'value' => $gwa->year_level . '|' . $gwa->semester, 
                    'label' => "Year {$gwa->year_level} - Semester {$gwa->semester}"
                ];
            });

        $subMetricMap = [
            'MockScores'        => $mockSubjects,
            'BoardGrades'       => $boardSubjects,
            'PerformanceRating' => $performanceCriteria,
            'SimExam'           => $simExams,
            'GWA'               => $gwaTerms, 
        ];

        return Inertia::render('Reports/ReportGeneration', [
            'filters' => $filters,
            'subMetricMap' => $subMetricMap
        ]);
    }
    
    public function generate(Request $request)
    {
        try {
            // 🧠 FIXED: Grab the pretty names too so they render nicely on the PDF
            $filters = $request->only(['college', 'program', 'year_start', 'year_end', 'college_name', 'program_name']);
            $config = $request->except(['college', 'program', 'year_start', 'year_end', 'college_name', 'program_name']);

            $user = $request->user();

            if ($user->college_id && $filters['college'] != $user->college_id) {
                abort(403, 'Unauthorized: You cannot generate reports outside your assigned College.');
            }
            if ($user->program_id && $filters['program'] != $user->program_id) {
                abort(403, 'Unauthorized: You cannot generate reports outside your assigned Program.');
            }
        

            $studentQuery = StudentInfo::query()
                ->join('board_batch', 'student_info.student_number', '=', 'board_batch.student_number')
                ->join('programs', 'board_batch.program_id', '=', 'programs.program_id')
                ->where('student_info.is_active', 1)
                ->where('board_batch.is_active', 1)
                ->where('programs.college_id', $filters['college'])
                ->where('board_batch.program_id', $filters['program'])
                ->whereBetween('board_batch.year', [$filters['year_start'], $filters['year_end']])
                ->select('board_batch.batch_id', 'student_info.student_number');

            $batchStudents = $studentQuery->get();

            if ($batchStudents->isEmpty()) {
                return response()->json(['error' => 'No students found in this primary range.'], 404);
            }

            $treatment = $config['tool'] === 'inferential' ? $config['inferentialType'] : 'descriptive';
            $batchContext = "College {$filters['college']}, Program {$filters['program']}, Batch {$filters['year_start']}-{$filters['year_end']}";
            AuditService::logReportGeneration($batchContext, $treatment, "Generated {$treatment} report");

            // 🧠 FIXED: We format the payload to be passed into every statistical processing function
            $filtersPayload = [
                'College' => $filters['college_name'] ?? $filters['college'],
                'Program' => $filters['program_name'] ?? $filters['program'],
                'Batch Year Range' => "{$filters['year_start']} - {$filters['year_end']}"
            ];

            // Route to the correct statistical treatment, passing the new filtersPayload!
            if ($config['tool'] === 'descriptive') {
                return $this->processDescriptive($batchStudents, $config, $filtersPayload);
            }
        
            if ($config['tool'] === 'inferential') {
                switch ($config['inferentialType']) {
                    case 'pearson':
                        return $this->processPearsonR($batchStudents, $config, $filtersPayload);
                    case 'regression':
                        return $this->processRegression($batchStudents, $config, $filtersPayload);
                    case 'ttest_ind':
                        return $this->processTTestIndependent($batchStudents, $config, $filters, $filtersPayload);
                    case 'ttest_dep':
                        return $this->processTTestDependent($batchStudents, $config, $filtersPayload);
                    case 'chi_sq_gof':
                        return $this->processChiSquareGoF($batchStudents, $config, $filtersPayload);
                    case 'chi_sq_toi':
                        return $this->processChiSquareToI($batchStudents, $config, $filtersPayload);
                    default:
                        return response()->json(['error' => 'Unknown inferential type.'], 400);
                }
            }

            return response()->json(['error' => 'Invalid tool configuration.'], 400);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Calculation Error: ' . $e->getMessage()
            ], 500);
        }
    }

    // ==========================================
    // STATISTICAL PROCESSING METHODS
    // ==========================================

    // 🧠 FIXED: Added $filtersPayload parameter to ALL processing functions
    private function processDescriptive($students, $config, $filtersPayload)
    {
        $dataAssoc = $this->extractMetricData($students, $config['descField'], $config['descSub']);
        $data = array_values($dataAssoc);

        if (count($data) === 0) {
            return response()->json(['error' => 'No numerical data found for the selected variable in this batch.'], 404);
        }

        $stats = StatisticsService::descriptive($data);

        return response()->json([
            'success' => true,
            'title' => 'Descriptive Statistics Analysis',
            'variable_name' => $config['descFieldLabel'] . ($config['descSubLabel'] !== 'Overall ' . $config['descField'] ? ' - ' . $config['descSubLabel'] : ''),
            'statistics' => $stats,
            'raw_data' => $data,
            'chart_type' => 'descriptive',
            'filters' => $filtersPayload // 🧠 ADDED
        ]);
    }

    private function processPearsonR($students, $config, $filtersPayload)
    {
        $xData = $this->extractMetricData($students, $config['var1Field'], $config['var1Sub']);
        $yData = $this->extractMetricData($students, $config['var2Field'], $config['var2Sub']);

        $commonKeys = array_intersect_key($xData, $yData);
        if (count($commonKeys) < 3) {
            return response()->json(['error' => 'Pearson R requires at least 3 students with both scores.'], 400);
        }
        
        $x = []; $y = []; $rawData = [];
        foreach ($commonKeys as $key => $dummy) {
            $x[] = (float)$xData[$key];
            $y[] = (float)$yData[$key];
            $rawData[] = ['x' => (float)$xData[$key], 'y' => (float)$yData[$key]];
        }

        $stats = StatisticsService::pearsonR($x, $y);
        $regStats = StatisticsService::regression($x, $y); 

        $absR = abs($stats['R-Value']);
        if ($absR >= 0.9) $interp = 'Very High';
        elseif ($absR >= 0.7) $interp = 'High';
        elseif ($absR >= 0.5) $interp = 'Moderate';
        elseif ($absR >= 0.3) $interp = 'Low';
        else $interp = 'Negligible';

        $direction = $stats['R-Value'] < 0 ? 'Negative' : 'Positive';
        $interpretation = $absR < 0.3 ? 'Negligible Correlation' : "$interp $direction Correlation";

        return response()->json([
            'success' => true,
            'title' => 'Pearson R Correlation',
            'variable_name' => $config['var1FieldLabel'] . ' vs ' . $config['var2FieldLabel'],
            'statistics' => [
                'N (Sample Size)' => count($x),
                'Pearson r Value' => $stats['R-Value'],
                'Degrees of Freedom' => $stats['Degrees of Freedom'],
                'P-Value' => $stats['P-Value'],
                'Interpretation' => $interpretation,
                'Conclusion' => $stats['Significance']
            ],
            'raw_data' => $rawData,
            'regression_line' => [
                'm' => $regStats['Slope (m)'],
                'b' => $regStats['Intercept (b)'],
                'minX' => $regStats['minX'],
                'maxX' => $regStats['maxX'],
            ],
            'chart_type' => 'scatter',
            'filters' => $filtersPayload // 🧠 ADDED
        ]);
    }

    private function processRegression($students, $config, $filtersPayload)
    {
        $xData = $this->extractMetricData($students, $config['var1Field'], $config['var1Sub']);
        $yData = $this->extractMetricData($students, $config['var2Field'], $config['var2Sub']);

        $commonKeys = array_intersect_key($xData, $yData);
        if (count($commonKeys) < 3) {
            return response()->json(['error' => 'Regression requires at least 3 students with both scores.'], 400);
        }
        
        $x = []; $y = []; $rawData = [];
        foreach ($commonKeys as $key => $dummy) {
            $x[] = (float)$xData[$key];
            $y[] = (float)$yData[$key];
            $rawData[] = ['x' => (float)$xData[$key], 'y' => (float)$yData[$key]];
        }

        $stats = StatisticsService::regression($x, $y);

        return response()->json([
            'success' => true,
            'title' => 'Linear Regression Analysis',
            'variable_name' => $config['var1FieldLabel'] . ' (X) vs ' . $config['var2FieldLabel'] . ' (Y)',
            'statistics' => [
                'N (Sample Size)' => count($x),
                'Regression Equation' => $stats['Equation'],
                'Slope (m)' => $stats['Slope (m)'],
                'Y-Intercept (b)' => $stats['Intercept (b)'],
                'R-Squared (R²)' => $stats['R-Squared'],
                'Strength' => round($stats['R-Squared'] * 100, 2) . "% of Y variation is explained by X",
            ],
            'raw_data' => $rawData,
            'regression_line' => [
                'm' => $stats['Slope (m)'],
                'b' => $stats['Intercept (b)'],
                'minX' => $stats['minX'],
                'maxX' => $stats['maxX'],
            ],
            'chart_type' => 'regression',
            'filters' => $filtersPayload // 🧠 ADDED
        ]);
    }

    private function processTTestIndependent($students, $config, $filters, $filtersPayload)
    {
        $mode = $config['independent_mode'] ?? 'categories';
        
        $group1 = []; $group2 = [];
        $group1Label = ""; $group2Label = "";
        $variableName = "";

        if ($mode === 'batches') {
            $dataA = $this->extractMetricData($students, $config['metric'], $config['sub_metric']);
            $group1 = array_values($dataA);
            $group1Label = "Batch {$config['group_a_start']}-{$config['group_a_end']}";

            $groupBQuery = \App\Models\Student\StudentInfo::query()
                ->join('board_batch', 'student_info.student_number', '=', 'board_batch.student_number')
                ->join('programs', 'board_batch.program_id', '=', 'programs.program_id')
                ->where('student_info.is_active', 1)
                ->where('board_batch.is_active', 1)
                ->where('programs.college_id', $filters['college'])
                ->where('board_batch.program_id', $filters['program'])
                ->whereBetween('board_batch.year', [$config['group_b_start'], $config['group_b_end']])
                ->select('board_batch.batch_id', 'student_info.student_number')
                ->get();

            if ($groupBQuery->isEmpty()) throw new \Exception("No students found in Group B's batch range.");

            $dataB = $this->extractMetricData($groupBQuery, $config['metric'], $config['sub_metric']);
            $group2 = array_values($dataB);
            $group2Label = "Batch {$config['group_b_start']}-{$config['group_b_end']}";

            $variableName = $config['var1FieldLabel'];

        } else {
            $xData = $this->extractMetricData($students, $config['var1Field'], $config['var1Sub']);
            $yData = $this->extractMetricData($students, $config['var2Field'], $config['var2Sub']);

            $commonKeys = array_intersect_key($xData, $yData);
            $uniqueX = array_unique($xData);

            if ($config['var1Field'] === 'Licensure') {
                foreach ($commonKeys as $key => $dummy) {
                    if ($xData[$key] == 1.0) $group1[] = $yData[$key];
                    else $group2[] = $yData[$key];
                }
                $group1Label = "Passed Licensure"; $group2Label = "Failed Licensure";
            }
            // ==================================================
            // 🧠 SMART CATEGORY GROUPING ENGINE
            // Automatically splits multi-variant categories into 2 standard groups!
            // ==================================================
            elseif ($config['var1Field'] === 'Scholarship') {
                foreach ($commonKeys as $key => $dummy) {
                    $val = strtolower(trim($xData[$key]));
                    if (in_array($val, ['none', 'n/a', 'unspecified', ''])) {
                        $group2[] = $yData[$key];
                    } else {
                        $group1[] = $yData[$key];
                    }
                }
                $group1Label = "With Scholarship"; $group2Label = "No Scholarship";
            } 
            elseif ($config['var1Field'] === 'WorkStatus') {
                foreach ($commonKeys as $key => $dummy) {
                    $val = strtolower(trim($xData[$key]));
                    if (in_array($val, ['none', 'unemployed', 'n/a', 'unspecified', 'not working', ''])) {
                        $group2[] = $yData[$key];
                    } else {
                        $group1[] = $yData[$key]; // Part-time, Full-time, etc.
                    }
                }
                $group1Label = "Employed"; $group2Label = "Unemployed";
            } 
            elseif ($config['var1Field'] === 'LivingArrangement') {
                foreach ($commonKeys as $key => $dummy) {
                    $val = strtolower(trim($xData[$key]));
                    if (str_contains($val, 'parent') || str_contains($val, 'family') || str_contains($val, 'home') || $val === 'none') {
                        $group1[] = $yData[$key]; 
                    } else {
                        $group2[] = $yData[$key]; // Dorm, Boarding House, Independent, etc.
                    }
                }
                $group1Label = "Living w/ Parents/Family"; $group2Label = "Independent/Dorm";
            } 
            elseif ($config['var1Field'] === 'Language') {
                foreach ($commonKeys as $key => $dummy) {
                    $val = strtolower(trim($xData[$key]));
                    if (str_contains($val, 'english')) {
                        $group1[] = $yData[$key];
                    } else {
                        $group2[] = $yData[$key]; // Tagalog, Cebuano, etc.
                    }
                }
                $group1Label = "English Speakers"; $group2Label = "Local/Other Languages";
            } 
            // Fallback for Numerical Data or Unknown Categorical Data (> 2 values)
            elseif (count($uniqueX) > 2) {
                if (is_numeric(reset($uniqueX))) {
                    foreach ($commonKeys as $key => $dummy) {
                        if ((float)$xData[$key] > 0) $group1[] = $yData[$key];
                        else $group2[] = $yData[$key];
                    }
                    $group1Label = $config['var1FieldLabel'] . " (> 0)"; $group2Label = "Zero " . $config['var1FieldLabel'];
                } else {
                    foreach ($commonKeys as $key => $dummy) {
                        $val = strtolower(trim($xData[$key]));
                        if (in_array($val, ['none', 'n/a', 'unspecified', ''])) {
                            $group2[] = $yData[$key];
                        } else {
                            $group1[] = $yData[$key];
                        }
                    }
                    $group1Label = "Has " . $config['var1FieldLabel']; $group2Label = "No " . $config['var1FieldLabel'];
                }
            } else {
                // Exactly 2 generic categories (e.g. Gender: Male/Female)
                $vals = array_values($uniqueX);
                $val1 = $vals[0] ?? null; $val2 = $vals[1] ?? null;
                foreach ($commonKeys as $key => $dummy) {
                    $currentX = strtoupper(trim($xData[$key]));
                    if ($currentX === strtoupper(trim($val1))) $group1[] = $yData[$key];
                    else if ($currentX === strtoupper(trim($val2))) $group2[] = $yData[$key];
                }
                $group1Label = $val1 ?? "Group 1"; $group2Label = $val2 ?? "Group 2";
            }
            // ==================================================

            $variableName = $config['var2FieldLabel'] . ' grouped by ' . $config['var1FieldLabel'];
        }

        if (count($group1) < 2 || count($group2) < 2) {
            return response()->json(['error' => "Not enough data to compare groups. {$group1Label} has " . count($group1) . " records, {$group2Label} has " . count($group2) . " records."], 400);
        }

        $stats = StatisticsService::independentTTest($group1, $group2);

        return response()->json([
            'success' => true,
            'title' => 'Independent Samples T-Test',
            'variable_name' => $variableName,
            'statistics' => [
                "N ({$group1Label})" => $stats['count1'],
                "N ({$group2Label})" => $stats['count2'],
                "Mean ({$group1Label})" => round($stats['mean1'], 4),
                "Mean ({$group2Label})" => round($stats['mean2'], 4),
                't-Statistic' => round($stats['t_score'], 4),
                'Degrees of Freedom (df)' => round($stats['df'], 2),
                'P-Value' => round($stats['p_value'], 4),
                'Conclusion' => $stats['is_significant'] ? 'Statistically Significant Difference' : 'No Significant Difference'
            ],
            'chart_type' => 'ttest_ind',
            'chart_data' => [
                'labels' => [$group1Label, $group2Label],
                'means' => [$stats['mean1'], $stats['mean2']]
            ],
            'raw_data' => [ 
                'group1' => $group1,
                'group2' => $group2
            ],
            'filters' => $filtersPayload // 🧠 ADDED
        ]);
    }

    private function processTTestDependent($students, $config, $filtersPayload)
    {
        $data1 = $this->extractMetricData($students, $config['metric'], $config['sub_metric'], $config['period_1']);
        $data2 = $this->extractMetricData($students, $config['metric'], $config['sub_metric'], $config['period_2']);

        $commonKeys = array_intersect_key($data1, $data2);
        
        if (count($commonKeys) < 2) {
            return response()->json(['error' => 'Not enough paired observations for a Dependent T-Test.'], 400);
        }

        $paired1 = []; $paired2 = [];
        foreach ($commonKeys as $k => $d) {
            $paired1[] = (float)$data1[$k];
            $paired2[] = (float)$data2[$k];
        }

        $stats = StatisticsService::dependentTTest($paired1, $paired2);

        return response()->json([
            'success' => true,
            'title' => 'Dependent (Paired) Samples T-Test',
            'variable_name' => "{$config['var1FieldLabel']} ({$config['period_1']} vs {$config['period_2']})",
            'statistics' => [
                'N (Pairs)' => $stats['paired_count'],
                "Mean ({$config['period_1']})" => round($stats['mean1'], 4),
                "Mean ({$config['period_2']})" => round($stats['mean2'], 4),
                'Mean Difference' => round($stats['mean2'] - $stats['mean1'], 4),
                't-Statistic' => round($stats['t_score'], 4),
                'Degrees of Freedom (df)' => $stats['df'],
                'P-Value' => round($stats['p_value'], 4),
                'Conclusion' => $stats['is_significant'] ? 'Significant Change/Difference Detected' : 'No Significant Change'
            ],
            'chart_type' => 'ttest_dep',
            'chart_data' => [
                'labels' => [$config['period_1'], $config['period_2']],
                'means' => [$stats['mean1'], $stats['mean2']]
            ],
            'raw_data' => [
                'group1' => $paired1,
                'group2' => $paired2
            ],
            'filters' => $filtersPayload // 🧠 ADDED
        ]);
    }

    private function processChiSquareToI($students, $config, $filtersPayload)
    {
        $xData = $this->extractMetricData($students, $config['var1Field'], $config['var1Sub']);
        $yData = $this->extractMetricData($students, $config['var2Field'], $config['var2Sub']);

        $commonKeys = array_intersect_key($xData, $yData);
        if (count($commonKeys) < 5) return response()->json(['error' => 'Chi-Square requires a larger sample size (N >= 5).'], 400);

        $matrix = [];
        
        foreach ($commonKeys as $key => $dummy) {
            $r = $xData[$key];
            $c = $yData[$key];
            
            if ($config['var1Field'] === 'Licensure') $r = $r == 1 ? 'PASSED' : 'FAILED';
            if ($config['var2Field'] === 'Licensure') $c = $c == 1 ? 'PASSED' : 'FAILED';

            if (!isset($matrix[$r][$c])) $matrix[$r][$c] = 0;
            $matrix[$r][$c]++;
        }

        $stats = StatisticsService::chiSquareTOI($matrix);

        $labels = array_keys($matrix);
        $subCategories = [];
        foreach ($matrix as $row) foreach (array_keys($row) as $col) $subCategories[$col] = true;
        $subCategories = array_keys($subCategories);

        $datasets = [];
        foreach ($subCategories as $subCat) {
            $dataPoints = [];
            foreach ($labels as $mainCat) {
                $dataPoints[] = $matrix[$mainCat][$subCat] ?? 0;
            }
            $datasets[] = ['label' => $subCat, 'data' => $dataPoints];
        }

        return response()->json([
            'success' => true,
            'title' => 'Chi-Square Test of Independence',
            'variable_name' => $config['var1FieldLabel'] . ' vs ' . $config['var2FieldLabel'],
            'statistics' => [
                'N (Total Count)' => count($commonKeys),
                'Chi-Square Value' => round($stats['chi_square'], 4),
                'Degrees of Freedom' => $stats['df'],
                'P-Value' => round($stats['p_value'], 4),
                'Conclusion' => $stats['is_significant'] ? "Variables are Dependent (Significant)" : "Variables are Independent (Not Significant)"
            ],
            'chart_type' => 'chi_sq',
            'chart_data' => [
                'labels' => $labels,
                'datasets' => $datasets
            ],
            'filters' => $filtersPayload // 🧠 ADDED
        ]);
    }

    private function processChiSquareGoF($students, $config, $filtersPayload)
    {
        $data = $this->extractMetricData($students, $config['var1Field'], $config['var1Sub']);
        
        if ($config['var1Field'] === 'Licensure') {
            $data = array_map(function($val) {
                return $val == 1.0 ? 'PASSED' : 'FAILED';
            }, $data);
        }

        $observed = array_count_values($data);
        
        if (count($data) < 5 || count($observed) < 2) {
            return response()->json(['error' => 'Insufficient data or categories for Chi-Square GoF.'], 400);
        }

        $stats = StatisticsService::chiSquareGOF($observed, $config['expected_ratios'] ?? []);

        return response()->json([
            'success' => true,
            'title' => 'Chi-Square Goodness of Fit',
            'variable_name' => $config['var1FieldLabel'],
            'statistics' => [
                'N (Total)' => count($data),
                'Chi-Square Value' => round($stats['chi_square'], 4),
                'Degrees of Freedom' => $stats['df'],
                'P-Value' => round($stats['p_value'], 4),
                'Expected Distribution' => !empty($config['expected_ratios']) ? 'Custom Proportions' : 'Equal Split (Uniform)',
                'Conclusion' => $stats['is_significant'] ? "Significant Deviation from Target" : "Fits Target Distribution"
            ],
            'chart_type' => 'chi_sq_gof',
            'raw_data' => $observed,
            'filters' => $filtersPayload // 🧠 ADDED
        ]);
    }

    // ==========================================
    // DATA EXTRACTION HELPER
    // ==========================================

    private function extractMetricData($students, $field, $subField, $period = null)
    {
        $batchIds = $students->pluck('batch_id')->toArray();
        $studentNumbers = $students->pluck('student_number')->toArray();
        $batchToStudent = $students->pluck('student_number', 'batch_id')->toArray();
        
        $records = [];

        // 🧠 Data Sanitizer for Categorical "Blanks"
        $sanitizeCategory = function($rawArray) {
            $cleaned = [];
            foreach ($rawArray as $k => $v) {
                $val = trim((string)($v ?? ''));
                $cleaned[$k] = (empty($val) || strtoupper($val) === 'N/A' || strtoupper($val) === 'NULL') ? 'None' : $val;
            }
            return $cleaned;
        };

        switch ($field) {
            case 'Gender':
                $raw = DB::table('student_info')
                    ->whereIn('student_number', $studentNumbers)
                    ->where('is_active', 1)
                    ->pluck('student_sex', 'student_number')->toArray();
                foreach ($raw as $k => $v) {
                    $val = trim((string)($v ?? ''));
                    $records[$k] = (empty($val) || strtoupper($val) === 'N/A') ? 'Unspecified' : $val;
                }
                break;

            case 'Age':
                $records = DB::table('student_info')
                    ->whereIn('student_number', $studentNumbers)
                    ->where('is_active', 1)
                    ->selectRaw('student_number, TIMESTAMPDIFF(YEAR, student_birthdate, CURDATE()) as age')
                    ->pluck('age', 'student_number')->toArray();
                break;

            case 'Socioeconomic':
                $raw = DB::table('student_info')
                    ->whereIn('student_number', $studentNumbers)
                    ->where('is_active', 1)
                    ->pluck('student_socioeconomic', 'student_number')->toArray();
                $records = $sanitizeCategory($raw);
                break;

            case 'WorkStatus':
                $raw = DB::table('student_info')
                    ->whereIn('student_number', $studentNumbers)
                    ->where('is_active', 1)
                    ->pluck('student_work', 'student_number')->toArray();
                $records = $sanitizeCategory($raw);
                break;

            case 'LivingArrangement':
                $raw = DB::table('student_info')
                    ->leftJoin('living_arrangements', 'student_info.student_living', '=', 'living_arrangements.id')
                    ->whereIn('student_info.student_number', $studentNumbers)
                    ->where('student_info.is_active', 1)
                    ->pluck('living_arrangements.name', 'student_info.student_number')->toArray();
                $records = $sanitizeCategory($raw);
                break;

            case 'Scholarship':
                $raw = DB::table('student_info')
                    ->whereIn('student_number', $studentNumbers)
                    ->where('is_active', 1)
                    ->pluck('student_scholarship', 'student_number')->toArray();
                $records = $sanitizeCategory($raw);
                break;

            case 'Language':
                $raw = DB::table('student_info')
                    ->leftJoin('languages', 'student_info.student_language', '=', 'languages.id')
                    ->whereIn('student_info.student_number', $studentNumbers)
                    ->where('student_info.is_active', 1)
                    ->pluck('languages.name', 'student_info.student_number')->toArray();
                $records = $sanitizeCategory($raw);
                break;

            case 'LastSchool':
                $raw = DB::table('student_info')
                    ->whereIn('student_number', $studentNumbers)
                    ->where('is_active', 1)
                    ->pluck('student_last_school', 'student_number')->toArray();
                $records = $sanitizeCategory($raw);
                break;

            case 'GWA':
                $query = DB::table('student_gwa')
                    ->whereIn('student_number', $studentNumbers)
                    ->where('is_active', 1);

                if ($subField !== 'overall') {
                    $parts = explode('|', $subField);
                    if (count($parts) === 2) {
                        $query->where('year_level', $parts[0])
                              ->where('semester', $parts[1]);
                    }
                }

                $records = $query->groupBy('student_number')
                    ->selectRaw('student_number, AVG(gwa) as value')
                    ->pluck('value', 'student_number')->toArray();
                break;

            case 'BoardGrades':
                $query = DB::table('student_board_subjects_grades')
                    ->whereIn('student_number', $studentNumbers)
                    ->where('is_active', 1);

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
                
                if ($period) {
                    $query->where('exam_period', $period);
                }

                $raw = $query->groupBy('batch_id')
                    ->selectRaw('batch_id, AVG(score) as value')
                    ->pluck('value', 'batch_id')->toArray();
                
                foreach($raw as $bId => $val) {
                    if(isset($batchToStudent[$bId])) $records[$batchToStudent[$bId]] = $val;
                }
                break;

            case 'ActualBoardScores':
                $query = DB::table('student_actual_board_scores')
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

                if ($subField !== 'overall') {
                    $query->where('category_id', $subField); 
                }

                $records = $query->groupBy('student_number')
                    ->selectRaw('student_number, AVG(rating) as value') 
                    ->pluck('value', 'student_number')->toArray();
                break;

            case 'SimExam':
                $query = DB::table('student_simulation_exams') 
                    ->whereIn('student_number', $studentNumbers)
                    ->where('is_active', 1);

                if ($subField !== 'overall') {
                    $query->where('simulation_id', $subField); 
                }
                
                if ($period) {
                    $query->where('exam_period', $period);
                }

                $records = $query->groupBy('student_number')
                    ->selectRaw('student_number, AVG(student_score) as value') 
                    ->pluck('value', 'student_number')->toArray();
                break;

            case 'Attendance':
                $records = DB::table('student_attendance_review') 
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

        return array_filter($records, function($val) {
            return is_numeric($val) || (is_string($val) && strlen($val) > 0);
        });
    }

    public function getCategories(Request $request)
    {
        $collegeId = $request->input('college');
        $programId = $request->input('program');
        $user = $request->user();
        if ($user->college_id && $collegeId != $user->college_id) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }
        if ($user->program_id && $programId != $user->program_id) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }
        $yearStart = $request->input('year_start') ?? $request->input('startYear');
        $yearEnd   = $request->input('year_end') ?? $request->input('endYear');
        $field     = $request->input('field');
        $subField  = $request->input('subField', 'overall');

        if (!$collegeId || !$programId || !$yearStart || !$yearEnd) {
            return response()->json(['categories' => []]);
        }

        $students = \App\Models\Student\StudentInfo::query()
            ->join('board_batch', 'student_info.student_number', '=', 'board_batch.student_number')
            ->join('programs', 'board_batch.program_id', '=', 'programs.program_id')
            ->where('programs.college_id', $collegeId)
            ->where('board_batch.program_id', $programId)
            ->whereBetween('board_batch.year', [$yearStart, $yearEnd])
            ->get();

        if ($students->isEmpty()) {
            return response()->json(['categories' => []]);
        }

        $data = $this->extractMetricData($students, $field, $subField);

        if ($field === 'Licensure') {
            $data = array_map(function($val) {
                return $val == 1.0 ? 'PASSED' : 'FAILED';
            }, $data);
        }

        $uniqueCategories = array_values(array_unique(array_filter($data, function($val) {
            return $val !== null && $val !== '';
        })));

        return response()->json(['categories' => $uniqueCategories]);
    }
}