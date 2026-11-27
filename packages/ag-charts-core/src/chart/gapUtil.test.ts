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
