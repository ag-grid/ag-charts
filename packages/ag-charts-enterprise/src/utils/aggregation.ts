import { _ModuleSupport } from 'ag-charts-community';

const { findMinMax, findMinValue, findMaxValue } = _ModuleSupport;

export const X_MIN = 0;
export const X_MAX = 1;
export const Y_MIN = 2;
export const Y_MAX = 3;
export const SPAN = 4;

export function aggregationDomain(domain: any[]): [number, number] {
    return findMinMax(domain.map((x) => Number(x))) as [number, number];
}

export function xRatioForDatumIndex(xValue: any, d0: number, d1: number) {
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

    for (let datumIndex = 0; datumIndex < xValues.length; datumIndex += 1) {
        const xValue = xValues[datumIndex];
        const yMaxValue = yMaxValues[datumIndex];
        const yMinValue = yMinValues[datumIndex];
        if (xValue == null || yMaxValue == null || yMinValue == null) continue;

        const xRatio = xRatioForDatumIndex(xValue, d0, d1);
        const yMax: number = yMaxValue.valueOf();
        const yMin: number = yMinValue.valueOf();
        const aggIndex = aggregationIndexForXRatio(xRatio, maxRange);

        if (Number.isNaN(valueData[aggIndex + X_MIN]) || xRatio < valueData[aggIndex + X_MIN]) {
            indexData[aggIndex + X_MIN] = datumIndex;
            valueData[aggIndex + X_MIN] = xRatio;
        }
        if (Number.isNaN(valueData[aggIndex + X_MAX]) || xRatio > valueData[aggIndex + X_MAX]) {
            indexData[aggIndex + X_MAX] = datumIndex;
            valueData[aggIndex + X_MAX] = xRatio;
        }
        if (Number.isNaN(valueData[aggIndex + Y_MIN]) || yMin < valueData[aggIndex + Y_MIN]) {
            indexData[aggIndex + Y_MIN] = datumIndex;
            valueData[aggIndex + Y_MIN] = yMin;
        }
        if (Number.isNaN(valueData[aggIndex + Y_MAX]) || yMax > valueData[aggIndex + Y_MAX]) {
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

        const xMinAggIndex = valueData[index0 + X_MIN] < valueData[index1 + X_MIN] ? index0 : index1;
        nextIndexData[aggIndex + X_MIN] = indexData[xMinAggIndex + X_MIN];
        nextValueData[aggIndex + X_MIN] = valueData[xMinAggIndex + X_MIN];

        const xMaxAggIndex = valueData[index0 + X_MAX] > valueData[index1 + X_MAX] ? index0 : index1;
        nextIndexData[aggIndex + X_MAX] = indexData[xMaxAggIndex + X_MAX];
        nextValueData[aggIndex + X_MAX] = valueData[xMaxAggIndex + X_MAX];

        const yMinAggIndex = valueData[index0 + Y_MIN] < valueData[index1 + Y_MIN] ? index0 : index1;
        nextIndexData[aggIndex + Y_MIN] = indexData[yMinAggIndex + Y_MIN];
        nextValueData[aggIndex + Y_MIN] = valueData[yMinAggIndex + Y_MIN];

        const yMaxAggIndex = valueData[index0 + Y_MAX] > valueData[index1 + Y_MAX] ? index0 : index1;
        nextIndexData[aggIndex + Y_MAX] = indexData[yMaxAggIndex + Y_MAX];
        nextValueData[aggIndex + Y_MAX] = valueData[yMaxAggIndex + Y_MAX];
    }

    return { maxRange: nextMaxRange, indexData: nextIndexData, valueData: nextValueData };
}

export function visibleRange(
    length: number,
    x0: number,
    x1: number,
    xFor: (index: number) => number
): [number, number] {
    let start = findMinValue(0, length - 1, (index) => {
        const x = xFor(index);
        return !Number.isFinite(x) || x > x0 ? index : undefined;
    });
    start = Math.max((start ?? 0) - 1, 0);
    let end = findMaxValue(0, length - 1, (index) => {
        const x = xFor(index);
        return !Number.isFinite(x) || x < x1 ? index : undefined;
    });
    // Two points needed over end so the spans draw correctly
    end = Math.min((end ?? length) + 2, length);
    return [start, end];
}
