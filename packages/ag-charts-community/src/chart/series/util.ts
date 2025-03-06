import { findMaxIndex, findMinIndex } from 'ag-charts-core';

import { Transformable } from '../../scene/transformable';
import type { BBoxValues } from '../../util/bboxinterface';
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
    series: ISeries<any, any, any>,
    datum: SeriesNodeDatum<unknown> & Pick<ErrorBoundSeriesNodeDatum, 'yBar'>,
    movedBounds: BBoxValues | undefined
): { canvasX: number; canvasY: number } | undefined {
    if (movedBounds) {
        const { x, y, width, height } = movedBounds;
        return { canvasX: x + width / 2, canvasY: y + height / 2 };
    }
    // On `line` and `scatter` series, the tooltip covers the top of error-bars when using datum.midPoint.
    // Using datum.yBar.upperPoint renders the tooltip higher up.
    const refPoint = datum.yBar?.upperPoint ?? datum.midPoint ?? series.datumMidPoint?.(datum);
    if (refPoint) {
        const { x, y } = Transformable.toCanvasPoint(series.contentGroup, refPoint.x, refPoint.y);
        return { canvasX: Math.round(x), canvasY: Math.round(y) };
    }
}

/**
 * Counts the number of items that match a condition within a specified range, starting at a given index and expanding
 * outwards until a certain count is reached.
 *
 * @param {number} min - The minimum number in the range.
 * @param {number} max - The maximum number in the range.
 * @param {number} start - The index at which to centre the search.
 * @param {number} countUntil - The maximum number until which to count.
 * @param {function(number): boolean} iteratee - A function that takes an index and returns a boolean to indicate if the value should be counted.
 * @returns {number} The count of items that matched the condition of the iteratee.
 */
export function countExpandingSearch(
    min: number,
    max: number,
    start: number,
    countUntil: number,
    iteratee: (index: number) => boolean
): number {
    let i = -1;
    let count = 0;
    let shift = 0;
    let reachedAnEnd = false;

    while (count < countUntil && i <= max - min) {
        i += 1;
        const index = start + shift;
        if (!reachedAnEnd) shift *= -1;
        if (shift >= 0) shift += 1;
        if (reachedAnEnd && shift < 0) shift -= 1;
        if (index < min || index > max) {
            reachedAnEnd = true;
            continue;
        }
        if (iteratee(index)) count += 1;
    }

    return count;
}
