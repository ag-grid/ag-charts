import { GAP_EDGE_END, isNumberEqual, stackGapEdges } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

/**
 * `stackGapEdges`, except that a cross-filtered overlay (`endIsFull` false) meets the neighbour above only when `currY`
 * reaches `yEnd`.
 */
export function barGapEdges(
    yStart: AgNumericValue,
    yEnd: AgNumericValue,
    yRange: AgNumericValue,
    currY: AgNumericValue,
    endIsFull: boolean,
    hasOpposite?: boolean
): number {
    const edges = stackGapEdges(yStart, yEnd, yRange, hasOpposite);
    return endIsFull || reachesEnd(currY, yEnd) ? edges : edges & ~GAP_EDGE_END;
}

/** Equal within a relative 1e-9, as `yStart + yFilterValue` is summed in floating point. */
function reachesEnd(currY: AgNumericValue, yEnd: AgNumericValue): boolean {
    const end = Number(yEnd);
    return isNumberEqual(Number(currY), end, 1e-9 * Math.max(1, Math.abs(end)));
}

/**
 * Whether a stack has a segment on the other side of the axis from a datum: `opposite` is the end of the stack's range
 * on that side, so a positive datum looks at the range's lower end and has a neighbour when it is below zero.
 */
export function hasOppositeStack(opposite: AgNumericValue | undefined, isPositive: boolean): boolean {
    return opposite != null && (isPositive ? opposite < 0 : opposite > 0);
}
