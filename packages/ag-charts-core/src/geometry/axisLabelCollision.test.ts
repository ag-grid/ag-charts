import { describe, expect, it } from 'vitest';

import {
    type RadialAxisLabel,
    axisLabelsOverlap,
    countAxisLabelOverlaps,
    hideCollidingRadialCategoryLabels,
    hideCollidingRadialNumberLabels,
    labelExceedsBand,
    resolveEdgeLabelOverflow,
    thinTickLabels,
    tickLabelSpacing,
    walkPairsOutward,
} from './axisLabelCollision';

describe('tickLabelSpacing', () => {
    it('defaults to 10px for unrotated labels', () => {
        expect(tickLabelSpacing(undefined, 0)).toBe(10);
    });

    it('uses the threshold when set, for labels turned a full circle too', () => {
        expect(tickLabelSpacing(4, 0)).toBe(4);
        expect(tickLabelSpacing(4, 2 * Math.PI)).toBe(4);
    });

    it('packs rotated labels edge to edge, upside down included, whatever the threshold', () => {
        expect(tickLabelSpacing(undefined, Math.PI / 2)).toBe(0);
        expect(tickLabelSpacing(40, Math.PI)).toBe(0);
    });
});

describe('axisLabelsOverlap', () => {
    const box = (x: number) => ({ x, y: 0, width: 20, height: 10 });

    it('detects a box overlapping any earlier one', () => {
        expect(axisLabelsOverlap([box(0), box(50), box(10)])).toBe(true);
    });

    it.each([
        ['along the text', box(25)],
        ['across the text', { ...box(0), y: 15 }],
    ])('grows only the later box by the spacing, %s', (_, other) => {
        expect(axisLabelsOverlap([box(0), other], 5)).toBe(false);
        expect(axisLabelsOverlap([box(0), other], 6)).toBe(false);
        expect(axisLabelsOverlap([other, box(0)], 5)).toBe(false);
        expect(axisLabelsOverlap([other, box(0)], 6)).toBe(true);
    });

    it.each([
        ['along the text', box(0), box(5), 15],
        ['across the text', box(0), { ...box(0), y: 6 }, 4],
    ])('lets boxes overlap by up to a negative spacing, %s', (_, first, second, overlap) => {
        for (const boxes of [
            [first, second],
            [second, first],
        ]) {
            expect(axisLabelsOverlap(boxes, -(overlap - 1))).toBe(true);
            expect(axisLabelsOverlap(boxes, -overlap)).toBe(false);
        }
    });

    it('counts each box colliding with an earlier one, up to the limit', () => {
        const boxes = [box(0), box(10), box(15), box(100)];
        expect(countAxisLabelOverlaps(boxes)).toBe(2);
        expect(countAxisLabelOverlaps(boxes, 0, 1)).toBe(1);
    });
});

