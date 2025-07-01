import type { _ModuleSupport } from 'ag-charts-community';

import {
    SPAN,
    X_MAX,
    X_MIN,
    Y_MAX,
    Y_MIN,
    aggregationDomain,
    compactAggregationIndices,
    createAggregationIndices,
    maxRangeFittingPoints,
} from '../../utils/aggregation';

const indexes: _ModuleSupport.BarSeriesAggregationIndexes = {
    xMin: X_MIN,
    xMax: X_MAX,
    yMin: Y_MIN,
    yMax: Y_MAX,
    span: SPAN,
};

const AGGREGATION_THRESHOLD = 1e2;
const PRECISION = 1;

function getIndices(maxRange: number, indexData: Int32Array): number[] {
    return Array.from({ length: maxRange }, (_, index) => {
        const aggIndex = index * SPAN;
        const xMinIndex = indexData[aggIndex + X_MIN];
        const xMaxIndex = indexData[aggIndex + X_MAX];
        return ((xMinIndex + xMaxIndex) / 2) | 0;
    });
}

export function aggregateBarData(
    scale: _ModuleSupport.Scale<unknown, number>,
    xValues: any[],
    yValues: any[],
    domain: number[]
): _ModuleSupport.BarSeriesDataAggregationFilter[] | undefined {
    if (xValues.length < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = aggregationDomain(scale, domain);

    let maxRange = maxRangeFittingPoints(xValues, PRECISION);
    let { indexData, valueData } = createAggregationIndices(xValues, yValues, yValues, d0, d1, maxRange);
    let indices = getIndices(maxRange, indexData);

    const filters: _ModuleSupport.BarSeriesDataAggregationFilter[] = [{ maxRange, indexData, indices, indexes }];

    while (maxRange > 64) {
        ({ indexData, valueData, maxRange } = compactAggregationIndices(indexData, valueData, maxRange));
        indices = getIndices(maxRange, indexData);

        filters.push({ maxRange, indexData, indices, indexes });
    }

    filters.reverse();

    return filters;
}
