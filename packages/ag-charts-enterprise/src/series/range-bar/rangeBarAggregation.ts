import { _ModuleSupport } from 'ag-charts-community';
import type { ScaleType } from 'ag-charts-core';

const { aggregationDomain, aggregationRangeFittingPoints, compactAggregationIndices, createAggregationIndices } =
    _ModuleSupport;

const AGGREGATION_THRESHOLD = 1e3;

export interface RangeBarSeriesDataAggregationFilter {
    indexData: Int32Array;
    maxRange: number;
}

export function aggregateRangeBarData(
    scale: ScaleType,
    xValues: any[],
    highValues: any[],
    lowValues: any[],
    domain: number[],
    smallestKeyInterval: number | undefined
): RangeBarSeriesDataAggregationFilter[] | undefined {
    if (xValues.length < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = aggregationDomain(scale, domain);

    let maxRange = aggregationRangeFittingPoints(xValues, d0, d1, { smallestKeyInterval });
    let { indexData, valueData } = createAggregationIndices(xValues, highValues, lowValues, d0, d1, maxRange);

    const filters: RangeBarSeriesDataAggregationFilter[] = [{ maxRange, indexData }];

    while (maxRange > 64) {
        ({ indexData, valueData, maxRange } = compactAggregationIndices(indexData, valueData, maxRange));

        filters.push({ maxRange, indexData });
    }

    filters.reverse();

    return filters;
}
