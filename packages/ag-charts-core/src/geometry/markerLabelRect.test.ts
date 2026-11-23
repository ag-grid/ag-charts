import { beforeAll, describe, expect, it } from 'vitest';

import { stubPath2D } from '../test/stubPath2D';
import { InsetMaskFitRegion, insetFitRegion } from './fitRegion';
import { insideMarkerPolicy, markerLabelRect, markerRowSpans } from './markerLabelRect';

describe('markerLabelRect', () => {
    beforeAll(stubPath2D);

    it('uses almost the whole square, centred', () => {
        const { width, height, cx, cy } = markerLabelRect('square');
        expect(width).toBeGreaterThan(0.9);
        expect(height).toBeGreaterThan(0.9);
        expect(cx).toBeCloseTo(0, 1);
        expect(cy).toBeCloseTo(0, 1);
    });

    it('inscribes a near-square in a circle and a smaller one in a diamond, both centred', () => {
        const circle = markerLabelRect('circle');
        const diamond = markerLabelRect('diamond');
        expect(circle.width).toBeCloseTo(0.7, 1);
        expect(circle.cx).toBeCloseTo(0, 1);
        expect(diamond.width).toBeCloseTo(0.5, 1);
        // A circle holds a larger inscribed rectangle than a diamond of the same diameter.
        expect(circle.width).toBeGreaterThan(diamond.width);
    });

    it('finds a wide, short rectangle for a heart', () => {
        const { width, height } = markerLabelRect('heart');
        expect(width).toBeGreaterThan(0.7);
        expect(width).toBeGreaterThan(height * 2);
    });

    it('offsets the rectangle into the wide part of an asymmetric shape', () => {
        // A triangle is widest at its base (bottom), so its largest rectangle sits below the centre.
        expect(markerLabelRect('triangle').cy).toBeGreaterThan(0.05);
        // A pin tapers to a point at the bottom, so its rectangle sits above the centre in the head.
        expect(markerLabelRect('pin').cy).toBeLessThan(-0.05);
    });

    it('falls back to the inscribed square for a custom shape that draws nothing', () => {
        const { width, height, cx, cy } = markerLabelRect(() => {});
        expect(width).toBeCloseTo(Math.SQRT1_2);
        expect(height).toBeCloseTo(Math.SQRT1_2);
        expect(cx).toBe(0);
        expect(cy).toBe(0);
    });

    it('analyses a custom rectangular path and caches the result per shape', () => {
        // A wide custom rectangle spanning 80% width, 30% height, centred.
        const wide = (p: any) => {
            const { path, x, y, size } = p;
            path.clear();
            path.rect(x - 0.4 * size, y - 0.15 * size, 0.8 * size, 0.3 * size);
        };
        const first = markerLabelRect(wide);
        expect(first.width).toBeGreaterThan(0.7);
        expect(first.height).toBeCloseTo(0.3, 1);
        // Same shape reference returns the identical cached object.
        expect(markerLabelRect(wide)).toBe(first);
    });
});

describe('insideMarkerPolicy', () => {
    beforeAll(stubPath2D);

    const SIZE = 100;
    const policyAt = (threshold: number, masked: boolean) =>
        insideMarkerPolicy({ base: {}, threshold, masked }, 'diamond', SIZE);

    it.each([
        { threshold: 6, grow: 0 },
        { threshold: -6, grow: 12 },
    ])(
        'grows the room by a negative threshold but never shrinks it by a positive one ($threshold)',
        ({ threshold, grow }) => {
            const rect = markerLabelRect('diamond');
            const policy = policyAt(threshold, false);
            expect(policy.maxWidth).toBe(SIZE * rect.width + grow);
            expect(policy.maxHeight).toBe(SIZE * rect.height + grow);
        }
    );

    it('bounds a circle marker by its inscribed square', () => {
        const policy = insideMarkerPolicy({ base: {}, threshold: 0, masked: false }, undefined, 20);
        expect(policy.maxWidth).toBeCloseTo(20 / Math.SQRT2);
        expect(policy.maxHeight).toBeCloseTo(20 / Math.SQRT2);
    });

    it('scales the room with the marker size, and gives a markerless point none', () => {
        const at = (size: number) => insideMarkerPolicy({ base: {}, threshold: 0, masked: false }, 'square', size);
        expect(at(100).maxWidth).toBeCloseTo(at(50).maxWidth! * 2);
        expect(at(100).maxHeight).toBeCloseTo(at(50).maxHeight! * 2);
        expect(at(0)).toMatchObject({ maxWidth: 0, maxHeight: 0 });
    });

    it('never widens past the base policy', () => {
        const policy = insideMarkerPolicy(
            { base: { maxWidth: 10, maxHeight: 5 }, threshold: -6, masked: false },
            'square',
            100
        );
        expect(policy).toMatchObject({ maxWidth: 10, maxHeight: 5 });
    });

    // The shape's rows inset only by spill: a positive threshold never shrinks the label's own room.
    const spillInsetRegion = (threshold: number) => {
        const rect = markerLabelRect('diamond');
        const spill = Math.min(threshold, 0);
        const mask = markerRowSpans('diamond')!;
        return insetFitRegion(
            new InsetMaskFitRegion().set(mask, SIZE, rect.cx * SIZE, rect.cy * SIZE, 0),
            spill,
            spill
        );
    };

    it.each([6, -6])('bounds a masked label by the shape rows inset only by spill, at threshold %d', (threshold) => {
        const sized = policyAt(threshold, true);
        const unsized = policyAt(0, true);
        const reference = spillInsetRegion(threshold);
        for (const [top, bottom] of [
            [-20, 20],
            [-5, 5],
            [10, 30],
        ]) {
            expect(sized.region!.spanAt(top, bottom)).toEqual(reference.spanAt(top, bottom));
            if (threshold > 0) expect(sized.region!.spanAt(top, bottom)).toEqual(unsized.region!.spanAt(top, bottom));
        }
        expect(sized.region!.extentAbove).toBe(reference.extentAbove);
        expect(sized.region!.extentBelow).toBe(reference.extentBelow);
        expect(sized.maxHeight).toBe(SIZE * markerLabelRect('diamond').height - 2 * Math.min(threshold, 0));
    });
});
