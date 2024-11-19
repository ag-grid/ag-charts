import { _ModuleSupport } from 'ag-charts-community';

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

const indexes: _ModuleSupport.BarSeriesAggregationIndexes = {
    xMin: X_MIN,
    xMax: X_MAX,
    yMin: Y_MIN,
    yMax: Y_MAX,
    span: SPAN,
};

const AGGREGATION_THRESHOLD = 1e3;
const MAX_POINTS = 5;

export function aggregateData(
    xValues: any[],
    yValues: any[],
    domain: number[]
): _ModuleSupport.BarSeriesDataAggregationFilter[] | undefined {
    if (xValues.length < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = aggregationDomain(domain);

    let maxRange = (2 ** Math.ceil(Math.log2(xValues.length / MAX_POINTS))) | 0;
    let { indexData, valueData } = createAggregationIndices(xValues, yValues, yValues, d0, d1, maxRange);

    const filters: _ModuleSupport.BarSeriesDataAggregationFilter[] = [{ maxRange, indexData, indexes }];

    while (maxRange > MAX_POINTS && maxRange > 64) {
        ({ indexData, valueData, maxRange } = compactAggregationIndices(indexData, valueData, maxRange));

        filters.push({ maxRange, indexData, indexes });
    }

    filters.reverse();

    return filters;
}
