/**
 * Statistical utilities for Box Plot series - pure functions for statistical validation and calculations.
 * These utilities can be reused across different statistical chart types.
 */

export interface BoxPlotStatisticalData {
    readonly min: number;
    readonly q1: number;
    readonly median: number;
    readonly q3: number;
    readonly max: number;
}

export interface ValidationResult {
    readonly isValid: boolean;
    readonly errors: string[];
}

/**
 * Validates that box plot statistical values follow the correct ordering:
 * min ≤ q1 ≤ median ≤ q3 ≤ max
 */
export function validateBoxPlotData(data: Partial<BoxPlotStatisticalData>): ValidationResult {
    const { min, q1, median, q3, max } = data;
    const errors: string[] = [];

    // Check for null/undefined values and NaN/Infinity
    if ([min, q1, median, q3, max].some((value) => !Number.isFinite(value))) {
        errors.push('All statistical values must be finite numbers');
        return { isValid: false, errors };
    }

    // Type assertion is safe because we've checked above
    const values = { min: min!, q1: q1!, median: median!, q3: q3!, max: max! };

    // Validate ordering constraints
    if (values.min > values.q1) {
        errors.push('Minimum value cannot be greater than Q1');
    }
    if (values.q1 > values.median) {
        errors.push('Q1 cannot be greater than median');
    }
    if (values.median > values.q3) {
        errors.push('Median cannot be greater than Q3');
    }
    if (values.q3 > values.max) {
        errors.push('Q3 cannot be greater than maximum value');
    }

    return { isValid: errors.length === 0, errors };
}

/**
 * Computes the interquartile range (IQR) for box plot data
 */
export function computeInterquartileRange(data: Pick<BoxPlotStatisticalData, 'q1' | 'q3'>): number {
    return data.q3 - data.q1;
}

/**
 * Detects statistical outliers using the standard 1.5 * IQR method
 */
export function detectOutliers(
    data: BoxPlotStatisticalData,
    dataPoints: number[]
): { mild: number[]; extreme: number[] } {
    const iqr = computeInterquartileRange(data);
    const lowerFence = data.q1 - 1.5 * iqr;
    const upperFence = data.q3 + 1.5 * iqr;
    const lowerOuterFence = data.q1 - 3 * iqr;
    const upperOuterFence = data.q3 + 3 * iqr;

    const mild: number[] = [];
    const extreme: number[] = [];

    dataPoints.forEach((point) => {
        if (point < lowerOuterFence || point > upperOuterFence) {
            extreme.push(point);
        } else if (point < lowerFence || point > upperFence) {
            mild.push(point);
        }
    });

    return { mild, extreme };
}

/**
 * Computes whisker positions based on box plot data and actual data points
 * Returns the whisker endpoints that don't extend beyond 1.5 * IQR
 */
export function computeWhiskerPositions(
    data: BoxPlotStatisticalData,
    dataPoints?: number[]
): { lowerWhisker: number; upperWhisker: number } {
    // If no data points provided, use min/max as whiskers
    if (!dataPoints || dataPoints.length === 0) {
        return { lowerWhisker: data.min, upperWhisker: data.max };
    }

    const iqr = computeInterquartileRange(data);
    const lowerFence = data.q1 - 1.5 * iqr;
    const upperFence = data.q3 + 1.5 * iqr;

    // Find the furthest points that are still within the fences
    const validLowerPoints = dataPoints.filter((point) => point >= lowerFence && point <= data.q1);
    const validUpperPoints = dataPoints.filter((point) => point >= data.q3 && point <= upperFence);

    const lowerWhisker = validLowerPoints.length > 0 ? Math.min(...validLowerPoints) : data.q1;
    const upperWhisker = validUpperPoints.length > 0 ? Math.max(...validUpperPoints) : data.q3;

    return { lowerWhisker, upperWhisker };
}

/**
 * Calculates summary statistics from raw data points
 * This could be used to generate box plot data from raw datasets
 */
export function calculateBoxPlotStatistics(dataPoints: number[]): BoxPlotStatisticalData | null {
    if (dataPoints.length === 0) {
        return null;
    }

    const sorted = [...dataPoints].sort((a, b) => a - b);
    const n = sorted.length;

    const min = sorted[0];
    const max = sorted[n - 1];

    const median = calculatePercentile(sorted, 0.5);
    const q1 = calculatePercentile(sorted, 0.25);
    const q3 = calculatePercentile(sorted, 0.75);

    return { min, q1, median, q3, max };
}

/**
 * Helper function to calculate percentiles from sorted data
 */
function calculatePercentile(sortedData: number[], percentile: number): number {
    const n = sortedData.length;
    const index = percentile * (n - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= n) return sortedData[n - 1];
    if (lower < 0) return sortedData[0];

    return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
}
