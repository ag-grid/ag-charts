import {
    Y_MAX,
    Y_MIN,
    aggregationDomain,
    aggregationIndexForXRatio,
    compactAggregationIndices,
    createAggregationIndices,
    xRatioForDatumIndex,
} from '../../utils/aggregation';

const AGGREGATION_THRESHOLD = 1e3;
const MAX_POINTS = 10;

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

    const xRatio = xRatioForDatumIndex(xValue, d0, d1);
    const aggIndex = aggregationIndexForXRatio(xRatio, maxRange);

    return datumIndex === indexData[aggIndex + Y_MAX];
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

    const xRatio = xRatioForDatumIndex(xValue, d0, d1);
    const aggIndex = aggregationIndexForXRatio(xRatio, maxRange);

    return datumIndex === indexData[aggIndex + Y_MIN];
}

export function aggregateData(
    xValues: any[],
    highValues: any[],
    lowValues: any[],
    domain: number[]
): RangeAreaSeriesDataAggregationFilter[] | undefined {
    if (xValues.length < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = aggregationDomain(domain);

    let maxRange = (2 ** Math.ceil(Math.log2(xValues.length / MAX_POINTS))) | 0;
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

    while (topIndices.length > MAX_POINTS && maxRange > 64) {
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
