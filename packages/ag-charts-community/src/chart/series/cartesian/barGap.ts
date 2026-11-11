import { BBox, zeroLike } from 'ag-charts-core';
import type { Point } from 'ag-charts-core';

/**
 * A stacked segment's rect before the gap inset, for hover and click: the gap is shared between the two segments it
 * separates, so each segment owns half of it. It carries its own `midPoint` so the quadtree can index it as it is.
 */
export class BarPickBBox extends BBox {
    readonly midPoint: Point;

    constructor(x: number, y: number, width: number, height: number) {
        super(x, y, width, height);
        this.midPoint = { x: x + width / 2, y: y + height / 2 };
    }
}

export const GAP_EDGE_START = 1;
export const GAP_EDGE_END = 2;

/**
 * The edges of a stacked segment that have a neighbour, as `GAP_EDGE_*` flags. An edge is only reported when a
 * neighbour is known to be there, so a missing stack total loses a gap but never moves the end of a stack.
 *
 * - The start edge has a neighbour unless it sits on the stack baseline.
 * - The end edge has a neighbour unless it reaches the stack total (`yRange`). A cross-filtered overlay ends inside its
 *   segment, so only a full-height one (`currY` at `yEnd`) meets the neighbour above; `endIsFull` is true for the
 *   segments drawn at full height (the phantom bar, or any bar when there is no cross-filter).
 */
export function gapEdges(yStart: unknown, yEnd: unknown, yRange: unknown, currY: unknown, endIsFull: boolean): number {
    let edges = yStart === zeroLike(yStart as number | bigint) ? 0 : GAP_EDGE_START;
    if (yEnd !== yRange && (endIsFull || sameValue(currY, yEnd))) edges |= GAP_EDGE_END;
    return edges;
}

function sameValue(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    const x = Number(a);
    const y = Number(b);
    return Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(y));
}

/** The span of a segment along the value axis, written in place by `insetGapSpan`. */
export interface GapSpan {
    /** The lowest pixel of the span. */
    start: number;
    length: number;
}

/**
 * Pulls a segment's span in by `halfGap` on each edge that has a neighbour. A segment too short for its share of the
 * gap collapses to zero length at its middle, so it is not drawn and its neighbours keep their inset. `startIsLow` is
 * true when the segment's start edge sits at the lower pixel.
 */
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
