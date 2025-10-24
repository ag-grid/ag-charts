import { _ModuleSupport } from 'ag-charts-community';
import type { ScaleType } from 'ag-charts-core';

const {
    AGGREGATION_INDEX_Y_MAX,
    AGGREGATION_INDEX_Y_MIN,
    aggregationDomain,
    aggregationIndexForXRatio,
    aggregationRangeFittingPoints,
    aggregationXRatioForXValue,
    compactAggregationIndices,
    createAggregationIndices,
} = _ModuleSupport;

const AGGREGATION_THRESHOLD = 1e3;

export interface RangeAreaSeriesDataAggregationFilter {
    maxRange: number;
    topIndices: number[];
    bottomIndices: number[];
}

function aggregationContainsTopIndex(
    xValues: any[],
    d0: number,
    d1: number,
    indexData: Int32Array,
    maxRange: number,
    datumIndex: number,
    xNeedsValueOf: boolean
) {
    const xValue = xValues[datumIndex];
    if (xValue == null) return false;

    const xRatio = aggregationXRatioForXValue(xValue, d0, d1, xNeedsValueOf);
    const aggIndex = aggregationIndexForXRatio(xRatio, maxRange);

    return datumIndex === indexData[aggIndex + AGGREGATION_INDEX_Y_MAX];
}

function aggregationContainsBottomIndex(
    xValues: any[],
    d0: number,
    d1: number,
    indexData: Int32Array,
    maxRange: number,
    datumIndex: number,
    xNeedsValueOf: boolean
) {
    const xValue = xValues[datumIndex];
    if (xValue == null) return false;

    const xRatio = aggregationXRatioForXValue(xValue, d0, d1, xNeedsValueOf);
    const aggIndex = aggregationIndexForXRatio(xRatio, maxRange);

    return datumIndex === indexData[aggIndex + AGGREGATION_INDEX_Y_MIN];
}

export function aggregateRangeAreaData(
    scale: ScaleType,
    xValues: any[],
    highValues: any[],
    lowValues: any[],
    domain: number[],
    xNeedsValueOf: boolean,
    yNeedsValueOf: boolean
): RangeAreaSeriesDataAggregationFilter[] | undefined {
    if (xValues.length < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = aggregationDomain(scale, domain);

    let maxRange = aggregationRangeFittingPoints(xValues, d0, d1, { xNeedsValueOf });
    const { indexData, valueData } = createAggregationIndices(xValues, highValues, lowValues, d0, d1, maxRange, {
        xNeedsValueOf,
        yNeedsValueOf,
    });

    let topIndices: number[] = [];
    let bottomIndices: number[] = [];
    for (let datumIndex = 0; datumIndex < xValues.length; datumIndex += 1) {
        if (aggregationContainsTopIndex(xValues, d0, d1, indexData, maxRange, datumIndex, xNeedsValueOf)) {
            topIndices.push(datumIndex);
        }
        if (aggregationContainsBottomIndex(xValues, d0, d1, indexData, maxRange, datumIndex, xNeedsValueOf)) {
            bottomIndices.push(datumIndex);
        }
    }

    const filters: RangeAreaSeriesDataAggregationFilter[] = [{ maxRange, topIndices, bottomIndices }];

    while (maxRange > 64) {
        ({ maxRange } = compactAggregationIndices(indexData, valueData, maxRange, { inPlace: true }));
        topIndices = topIndices.filter((datumIndex) =>
            aggregationContainsTopIndex(xValues, d0, d1, indexData, maxRange, datumIndex, xNeedsValueOf)
        );
        bottomIndices = bottomIndices.filter((datumIndex) =>
            aggregationContainsBottomIndex(xValues, d0, d1, indexData, maxRange, datumIndex, xNeedsValueOf)
        );

        filters.push({ maxRange, topIndices, bottomIndices });
    }

    filters.reverse();

    return filters;
}
