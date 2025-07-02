import { _ModuleSupport } from 'ag-charts-community';

const { ContinuousScale, DiscreteTimeScale } = _ModuleSupport;

export const X_MIN = 0;
export const X_MAX = 1;
export const Y_MIN = 2;
export const Y_MAX = 3;
export const SPAN = 4;

export function maxRangeFittingPoints(data: any[], precision: number = 1) {
    let power = Math.ceil(Math.log2(data.length / precision)) - 1;
    power = Math.min(Math.max(power, 0), 16);
    return (2 ** power) | 0;
}

export function aggregationDomain(scale: _ModuleSupport.Scale<unknown, number>, domain: any[]): [number, number] {
    if (!(ContinuousScale.is(scale) || DiscreteTimeScale.is(scale))) return [NaN, NaN];

    let min = Infinity;
    let max = -Infinity;
    for (const d of domain) {
        const value = Number(d);
        min = Math.min(min, value);
        max = Math.max(max, value);
    }
    return [min, max];
}

export function xRatioForDatumIndex(datumIndex: any, domainCount: number) {
    return datumIndex / domainCount;
}

export function xRatioForXValue(xValue: any, d0: number, d1: number) {
    return (xValue.valueOf() - d0) / (d1 - d0);
}

export function aggregationIndexForXRatio(xRatio: number, maxRange: number) {
    return (Math.min(Math.floor(xRatio * maxRange), maxRange - 1) * SPAN) | 0;
}

export function createAggregationIndices(
    xValues: any[],
    yMaxValues: any[],
    yMinValues: any[],
    d0: number,
    d1: number,
    maxRange: number
): {
    indexData: Int32Array;
    valueData: Float64Array;
} {
    const indexData = new Int32Array(maxRange * SPAN).fill(-1);
    const valueData = new Float64Array(maxRange * SPAN).fill(NaN);
    const continuous = Number.isFinite(d0) && Number.isFinite(d1);
    const domainCount = xValues.length;

    for (let datumIndex = 0; datumIndex < xValues.length; datumIndex += 1) {
        const xValue = xValues[datumIndex];
        const yMaxValue = yMaxValues[datumIndex];
        const yMinValue = yMinValues[datumIndex];
        if (xValue == null || yMaxValue == null || yMinValue == null) continue;

        const xRatio = continuous ? xRatioForXValue(xValue, d0, d1) : xRatioForDatumIndex(datumIndex, domainCount);
        const yMax: number = yMaxValue.valueOf();
        const yMin: number = yMinValue.valueOf();
        const aggIndex = aggregationIndexForXRatio(xRatio, maxRange);

        const unset = indexData[aggIndex + X_MIN] === -1;

        if (unset || xRatio < valueData[aggIndex + X_MIN]) {
            indexData[aggIndex + X_MIN] = datumIndex;
            valueData[aggIndex + X_MIN] = xRatio;
        }
        if (unset || xRatio > valueData[aggIndex + X_MAX]) {
            indexData[aggIndex + X_MAX] = datumIndex;
            valueData[aggIndex + X_MAX] = xRatio;
        }
        if (unset || yMin < valueData[aggIndex + Y_MIN]) {
            indexData[aggIndex + Y_MIN] = datumIndex;
            valueData[aggIndex + Y_MIN] = yMin;
        }
        if (unset || yMax > valueData[aggIndex + Y_MAX]) {
            indexData[aggIndex + Y_MAX] = datumIndex;
            valueData[aggIndex + Y_MAX] = yMax;
        }
    }

    return { indexData, valueData };
}

