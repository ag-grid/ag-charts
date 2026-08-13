import { describe, expect, it } from 'vitest';

import { getBandEdgeOffset, getTickLabelEdgeOffsets } from './axisLabelUtil';

describe('getTickLabelEdgeOffsets', () => {
    const WIDTH = 100;

    it.each([0, Math.PI / 4, Math.PI / 2, Math.PI])(
        'measures the axis-computed alignment centre-anchored at rotation %f',
        (rotation) => {
            expect(getTickLabelEdgeOffsets(WIDTH, rotation, undefined)).toEqual({ leading: -50, trailing: 50 });
        }
    );

    it.each([
        ['left', { leading: 0, trailing: 100 }],
        ['center', { leading: -50, trailing: 50 }],
        ['right', { leading: -100, trailing: 0 }],
    ] as const)('anchors an unrotated "%s" override against its own box', (textAlign, expected) => {
        expect(getTickLabelEdgeOffsets(WIDTH, 0, textAlign)).toEqual(expected);
    });

    it.each(['left', 'center', 'right'] as const)(
        'collapses a quarter-turn "%s" override onto its anchor',
        (textAlign) => {
            const { leading, trailing } = getTickLabelEdgeOffsets(WIDTH, Math.PI / 2, textAlign);
            expect(leading).toBeCloseTo(0, 10);
            expect(trailing).toBeCloseTo(0, 10);
        }
    );

    it('projects a partially rotated override onto the axis', () => {
        // cos(60 degrees) is 0.5, so a right-aligned label reaches half its width back from the anchor.
        const { leading, trailing } = getTickLabelEdgeOffsets(WIDTH, Math.PI / 3, 'right');

        expect(leading).toBeCloseTo(-50, 10);
        expect(trailing).toBeCloseTo(0, 10);
    });

    it('orders the edges by their projection, not by the alignment', () => {
        // A half-turn mirrors the projection, so a left-aligned label extends backwards along the axis.
        const { leading, trailing } = getTickLabelEdgeOffsets(WIDTH, Math.PI, 'left');

        expect(leading).toBeCloseTo(-100, 10);
        expect(trailing).toBeCloseTo(0, 10);
    });
});

describe('getBandEdgeOffset', () => {
    const BANDWIDTH = 40;

    it.each([
        ['left', -20],
        ['center', 0],
        ['right', 20],
    ] as const)('takes a %s-aligned label from the band middle to its edge', (textAlign, expected) => {
        expect(getBandEdgeOffset(BANDWIDTH, textAlign)).toBe(expected);
    });

    it('leaves the axis-computed alignment on the tick', () => {
        expect(getBandEdgeOffset(BANDWIDTH, undefined)).toBe(0);
    });

    it('has no edge to move to without bands', () => {
        expect(getBandEdgeOffset(0, 'right')).toBe(0);
    });

    // `bandScale.update()` derives the bandwidth from a signed range distance, while the alignment
    // is in canvas space - so a descending range must not send `'right'` to the left.
    it('aligns to the same canvas edge whichever way the range runs', () => {
        expect(getBandEdgeOffset(-BANDWIDTH, 'right')).toBe(20);
        expect(getBandEdgeOffset(-BANDWIDTH, 'left')).toBe(-20);
    });
});