describe('thinTickLabels', () => {
    // Per rotation index: how many labels collide and how many characters truncation drops.
    interface Set {
        overlaps: number[];
        dropped?: number[];
        pinned?: boolean;
        strides?: number[];
    }

    function candidates(...sets: Set[]) {
        let index = 0;
        const next = () => {
            const set = sets[index++];
            return set == null ? undefined : { candidate: set, pinned: set.pinned ?? false };
        };
        const counted: number[] = [];
        const fit = {
            overlaps: (set: Set, rotationIndex: number) => set.overlaps[rotationIndex] > 0,
            droppedChars: (set: Set, rotationIndex: number) => set.dropped?.[rotationIndex] ?? 0,
            clearStride: (set: Set, rotationIndex: number) => set.strides?.[rotationIndex] ?? 1,
            overlapCount: (set: Set, rotationIndex: number) => {
                counted.push(rotationIndex);
                return set.overlaps[rotationIndex];
            },
        };
        return { next, fit, sets, counted };
    }

    it('walks to the first candidate whose labels do not overlap', () => {
        const { next, fit, sets } = candidates({ overlaps: [1] }, { overlaps: [0] }, { overlaps: [0] });
        expect(thinTickLabels(next, fit, false, 1)).toEqual({ candidate: sets[1], rotationIndex: 0, labelStride: 1 });
    });

    it('keeps the first candidate when labels are always shown', () => {
        const { next, fit, sets } = candidates({ overlaps: [1] }, { overlaps: [0] });
        expect(thinTickLabels(next, fit, true, 1).candidate).toBe(sets[0]);
    });

    it('uses the first rotation in the list at which the labels fit whole', () => {
        const { next, fit, sets } = candidates({ overlaps: [1, 0, 0] }, { overlaps: [0] });
        expect(thinTickLabels(next, fit, false, 3)).toEqual({ candidate: sets[0], rotationIndex: 1, labelStride: 1 });
    });

    it('prefers a later rotation that fits whole over an earlier one that truncates', () => {
        const { next, fit, sets } = candidates({ overlaps: [1, 0, 0], dropped: [0, 4, 0] });
        expect(thinTickLabels(next, fit, false, 3)).toEqual({ candidate: sets[0], rotationIndex: 2, labelStride: 1 });
    });

    it('truncates at the clear rotation that drops the fewest characters, ties going to the earlier', () => {
        const { next, fit, sets } = candidates({ overlaps: [0, 0, 0], dropped: [9, 3, 3] });
        expect(thinTickLabels(next, fit, false, 3)).toEqual({ candidate: sets[0], rotationIndex: 1, labelStride: 1 });
    });

    it('truncates rather than thins', () => {
        const { next, fit, sets } = candidates({ overlaps: [1, 0], dropped: [0, 20] }, { overlaps: [0, 0] });
        expect(thinTickLabels(next, fit, false, 2)).toEqual({ candidate: sets[0], rotationIndex: 1, labelStride: 1 });
    });

    it('thins once every rotation collides, without counting collisions', () => {
        const { next, fit, sets, counted } = candidates({ overlaps: [2, 1] }, { overlaps: [1, 0] });
        expect(thinTickLabels(next, fit, false, 2)).toEqual({ candidate: sets[1], rotationIndex: 1, labelStride: 1 });
        expect(counted).toEqual([]);
    });

    it('truncates at the last rotation before thinning, once every rotation collides', () => {
        const { next, fit, sets } = candidates({ overlaps: [2, 1, 0] }, { overlaps: [0, 0] });
        expect(thinTickLabels(next, fit, false, 2, true)).toEqual({
            candidate: sets[0],
            rotationIndex: 2,
            labelStride: 1,
        });
    });

    it('thins once the truncated labels still collide', () => {
        const { next, fit, sets } = candidates({ overlaps: [2, 1, 1] }, { overlaps: [1, 0, 0] });
        expect(thinTickLabels(next, fit, false, 2, true)).toEqual({
            candidate: sets[1],
            rotationIndex: 1,
            labelStride: 1,
        });
    });

    it('keeps the rotation with the fewest collisions when labels are always shown', () => {
        const { next, fit, sets } = candidates({ overlaps: [5, 2, 3] }, { overlaps: [0, 0, 0] });
        expect(thinTickLabels(next, fit, true, 3)).toEqual({ candidate: sets[0], rotationIndex: 1, labelStride: 1 });
    });

    it('still falls back through the rotations when labels are always shown', () => {
        const { next, fit, sets } = candidates({ overlaps: [1, 0] }, { overlaps: [0, 0] });
        expect(thinTickLabels(next, fit, true, 2)).toEqual({ candidate: sets[0], rotationIndex: 1, labelStride: 1 });
    });

    it('moves on from a pinned candidate to a later pinned one whose labels fit', () => {
        const { next, fit, sets } = candidates({ overlaps: [1, 1], pinned: true }, { overlaps: [0, 0], pinned: true });
        expect(thinTickLabels(next, fit, false, 2).candidate).toBe(sets[1]);
    });

    it('shows every nth label of the first pinned candidate, at the rotation needing the smallest stride', () => {
        const { next, fit, sets } = candidates(
            { overlaps: [2, 1], strides: [3, 2], pinned: true },
            { overlaps: [1, 1], pinned: true }
        );
        expect(thinTickLabels(next, fit, false, 2)).toEqual({ candidate: sets[0], rotationIndex: 1, labelStride: 2 });
    });

    it('shows every pinned label when labels are always shown', () => {
        const { next, fit, sets } = candidates({ overlaps: [2, 1], strides: [3, 2], pinned: true });
        expect(thinTickLabels(next, fit, true, 2)).toEqual({ candidate: sets[0], rotationIndex: 1, labelStride: 1 });
    });

    it('settles on the last candidate once they run out', () => {
        const { next, fit, sets } = candidates({ overlaps: [1] }, { overlaps: [1] });
        expect(thinTickLabels(next, fit, false, 1).candidate).toBe(sets[1]);
    });
});

