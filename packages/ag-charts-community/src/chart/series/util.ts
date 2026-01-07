import { type BoxBounds, findMaxIndex, findMinIndex } from 'ag-charts-core';

import { Transformable } from '../../scene/transformable';
import { type HighlightState, highlightStates } from './seriesProperties';
import type { DatumIndexType, ErrorBoundSeriesNodeDatum, ISeries, ItemId, SeriesNodeDatum } from './seriesTypes';

function datumBoundaryPoints(datum: any, domain: any[]): [boolean, boolean] {
    if (datum == null || domain.length === 0) {
        return [false, false];
    }

    const datumValue = datum.valueOf();

    const d0 = domain[0];
    const d1 = domain.at(-1);

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

export function datumStylerProperties(
    xValue: any,
    yValue: any,
    xKey: string,
    yKey: string,
    xDomain: any[],
    yDomain: any[]
) {
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
    sortOrder: 1 | -1,
    length: number,
    [range0, range1]: [number, number],
    xRange: (index: number) => [number, number] | undefined
): [number, number] {
    let xMinIndex =
        findMinIndex(0, length - 1, (i) => {
            const index = sortOrder === 1 ? i : length - i;
            const x1 = xRange(index)?.[1] ?? Number.NaN;
            return !Number.isFinite(x1) || x1 >= range0;
        }) ?? 0;

    let xMaxIndex =
        findMaxIndex(0, length - 1, (i) => {
            const index = sortOrder === 1 ? i : length - i;
            const x0 = xRange(index)?.[0] ?? Number.NaN;
            return !Number.isFinite(x0) || x0 <= range1;
        }) ?? length - 1;

    if (sortOrder === -1) {
        [xMinIndex, xMaxIndex] = [length - xMaxIndex, length - xMinIndex];
    }

    xMinIndex = Math.max(xMinIndex, 0);
    xMaxIndex = Math.min(xMaxIndex + 1, length);

    return [xMinIndex, xMaxIndex];
}

export function getDatumRefPoint(
    series: ISeries<any, any, any>,
    datum: SeriesNodeDatum<DatumIndexType> & Pick<ErrorBoundSeriesNodeDatum, 'yBar'>,
    movedBounds: BoxBounds | undefined
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

export function getItemStyles<TNodeDatum, TStyle>(
    getItemStyle: (nodeDatum: TNodeDatum | undefined, isHighlight: boolean, highlightState?: HighlightState) => TStyle
) {
    const result = {} as Record<HighlightState, TStyle>;
    for (const state of highlightStates) {
        result[state] = getItemStyle(undefined, false, state);
    }
    return result;
}

export function getItemStylesPerItemId<ItemId extends string, TNodeDatum, TStyle>(
    getItemStyle: (
        nodeDatum: TNodeDatum | undefined,
        isHighlight: boolean,
        highlightState?: HighlightState,
        itemId?: ItemId
    ) => TStyle,
    ...itemIds: ItemId[]
) {
    const result = {} as Record<ItemId, Record<HighlightState, TStyle>>;
    for (const itemId of itemIds ?? ['default']) {
        for (const state of highlightStates) {
            const states = (result[itemId] ??= {} as Record<HighlightState, TStyle>);
            states[state] = getItemStyle(undefined, false, state, itemId);
        }
    }
    return result;
}

export function hasDimmedOpacity(style?: { opacity?: number; fillOpacity?: number; strokeOpacity?: number }) {
    return (style?.opacity ?? 1) < 1 || (style?.fillOpacity ?? 1) < 1 || (style?.strokeOpacity ?? 1) < 1;
}

export function findNodeDatumInArray<I extends DatumIndexType, D extends SeriesNodeDatum<I>>(
    itemId: ItemId,
    nodeData: D[] | undefined
): D | undefined {
    for (const node of nodeData ?? []) {
        if (node.itemId === itemId) {
            return node;
        }
    }
    return undefined;
}
