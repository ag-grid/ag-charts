import { describe, expect, it } from 'vitest';

import { GAP_EDGE_END, GAP_EDGE_START, insetGapSpan, stackGapEdges } from './gapUtil';

describe('stackGapEdges', () => {
    it.each([
        ['bottom of a stack', 0, 10, 30, GAP_EDGE_END],
        ['middle of a stack', 10, 20, 30, GAP_EDGE_START | GAP_EDGE_END],
        ['top of a stack', 20, 30, 30, GAP_EDGE_START],
        ['only segment', 0, 30, 30, 0],
        ['below the axis', -10, -20, -30, GAP_EDGE_START | GAP_EDGE_END],
        ['negative zero baseline', -0, -10, -30, GAP_EDGE_END],
        ['bigint middle', 10n, 20n, 30n, GAP_EDGE_START | GAP_EDGE_END],
        ['bigint baseline', 0n, 20n, 30n, GAP_EDGE_END],
    ])('%s', (_name, start, end, stackEnd, expected) => {
        expect(stackGapEdges(start, end, stackEnd)).toBe(expected);
    });

    it.each([
        ['bottom of a stack with a segment on the other side', 0, 10, 30, GAP_EDGE_START | GAP_EDGE_END],
        ['only segment on this side, with a segment on the other side', 0, 30, 30, GAP_EDGE_START],
        ['negative zero baseline with a segment on the other side', -0, -10, -30, GAP_EDGE_START | GAP_EDGE_END],
        ['bigint baseline with a segment on the other side', 0n, 20n, 30n, GAP_EDGE_START | GAP_EDGE_END],
        ['middle of a stack, which already has a neighbour', 10, 20, 30, GAP_EDGE_START | GAP_EDGE_END],
        ['top of a stack, which already has a neighbour', 20, 30, 30, GAP_EDGE_START],
    ])('%s: the baseline edge meets the other side of the axis', (_name, start, end, stackEnd, expected) => {
        expect(stackGapEdges(start, end, stackEnd, true)).toBe(expected);
    });

    it('an unknown stack end loses the end gap but keeps the zero edge neighbour', () => {
        // `stackEnd` passed as `end` means the end is unknown: no end edge, the zero edge still has its neighbour.
        expect(stackGapEdges(0, 10, 10, true)).toBe(GAP_EDGE_START);
    });
});

describe('insetGapSpan', () => {
    const inset = (start: number, length: number, edges: number, startIsLow: boolean) => {
        const span = { start, length };
        insetGapSpan(span, 2, edges, startIsLow);
        return span;
    };

    it.each([
        ['no edges', 0, { start: 10, length: 20 }],
        ['start edge, start low', GAP_EDGE_START, { start: 12, length: 18 }],
        ['end edge, start low', GAP_EDGE_END, { start: 10, length: 18 }],
        ['both edges', GAP_EDGE_START | GAP_EDGE_END, { start: 12, length: 16 }],
    ])('%s', (_name, edges, expected) => {
        expect(inset(10, 20, edges, true)).toEqual(expected);
    });

    it('pulls in the high end for the start edge when the start is high', () => {
        expect(inset(10, 20, GAP_EDGE_START, false)).toEqual({ start: 10, length: 18 });
    });

    it('collapses a span too short for its insets to zero length at its middle', () => {
        expect(inset(10, 3, GAP_EDGE_START | GAP_EDGE_END, true)).toEqual({ start: 11.5, length: 0 });
    });
});
