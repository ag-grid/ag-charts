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
 * `GAP_EDGE_*` flags for the edges of a stacked segment that have a neighbour: the start unless it is on the baseline,
 * and the end unless it is the end of the stack. Pass `stackEnd` as `end` when the stack's end is unknown, so the
 * segment loses a gap rather than moving the end of the stack.
 */
export function stackGapEdges(start: AgNumericValue, end: AgNumericValue, stackEnd: AgNumericValue): number {
    let edges = start === zeroLike(start) ? 0 : GAP_EDGE_START;
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