describe('resolveEdgeLabelOverflow', () => {
    const extents = { start: 0, end: 100, pairEnds: false };

    it('hides nothing when both end labels fit', () => {
        expect(resolveEdgeLabelOverflow({ ...extents, firstStart: 0, lastEnd: 100 })).toEqual({
            hideFirst: false,
            hideLast: false,
        });
    });

    it('hides the last label past the end, with the first when ends pair', () => {
        expect(resolveEdgeLabelOverflow({ ...extents, firstStart: undefined, lastEnd: 101 })).toEqual({
            hideFirst: false,
            hideLast: true,
        });
        expect(resolveEdgeLabelOverflow({ ...extents, pairEnds: true, firstStart: undefined, lastEnd: 101 })).toEqual({
            hideFirst: true,
            hideLast: true,
        });
    });

    it('hides the first label before the start, with the last when ends pair', () => {
        expect(resolveEdgeLabelOverflow({ ...extents, firstStart: -1, lastEnd: 50 })).toEqual({
            hideFirst: true,
            hideLast: false,
        });
        expect(resolveEdgeLabelOverflow({ ...extents, pairEnds: true, firstStart: -1, lastEnd: 50 })).toEqual({
            hideFirst: true,
            hideLast: true,
        });
    });
});

describe('labelExceedsBand', () => {
    it('is true only for a label wider than its band', () => {
        expect(labelExceedsBand(30, 30)).toBe(false);
        expect(labelExceedsBand(31, 30)).toBe(true);
    });
});

describe('walkPairsOutward', () => {
    it('walks forward to the middle, then backward from the end', () => {
        const pairs: [number, number][] = [];
        walkPairsOutward([0, 1, 2, 3, 4, 5, 6, 7], 2, (prev, next) => {
            pairs.push([prev, next]);
        });
        expect(pairs).toEqual([
            [0, 2],
            [2, 4],
            [0, 6],
        ]);
    });
});

describe('radial axis labels', () => {
    // Labels around a circle of radius 100, each a 30×10 box centred on its point.
    function ring(count: number): RadialAxisLabel[] {
        return Array.from({ length: count }, (_, i) => {
            const angle = (i / count) * Math.PI * 2;
            const x = 100 * Math.cos(angle);
            const y = 100 * Math.sin(angle);
            return { x, y, hidden: false, box: { x: x - 15, y: y - 5, width: 30, height: 10 } };
        });
    }
    const visible = (labels: RadialAxisLabel[]) => labels.flatMap((l, i) => (l.hidden ? [] : [i]));

    it('leaves sparse labels alone', () => {
        const category = ring(8);
        hideCollidingRadialCategoryLabels(category, undefined);
        expect(visible(category)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);

        const number = ring(8);
        hideCollidingRadialNumberLabels(number, undefined);
        expect(visible(number)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    });

    it('hides category labels at the smallest clearing step and clears their boxes', () => {
        const labels = ring(40);
        hideCollidingRadialCategoryLabels(labels, undefined);
        const shown = visible(labels);
        expect(shown.length).toBeLessThan(40);
        expect(shown[0]).toBe(0);
        expect(labels.every((l) => l.hidden === (l.box == null))).toBe(true);
    });

    it('doubles the number label step until consecutive labels clear', () => {
        const labels = ring(40);
        hideCollidingRadialNumberLabels(labels, undefined);
        const shown = visible(labels);
        const step = shown[1] - shown[0];
        expect([2, 4, 8, 16]).toContain(step);
        expect(shown.every((i) => i % step === 0)).toBe(true);
    });

    it('treats minSpacing as clearance around both labels', () => {
        const loose = ring(12);
        hideCollidingRadialNumberLabels(loose, undefined);
        const spaced = ring(12);
        hideCollidingRadialNumberLabels(spaced, 40);
        expect(visible(spaced).length).toBeLessThan(visible(loose).length);
    });
});
