export const GAP_EDGE_START = 1;
export const GAP_EDGE_END = 2;

export interface GapSpan {
    /** The lowest pixel of the span. */
    start: number;
    length: number;
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
