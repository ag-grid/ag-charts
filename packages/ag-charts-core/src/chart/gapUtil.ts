import type { AgNumericValue } from 'ag-charts-types';

import { zeroLike } from '../data/numbers';

export const GAP_EDGE_START = 1;
export const GAP_EDGE_END = 2;

export interface GapSpan {
    /** The lowest pixel of the span. */
    start: number;
    length: number;
}

/**
 * `GAP_EDGE_*` flags for the edges of a stacked segment that have a neighbour: the start unless it is on the baseline
 * with nothing on the other side of it, and the end unless it is the end of the stack. A start on the baseline has a
 * neighbour when `hasOpposite`, whether the stack has a segment on the other side of the baseline, is set. Pass
 * `stackEnd` as `end` when the stack's end is unknown, and leave `hasOpposite` unset when it is, so the segment loses
 * a gap rather than moving an edge that has no neighbour.
 */
export function stackGapEdges(
    start: AgNumericValue,
    end: AgNumericValue,
    stackEnd: AgNumericValue,
    hasOpposite = false
): number {
    let edges = hasOpposite || start !== zeroLike(start) ? GAP_EDGE_START : 0;
    if (end !== stackEnd) edges |= GAP_EDGE_END;
    return edges;
}

/** Pulls in each `GAP_EDGE_*` edge by `halfGap`; a span too short for it collapses to zero length at its middle. */
export function insetGapSpan(span: GapSpan, halfGap: number, edges: number, startIsLow: boolean): void {
    const startInset = (edges & GAP_EDGE_START) === 0 ? 0 : halfGap;
    const endInset = (edges & GAP_EDGE_END) === 0 ? 0 : halfGap;
    const lowInset = startIsLow ? startInset : endInset;
    const highInset = startIsLow ? endInset : startInset;
    if (lowInset === 0 && highInset === 0) return;

    const length = span.length - lowInset - highInset;
    if (length > 0) {
        span.start += lowInset;
        span.length = length;
    } else {
        span.start += span.length / 2;
        span.length = 0;
    }
}
