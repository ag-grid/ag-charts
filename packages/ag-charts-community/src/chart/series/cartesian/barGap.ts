import { GAP_EDGE_END, GAP_EDGE_START, isNumberEqual, zeroLike } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

/**
 * `GAP_EDGE_*` flags for the edges with a known neighbour, so a missing stack total can lose a gap but never moves a
 * stack end. A cross-filtered overlay (`endIsFull` false) meets the neighbour above only when `currY` reaches `yEnd`.
 */
export function gapEdges(
    yStart: AgNumericValue,
    yEnd: AgNumericValue,
    yRange: AgNumericValue,
    currY: AgNumericValue,
    endIsFull: boolean
): number {
    let edges = yStart === zeroLike(yStart) ? 0 : GAP_EDGE_START;
    if (yEnd !== yRange && (endIsFull || reachesEnd(currY, yEnd))) edges |= GAP_EDGE_END;
    return edges;
}

/** Equal within a relative 1e-9, as `yStart + yFilterValue` is summed in floating point. */
function reachesEnd(currY: AgNumericValue, yEnd: AgNumericValue): boolean {
    const end = Number(yEnd);
    return isNumberEqual(Number(currY), end, 1e-9 * Math.max(1, Math.abs(end)));
}
