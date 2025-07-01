import { _ModuleSupport } from 'ag-charts-community';

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
    datumIndex: number
) {
    const xValue = xValues[datumIndex];
    if (xValue == null) return false;

    const xRatio = aggregationXRatioForXValue(xValue, d0, d1);
    const aggIndex = aggregationIndexForXRatio(xRatio, maxRange);

    return datumIndex === indexData[aggIndex + AGGREGATION_INDEX_Y_MAX];
}

function aggregationContainsBottomIndex(
    xValues: any[],
    d0: number,
    d1: number,
    indexData: Int32Array,
    maxRange: number,
    datumIndex: number
) {
    const xValue = xValues[datumIndex];
    if (xValue == null) return false;

    const xRatio = aggregationXRatioForXValue(xValue, d0, d1);
    const aggIndex = aggregationIndexForXRatio(xRatio, maxRange);

    return datumIndex === indexData[aggIndex + AGGREGATION_INDEX_Y_MIN];
}

export function aggregateData(
    scale: _ModuleSupport.Scale<unknown, number>,
    xValues: any[],
    highValues: any[],
    lowValues: any[],
    domain: number[]
): RangeAreaSeriesDataAggregationFilter[] | undefined {
    if (xValues.length < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = aggregationDomain(scale, domain);

    let maxRange = aggregationRangeFittingPoints(xValues);
    const { indexData, valueData } = createAggregationIndices(xValues, highValues, lowValues, d0, d1, maxRange);

    let topIndices: number[] = [];
    let bottomIndices: number[] = [];
    for (let datumIndex = 0; datumIndex < xValues.length; datumIndex += 1) {
        if (aggregationContainsTopIndex(xValues, d0, d1, indexData, maxRange, datumIndex)) {
            topIndices.push(datumIndex);
        }
        if (aggregationContainsBottomIndex(xValues, d0, d1, indexData, maxRange, datumIndex)) {
            bottomIndices.push(datumIndex);
        }
    }

    const filters: RangeAreaSeriesDataAggregationFilter[] = [{ maxRange, topIndices, bottomIndices }];

    while (maxRange > 64) {
        ({ maxRange } = compactAggregationIndices(indexData, valueData, maxRange, { inPlace: true }));
        topIndices = topIndices.filter(aggregationContainsTopIndex.bind(null, xValues, d0, d1, indexData, maxRange));
        bottomIndices = bottomIndices.filter(
            aggregationContainsBottomIndex.bind(null, xValues, d0, d1, indexData, maxRange)
        );

        filters.push({ maxRange, topIndices, bottomIndices });
    }

    filters.reverse();

    return filters;
}
