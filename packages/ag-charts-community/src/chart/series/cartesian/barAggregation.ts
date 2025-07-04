import type { Scale } from '../../../scale/scale';
import {
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_X_MIN,
    AGGREGATION_INDEX_Y_MAX,
    AGGREGATION_INDEX_Y_MIN,
    AGGREGATION_SPAN,
    aggregationDomain,
    aggregationRangeFittingPoints,
    compactAggregationIndices,
    createAggregationIndices,
} from '../aggregation';

export interface BarSeriesDataAggregationFilter {
    maxRange: number;
    indexData: Int32Array;
    indices: number[];
}

export const BAR_X_MIN = AGGREGATION_INDEX_X_MIN;
export const BAR_X_MAX = AGGREGATION_INDEX_X_MAX;
export const BAR_Y_MIN = AGGREGATION_INDEX_Y_MIN;
export const BAR_Y_MAX = AGGREGATION_INDEX_Y_MAX;
export const BAR_SPAN = AGGREGATION_SPAN;

const AGGREGATION_THRESHOLD = 1e3;
const PRECISION = 5;

function getIndices(maxRange: number, indexData: Int32Array): number[] {
    return Array.from({ length: maxRange }, (_, index) => {
        const aggIndex = index * AGGREGATION_SPAN;
        const xMinIndex = indexData[aggIndex + AGGREGATION_INDEX_X_MIN];
        const xMaxIndex = indexData[aggIndex + AGGREGATION_INDEX_X_MAX];
        return ((xMinIndex + xMaxIndex) / 2) | 0;
    });
}

export function aggregateBarData(
    scale: Scale<unknown, number>,
    xValues: any[],
    yValues: any[],
    domain: number[]
): BarSeriesDataAggregationFilter[] | undefined {
    if (xValues.length < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = aggregationDomain(scale, domain);

    let maxRange = aggregationRangeFittingPoints(xValues, PRECISION);
    let { indexData, valueData } = createAggregationIndices(xValues, yValues, yValues, d0, d1, maxRange);
    let indices = getIndices(maxRange, indexData);

    const filters: BarSeriesDataAggregationFilter[] = [{ maxRange, indexData, indices }];

    while (maxRange > 64) {
        ({ indexData, valueData, maxRange } = compactAggregationIndices(indexData, valueData, maxRange));
        indices = getIndices(maxRange, indexData);

        filters.push({ maxRange, indexData, indices });
    }

    filters.reverse();

    return filters;
}
