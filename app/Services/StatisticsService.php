<?php

namespace App\Services;

use MathPHP\Statistics\Average;
use MathPHP\Statistics\Descriptive;
use MathPHP\Statistics\Correlation;
use MathPHP\Statistics\Regression\Linear;
use MathPHP\Probability\Distribution\Continuous\StudentT;
use MathPHP\Probability\Distribution\Continuous\ChiSquared;

class StatisticsService
{
    // 1. DESCRIPTIVE STATISTICS
    public static function descriptive(array $data)
    {
        if (empty($data)) throw new \Exception("Data set is empty. Check your filters.");

        return [
            'Count' => count($data),
            'Mean' => round(Average::mean($data), 4),
            'Median' => round(Average::median($data), 4),
            'Minimum' => min($data),
            'Maximum' => max($data),
            'Std. Deviation' => round(Descriptive::standardDeviation($data), 4),
            'Variance' => round(Descriptive::sampleVariance($data), 4),
        ];
    }

    // 2. PEARSON R CORRELATION
    public static function pearsonR(array $x, array $y)
    {
        $n = count($x);
        if ($n !== count($y) || $n < 3) throw new \Exception("Pearson R requires matched arrays of at least 3 students.");

        $r = Correlation::r($x, $y);
        
        // Exact P-Value Calculation using Student T Distribution
        $df = $n - 2;
        $tScore = $r * sqrt($df / (1 - pow($r, 2)));
        
        $studentT = new StudentT($df);
        $pValue = 2 * (1 - $studentT->cdf(abs($tScore)));

        return [
            'R-Value' => round($r, 4),
            'Degrees of Freedom' => $df,
            'P-Value' => round($pValue, 4),
            'Significance' => $pValue < 0.05 ? 'Statistically Significant' : 'Not Significant'
        ];
    }

    // 3. REGRESSION ANALYSIS
    public static function regression(array $x, array $y)
    {
        if (count($x) !== count($y) || count($x) < 3) {
            throw new \Exception("Regression requires matched arrays of at least 3 students.");
        }

        // 🧠 FIXED: MathPHP Linear Regression requires an array of [x, y] coordinates
        $points = [];
        for ($i = 0; $i < count($x); $i++) {
            $points[] = [$x[$i], $y[$i]];
        }

        $regression = new Linear($points);
        $parameters = $regression->getParameters(); // Fetch parameters array safely!
        $r = Correlation::r($x, $y);

        return [
            'Slope (m)' => round($parameters['m'], 4),
            'Intercept (b)' => round($parameters['b'], 4),
            'R-Squared' => round(pow($r, 2), 4),
            'Equation' => $regression->getEquation(),
            'minX' => min($x),
            'maxX' => max($x)
        ];
    }

    // 4. INDEPENDENT T-TEST (Welch's for Unequal Variances)
    public static function independentTTest(array $group1, array $group2)
    {
        $n1 = count($group1);
        $n2 = count($group2);

        if ($n1 < 2 || $n2 < 2) throw new \Exception("Independent T-Test requires at least 2 records per group.");

        $mean1 = Average::mean($group1);
        $mean2 = Average::mean($group2);
        $var1 = Descriptive::sampleVariance($group1);
        $var2 = Descriptive::sampleVariance($group2);

        if ($var1 == 0 && $var2 == 0) throw new \Exception("Both groups have zero variance.");

        $tScore = ($mean1 - $mean2) / sqrt(($var1 / $n1) + ($var2 / $n2));
        
        $dfNum = pow(($var1 / $n1) + ($var2 / $n2), 2);
        $dfDen = (pow($var1 / $n1, 2) / ($n1 - 1)) + (pow($var2 / $n2, 2) / ($n2 - 1));
        $df = $dfDen != 0 ? $dfNum / $dfDen : 1;

        $studentT = new StudentT($df);
        $pValue = 2 * (1 - $studentT->cdf(abs($tScore)));

        return [
            't_score' => $tScore,
            'df' => $df,
            'p_value' => $pValue,
            'mean1' => $mean1,
            'mean2' => $mean2,
            'count1' => $n1,
            'count2' => $n2,
            'is_significant' => $pValue < 0.05
        ];
    }