export function createCategoryAggregationIndices(
    xValues: any[],
    yMaxValues: any[],
    yMinValues: any[],
    bandCount: number,
    maxRange: number
): {
    indexData: Int32Array;
    valueData: Float64Array;
} {
    const indexData = new Int32Array(maxRange * SPAN).fill(-1);
    const valueData = new Float64Array(maxRange * SPAN).fill(NaN);

    for (let datumIndex = 0; datumIndex < xValues.length; datumIndex += 1) {
        const xValue = xValues[datumIndex];
        const yMaxValue = yMaxValues[datumIndex];
        const yMinValue = yMinValues[datumIndex];
        if (xValue == null || yMaxValue == null || yMinValue == null) continue;

        // Note - we're not using scale.convert because the only domain we have is that from the
        // data model - it has not been normalized by the axis
        // In this case, the domain is just the xValues, so we can use the index directly
        const xRatio = datumIndex / bandCount;
        const yMax: number = yMaxValue.valueOf();
        const yMin: number = yMinValue.valueOf();
        const aggIndex = aggregationIndexForXRatio(xRatio, maxRange);

        const unset = indexData[aggIndex + X_MIN] === -1;

        if (unset || xRatio < valueData[aggIndex + X_MIN]) {
            indexData[aggIndex + X_MIN] = datumIndex;
            valueData[aggIndex + X_MIN] = xRatio;
        }
        if (unset || xRatio > valueData[aggIndex + X_MAX]) {
            indexData[aggIndex + X_MAX] = datumIndex;
            valueData[aggIndex + X_MAX] = xRatio;
        }
        if (unset || yMin < valueData[aggIndex + Y_MIN]) {
            indexData[aggIndex + Y_MIN] = datumIndex;
            valueData[aggIndex + Y_MIN] = yMin;
        }
        if (unset || yMax > valueData[aggIndex + Y_MAX]) {
            indexData[aggIndex + Y_MAX] = datumIndex;
            valueData[aggIndex + Y_MAX] = yMax;
        }
    }

    return { indexData, valueData };
}

export function compactAggregationIndices(
    indexData: Int32Array,
    valueData: Float64Array,
    maxRange: number,
    { inPlace = false } = {}
) {
    const nextMaxRange = (maxRange / 2) | 0;
    const nextIndexData = !inPlace ? new Int32Array(nextMaxRange * SPAN) : indexData;
    const nextValueData = !inPlace ? new Float64Array(nextMaxRange * SPAN) : valueData;

    for (let i = 0; i < nextMaxRange; i += 1) {
        const aggIndex = (i * SPAN) | 0;
        const index0 = (aggIndex * 2) | 0;
        const index1 = (index0 + SPAN) | 0;

        const index1Unset = indexData[index1 + X_MIN] === -1;

        const xMinAggIndex = index1Unset || valueData[index0 + X_MIN] < valueData[index1 + X_MIN] ? index0 : index1;
        nextIndexData[aggIndex + X_MIN] = indexData[xMinAggIndex + X_MIN];
        nextValueData[aggIndex + X_MIN] = valueData[xMinAggIndex + X_MIN];

        const xMaxAggIndex = index1Unset || valueData[index0 + X_MAX] > valueData[index1 + X_MAX] ? index0 : index1;
        nextIndexData[aggIndex + X_MAX] = indexData[xMaxAggIndex + X_MAX];
        nextValueData[aggIndex + X_MAX] = valueData[xMaxAggIndex + X_MAX];

        const yMinAggIndex = index1Unset || valueData[index0 + Y_MIN] < valueData[index1 + Y_MIN] ? index0 : index1;
        nextIndexData[aggIndex + Y_MIN] = indexData[yMinAggIndex + Y_MIN];
        nextValueData[aggIndex + Y_MIN] = valueData[yMinAggIndex + Y_MIN];

        const yMaxAggIndex = index1Unset || valueData[index0 + Y_MAX] > valueData[index1 + Y_MAX] ? index0 : index1;
        nextIndexData[aggIndex + Y_MAX] = indexData[yMaxAggIndex + Y_MAX];
        nextValueData[aggIndex + Y_MAX] = valueData[yMaxAggIndex + Y_MAX];
    }

    return { maxRange: nextMaxRange, indexData: nextIndexData, valueData: nextValueData };
}
