import type { _ModuleSupport } from 'ag-charts-community';

import {
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_X_MIN,
    AGGREGATION_INDEX_Y_MAX,
    AGGREGATION_INDEX_Y_MIN,
    aggregationDomain,
    aggregationIndexForXRatio,
    aggregationRangeFittingPoints,
    aggregationXRatioForDatumIndex,
    aggregationXRatioForXValue,
    compactAggregationIndices,
    createAggregationIndices,
} from '../aggregation';

const AGGREGATION_THRESHOLD = 1e3;
const MAX_POINTS = 10;

function aggregationContainsIndex(
    xValues: any[],
    d0: number,
    d1: number,
    indexData: Int32Array,
    maxRange: number,
    datumIndex: number
) {
    const xValue = xValues[datumIndex];
    if (xValue == null) return false;

    const xRatio = Number.isFinite(d0)
        ? aggregationXRatioForXValue(xValue, d0, d1)
        : aggregationXRatioForDatumIndex(datumIndex, xValues.length);
    const aggIndex = aggregationIndexForXRatio(xRatio, maxRange);

    return (
        datumIndex === indexData[aggIndex + AGGREGATION_INDEX_X_MIN] ||
        datumIndex === indexData[aggIndex + AGGREGATION_INDEX_X_MAX] ||
        datumIndex === indexData[aggIndex + AGGREGATION_INDEX_Y_MIN] ||
        datumIndex === indexData[aggIndex + AGGREGATION_INDEX_Y_MAX]
    );
}

export function aggregateLineData(
    scale: _ModuleSupport.Scale<unknown, number>,
    xValues: any[],
    yValues: any[],
    domain: any[]
): _ModuleSupport.LineSeriesDataAggregationFilter[] | undefined {
    if (xValues.length < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = aggregationDomain(scale, domain);

    let maxRange = aggregationRangeFittingPoints(xValues, MAX_POINTS);

    const { indexData, valueData } = createAggregationIndices(xValues, yValues, yValues, d0, d1, maxRange);

    let indices: number[] = [];
    for (let datumIndex = 0; datumIndex < xValues.length; datumIndex += 1) {
        if (aggregationContainsIndex(xValues, d0, d1, indexData, maxRange, datumIndex)) {
            indices.push(datumIndex);
        }
    }

    const filters: _ModuleSupport.LineSeriesDataAggregationFilter[] = [{ maxRange, indices }];

    while (indices.length > MAX_POINTS && maxRange > 64) {
        ({ maxRange } = compactAggregationIndices(indexData, valueData, maxRange, { inPlace: true }));
        indices = indices.filter(aggregationContainsIndex.bind(null, xValues, d0, d1, indexData, maxRange));

        filters.push({ maxRange, indices });
    }

    filters.reverse();

    return filters;
}
