import { describe, expect, it } from 'vitest';

import { getBandEdgeOffset, getVerticalAlignShift, getVerticalBandEdgeOffset } from './axisLabelUtil';

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

describe('getVerticalBandEdgeOffset', () => {
    const BANDWIDTH = 40;

    it.each([
        ['top', -20],
        ['middle', 0],
        ['bottom', 20],
    ] as const)('takes a %s-aligned label from the band middle to its edge', (verticalAlign, expected) => {
        expect(getVerticalBandEdgeOffset(BANDWIDTH, verticalAlign)).toBe(expected);
    });

    it('leaves the axis-computed alignment on the tick', () => {
        expect(getVerticalBandEdgeOffset(BANDWIDTH, undefined)).toBe(0);
    });

    it('has no edge to move to without bands', () => {
        expect(getVerticalBandEdgeOffset(0, 'bottom')).toBe(0);
    });

    // The bandwidth carries the sign of a descending range, while the alignment is in canvas
    // space - so a descending range must not send `'bottom'` upwards.
    it('aligns to the same canvas edge whichever way the range runs', () => {
        expect(getVerticalBandEdgeOffset(-BANDWIDTH, 'bottom')).toBe(20);
        expect(getVerticalBandEdgeOffset(-BANDWIDTH, 'top')).toBe(-20);
    });
});

describe('getVerticalAlignShift', () => {
    const HEIGHT = 100;

    it.each(['top', 'middle', 'bottom'] as const)('leaves a "%s" box where it is', (verticalAlign) => {
        expect(getVerticalAlignShift(HEIGHT, verticalAlign, verticalAlign)).toBe(0);
    });

    it.each([
        ['top', 'middle', -50],
        ['top', 'bottom', -100],
        ['middle', 'bottom', -50],
        ['middle', 'top', 50],
        ['bottom', 'top', 100],
        ['bottom', 'middle', 50],
    ] as const)('slides a box measured "%s" to where "%s" anchors it', (from, to, expected) => {
        expect(getVerticalAlignShift(HEIGHT, from, to)).toBe(expected);
    });

    // The shift is the difference of two anchor fractions, so going and coming back must cancel.
    it.each([
        ['top', 'bottom'],
        ['top', 'middle'],
        ['middle', 'bottom'],
    ] as const)('is antisymmetric between "%s" and "%s"', (one, other) => {
        const there = getVerticalAlignShift(HEIGHT, one, other);
        const back = getVerticalAlignShift(HEIGHT, other, one);
        expect(there).toBe(-back);
    });

    it('has nowhere to slide a zero-height box', () => {
        expect(getVerticalAlignShift(0, 'top', 'bottom')).toBeCloseTo(0, 10);
    });
});
