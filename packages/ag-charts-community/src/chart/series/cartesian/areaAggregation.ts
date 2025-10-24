import type { ScaleType } from 'ag-charts-core';

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

export interface AreaSeriesDataAggregationFilter {
    metaIndices: number[];
    indices: number[];
    maxRange: number;
}

function aggregationIndexType(
    xValues: any[],
    d0: number,
    d1: number,
    indexData: Int32Array,
    maxRange: number,
    datumIndex: number,
    xNeedsValueOf: boolean
): number {
    const xValue = xValues[datumIndex];
    if (xValue == null) return -1;

    const xRatio = Number.isFinite(d0)
        ? aggregationXRatioForXValue(xValue, d0, d1, xNeedsValueOf)
        : aggregationXRatioForDatumIndex(datumIndex, xValues.length);
    const aggIndex = aggregationIndexForXRatio(xRatio, maxRange);

    if (
        datumIndex === indexData[aggIndex + AGGREGATION_INDEX_X_MIN] ||
        datumIndex === indexData[aggIndex + AGGREGATION_INDEX_X_MAX] ||
        datumIndex === indexData[aggIndex + AGGREGATION_INDEX_Y_MIN] ||
        datumIndex === indexData[aggIndex + AGGREGATION_INDEX_Y_MAX]
    ) {
        return aggIndex;
    }

    return -1;
}

export function aggregateAreaData(
    scale: ScaleType,
    xValues: any[],
    yValues: any[],
    domain: any[],
    xNeedsValueOf: boolean,
    yNeedsValueOf: boolean
): AreaSeriesDataAggregationFilter[] | undefined {
    if (xValues.length < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = aggregationDomain(scale, domain);

    let maxRange = aggregationRangeFittingPoints(xValues, d0, d1, { xNeedsValueOf });

    const { indexData, valueData } = createAggregationIndices(xValues, yValues, yValues, d0, d1, maxRange, {
        xNeedsValueOf,
        yNeedsValueOf,
    });

    let metaIndices: number[] = [];
    let indices: number[] = [];
    let currentGroup = -1;
    for (let datumIndex = 0; datumIndex < xValues.length; datumIndex += 1) {
        const group = aggregationIndexType(xValues, d0, d1, indexData, maxRange, datumIndex, xNeedsValueOf);
        if (group === -1) continue;

        const newGroupIndex = indices.push(datumIndex) - 1;
        if (group !== currentGroup) {
            metaIndices.push(newGroupIndex);
            currentGroup = group;
        }
    }
    metaIndices.push(indices.length - 1);

    const filters: AreaSeriesDataAggregationFilter[] = [{ maxRange, metaIndices, indices }];

    while (indices.length > MAX_POINTS && maxRange > 64) {
        ({ maxRange } = compactAggregationIndices(indexData, valueData, maxRange, { inPlace: true }));

        const previousIndices = indices;

        metaIndices = [];
        indices = [];
        currentGroup = -1;
        for (const datumIndex of previousIndices) {
            const group = aggregationIndexType(xValues, d0, d1, indexData, maxRange, datumIndex, xNeedsValueOf);
            if (group === -1) continue;

            const newGroupIndex = indices.push(datumIndex) - 1;
            if (group !== currentGroup) {
                metaIndices.push(newGroupIndex);
                currentGroup = group;
            }
        }
        metaIndices.push(indices.length - 1);

        filters.push({ maxRange, metaIndices, indices });
    }

    filters.reverse();

    return filters;
}