    // 5. DEPENDENT (PAIRED) T-TEST
    public static function dependentTTest(array $paired1, array $paired2)
    {
        $n = count($paired1);
        if ($n < 2 || count($paired2) !== $n) throw new \Exception("Dependent T-Test requires perfectly paired data.");

        $diffs = [];
        for ($i = 0; $i < $n; $i++) {
            $diffs[] = $paired2[$i] - $paired1[$i];
        }

        $meanDiff = Average::mean($diffs);
        $varDiff = Descriptive::sampleVariance($diffs);

        if ($varDiff == 0) throw new \Exception("Variance of differences is zero.");

        $tScore = $meanDiff / sqrt($varDiff / $n);
        $df = $n - 1;

        $studentT = new StudentT($df);
        $pValue = 2 * (1 - $studentT->cdf(abs($tScore)));

        return [
            't_score' => $tScore,
            'df' => $df,
            'p_value' => $pValue,
            'mean1' => Average::mean($paired1),
            'mean2' => Average::mean($paired2),
            'paired_count' => $n,
            'is_significant' => $pValue < 0.05
        ];
    }

    // 6. CHI-SQUARE (GOODNESS OF FIT)
    public static function chiSquareGOF(array $observed, array $expectedRatios)
    {
        $totalObserved = array_sum($observed);
        if ($totalObserved == 0) throw new \Exception("No observed data to test.");

        $chiSquare = 0;
        foreach ($expectedRatios as $category => $percent) {
            $exp = $totalObserved * ($percent / 100);
            if ($exp == 0) throw new \Exception("Expected ratio cannot be zero.");
            
            $obs = $observed[$category] ?? 0;
            $chiSquare += pow($obs - $exp, 2) / $exp;
        }

        $df = count($expectedRatios) - 1;
        if ($df < 1) throw new \Exception("Chi-Square GOF requires at least 2 categories.");

        $dist = new ChiSquared($df);
        $pValue = 1 - $dist->cdf($chiSquare);

        return [
            'chi_square' => $chiSquare,
            'df' => $df,
            'p_value' => $pValue,
            'is_significant' => $pValue < 0.05
        ];
    }

    // 7. CHI-SQUARE (TEST OF INDEPENDENCE)
    public static function chiSquareTOI(array $matrix)
    {
        $rowTotals = [];
        $colTotals = [];
        $grandTotal = 0;

        foreach ($matrix as $row => $cols) {
            foreach ($cols as $col => $value) {
                $rowTotals[$row] = ($rowTotals[$row] ?? 0) + $value;
                $colTotals[$col] = ($colTotals[$col] ?? 0) + $value;
                $grandTotal += $value;
            }
        }

        if ($grandTotal == 0) throw new \Exception("No observed data to test.");

        $chiSquare = 0;
        foreach ($matrix as $row => $cols) {
            foreach ($cols as $col => $obs) {
                $exp = ($rowTotals[$row] * $colTotals[$col]) / $grandTotal;
                if ($exp == 0) throw new \Exception("Expected frequency is zero; test cannot be run.");
                $chiSquare += pow($obs - $exp, 2) / $exp;
            }
        }

        $df = (count($rowTotals) - 1) * (count($colTotals) - 1);
        if ($df < 1) throw new \Exception("Matrix must be at least 2x2.");

        $dist = new ChiSquared($df);
        $pValue = 1 - $dist->cdf($chiSquare);

        return [
            'chi_square' => $chiSquare,
            'df' => $df,
            'p_value' => $pValue,
            'is_significant' => $pValue < 0.05
        ];
    }
}