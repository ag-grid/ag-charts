import type { ScaleType } from 'ag-charts-core';

import {
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_X_MIN,
    AGGREGATION_SPAN,
    aggregationDomain,
    aggregationRangeFittingPoints,
    compactAggregationIndices,
    createAggregationIndices,
} from '../aggregation';

const AGGREGATION_THRESHOLD = 1e3;

export interface BarSeriesDataAggregationFilter {
    maxRange: number;
    positiveIndices: number[];
    positiveIndexData: Int32Array;
    negativeIndices: number[];
    negativeIndexData: Int32Array;
}

function getIndices(maxRange: number, indexData: Int32Array): number[] {
    return Array.from({ length: maxRange }, (_, index) => {
        const aggIndex = index * AGGREGATION_SPAN;
        const xMinIndex = indexData[aggIndex + AGGREGATION_INDEX_X_MIN];
        const xMaxIndex = indexData[aggIndex + AGGREGATION_INDEX_X_MAX];
        return Math.trunc((xMinIndex + xMaxIndex) / 2);
    });
}

export function aggregateBarData(
    scale: ScaleType,
    xValues: any[],
    yStartValues: any[] | undefined,
    yEndValues: any[],
    domain: number[],
    smallestKeyInterval: number | undefined
): BarSeriesDataAggregationFilter[] | undefined {
    if (xValues.length < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = aggregationDomain(scale, domain);

    let maxRange = aggregationRangeFittingPoints(xValues, d0, d1, { smallestKeyInterval });

    let { indexData: positiveIndexData, valueData: positiveValueData } = createAggregationIndices(
        xValues,
        yEndValues,
        yStartValues ?? yEndValues,
        d0,
        d1,
        maxRange,
        { positive: true }
    );
    let { indexData: negativeIndexData, valueData: negativeValueData } = createAggregationIndices(
        xValues,
        yEndValues,
        yStartValues ?? yEndValues,
        d0,
        d1,
        maxRange,
        { positive: false }
    );

    let positiveIndices = getIndices(maxRange, positiveIndexData);
    let negativeIndices = getIndices(maxRange, negativeIndexData);

    const filters: BarSeriesDataAggregationFilter[] = [
        { maxRange, positiveIndices, positiveIndexData, negativeIndices, negativeIndexData },
    ];

    while (maxRange > 64) {
        ({ indexData: positiveIndexData, valueData: positiveValueData } = compactAggregationIndices(
            positiveIndexData,
            positiveValueData,
            maxRange
        ));
        ({
            indexData: negativeIndexData,
            valueData: negativeValueData,
            maxRange,
        } = compactAggregationIndices(negativeIndexData, negativeValueData, maxRange));

        positiveIndices = getIndices(maxRange, positiveIndexData);
        negativeIndices = getIndices(maxRange, negativeIndexData);

        filters.push({ maxRange, positiveIndices, positiveIndexData, negativeIndices, negativeIndexData });
    }

    filters.reverse();

    return filters;
}
