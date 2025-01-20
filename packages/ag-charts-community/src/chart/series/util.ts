import { findMaxIndex, findMinIndex } from 'ag-charts-core';

import { Transformable } from '../../scene/transformable';
import type { ErrorBoundSeriesNodeDatum, ISeries, SeriesNodeDatum } from './seriesTypes';

function datumBoundaryPoints(datum: any, domain: any[]) {
    if (datum == null || domain.length === 0) {
        return [false, false];
    }

    const datumValue = datum.valueOf();

    const d0 = domain[0];
    const d1 = domain[domain.length - 1];

    if (typeof d0 === 'string') {
        return [datumValue === d0, datumValue === d1];
    }

    let min = d0.valueOf();
    let max = d1.valueOf();
    if (min > max) {
        [min, max] = [max, min];
    }

    return [datumValue === min, datumValue === max];
}

export function datumStylerProperties<TDatum extends { xValue: any; yValue: any }>(
    datum: TDatum,
    xKey: string,
    yKey: string,
    xDomain: any[],
    yDomain: any[]
) {
    const { xValue, yValue } = datum;
    const [min, max] = datumBoundaryPoints(yValue, yDomain);
    const [first, last] = datumBoundaryPoints(xValue, xDomain);
    return {
        datum,
        xKey,
        yKey,
        xValue,
        yValue,
        first,
        last,
        min,
        max,
    };
}

export function visibleRangeIndices(
    length: number,
    [range0, range1]: [number, number],
    xRange: (index: number) => [number, number] | undefined
): [number, number] {
    const xMinIndex =
        findMinIndex(0, length - 1, (index) => {
            const x1 = xRange(index)?.[1] ?? NaN;
            return !Number.isFinite(x1) || x1 > range0;
        }) ?? 0;

    let xMaxIndex =
        findMaxIndex(0, length - 1, (index) => {
            const x0 = xRange(index)?.[0] ?? NaN;
            return !Number.isFinite(x0) || x0 < range1;
        }) ?? length - 1;

    xMaxIndex = Math.min(xMaxIndex + 1, length);

    return [xMinIndex, xMaxIndex];
}

export function getDatumRefPoint(
    series: ISeries<any, any>,
    datum: SeriesNodeDatum<unknown> & Pick<ErrorBoundSeriesNodeDatum, 'yBar'>
): { canvasX: number; canvasY: number } | undefined {
    // On `line` and `scatter` series, the tooltip covers the top of error-bars when using datum.midPoint.
    // Using datum.yBar.upperPoint renders the tooltip higher up.
    const refPoint = datum.yBar?.upperPoint ?? datum.midPoint ?? series.datumMidPoint?.(datum);
    if (refPoint) {
        const { x, y } = Transformable.toCanvasPoint(series.contentGroup, refPoint.x, refPoint.y);
        return { canvasX: Math.round(x), canvasY: Math.round(y) };
    }
}
