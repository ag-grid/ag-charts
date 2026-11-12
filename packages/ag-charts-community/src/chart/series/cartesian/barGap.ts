import { BBox, zeroLike } from 'ag-charts-core';

/** A stacked segment's rect before the gap inset: each segment owns half of each gap for hover and click. */
export class BarPickBBox extends BBox {
    readonly midPoint = { x: 0, y: 0 };

    constructor() {
        super(0, 0, 0, 0);
    }

    setBounds(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.midPoint.x = x + width / 2;
        this.midPoint.y = y + height / 2;
    }
}

export const GAP_EDGE_START = 1;
export const GAP_EDGE_END = 2;

/**
 * `GAP_EDGE_*` flags for the edges with a known neighbour, so a missing stack total can lose a gap but never moves a
 * stack end. A cross-filtered overlay (`endIsFull` false) meets the neighbour above only when `currY` reaches `yEnd`.
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

export interface GapSpan {
    /** The lowest pixel of the span. */
    start: number;
    length: number;
}

/** Pulls in each edge with a neighbour by `halfGap`; a segment too short for it collapses to zero length at its middle. */
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
