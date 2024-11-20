import {
    aggregationDomain,
    compactAggregationIndices,
    createAggregationIndices,
    maxRangeFittingPoints,
} from '../../utils/aggregation';

const AGGREGATION_THRESHOLD = 1e3;
const PRECISION = 5;

export interface RangeBarSeriesDataAggregationFilter {
    indexData: Int32Array;
    maxRange: number;
}

export function aggregateRangeBarData(
    xValues: any[],
    highValues: any[],
    lowValues: any[],
    domain: number[]
): RangeBarSeriesDataAggregationFilter[] | undefined {
    if (xValues.length < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = aggregationDomain(domain);

    let maxRange = maxRangeFittingPoints(xValues, PRECISION);
    let { indexData, valueData } = createAggregationIndices(xValues, highValues, lowValues, d0, d1, maxRange);

    const filters: RangeBarSeriesDataAggregationFilter[] = [{ maxRange, indexData }];

    while (maxRange > 64) {
        ({ indexData, valueData, maxRange } = compactAggregationIndices(indexData, valueData, maxRange));

        filters.push({ maxRange, indexData });
    }

    filters.reverse();

    return filters;
}
