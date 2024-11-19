import {
    SPAN,
    X_MAX,
    X_MIN,
    Y_MAX,
    Y_MIN,
    aggregationDomain,
    compactAggregationIndices,
    createAggregationIndices,
} from '../../utils/aggregation';

const AGGREGATION_THRESHOLD = 1e3;
const MAX_POINTS = 10;

export const OPEN = X_MIN;
export const HIGH = Y_MAX;
export const LOW = Y_MIN;
export const CLOSE = X_MAX;
export { SPAN };

export interface OhlcSeriesDataAggregationFilter {
    indexData: Int32Array;
    maxRange: number;
}

export function aggregateData(
    xValues: any[],
    highValues: any[],
    lowValues: any[],
    domain: number[]
): OhlcSeriesDataAggregationFilter[] | undefined {
    if (xValues.length < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = aggregationDomain(domain);

    let maxRange = (2 ** Math.ceil(Math.log2(xValues.length / MAX_POINTS))) | 0;
    let { indexData, valueData } = createAggregationIndices(xValues, highValues, lowValues, d0, d1, maxRange);

    const filters: OhlcSeriesDataAggregationFilter[] = [{ maxRange, indexData }];

    while (maxRange > MAX_POINTS && maxRange > 64) {
        ({ indexData, valueData, maxRange } = compactAggregationIndices(indexData, valueData, maxRange));

        filters.push({ maxRange, indexData });
    }

    filters.reverse();

    return filters;
}
