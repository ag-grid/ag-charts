import { describe, expect, it } from 'vitest';

import {
    type RadialAxisLabel,
    axisLabelsOverlap,
    hideCollidingRadialCategoryLabels,
    hideCollidingRadialNumberLabels,
    labelExceedsBand,
    resolveEdgeLabelOverflow,
    thinTickLabels,
    tickLabelSpacing,
    walkPairsOutward,
} from './axisLabelCollision';

describe('tickLabelSpacing', () => {
    it('defaults to 10px between unrotated labels and none between rotated ones', () => {
        expect(tickLabelSpacing(undefined, false)).toBe(10);
        expect(tickLabelSpacing(undefined, true)).toBe(0);
    });

    it('uses minSpacing whatever the rotation', () => {
        expect(tickLabelSpacing(4, false)).toBe(4);
        expect(tickLabelSpacing(4, true)).toBe(4);
    });
});

describe('axisLabelsOverlap', () => {
    const box = (x: number) => ({ x, y: 0, width: 20, height: 10 });

    it('detects a box overlapping any earlier one', () => {
        expect(axisLabelsOverlap([box(0), box(50), box(10)])).toBe(true);
    });

    it('grows each later box by the spacing in width and height', () => {
        expect(axisLabelsOverlap([box(25), box(0)])).toBe(false);
        expect(axisLabelsOverlap([box(25), box(0)], 6)).toBe(true);
        expect(axisLabelsOverlap([box(0), box(25)], 6)).toBe(false);
    });
});

describe('thinTickLabels', () => {
    function candidates(...sets: { overlaps: boolean[]; pinned?: boolean }[]) {
        let index = 0;
        const next = () => {
            const set = sets[index++];
            return set == null ? undefined : { candidate: set, pinned: set.pinned ?? false };
        };
        // `overlaps[0]` is the unrotated answer, `overlaps[1]` the auto-rotated one.
        const overlaps = (set: { overlaps: boolean[] }, rotation: number) => set.overlaps[rotation === 0 ? 0 : 1];
        return { next, overlaps, sets };
    }

    it('walks to the first candidate whose labels do not overlap', () => {
        const { next, overlaps, sets } = candidates({ overlaps: [true] }, { overlaps: [false] }, { overlaps: [false] });
        expect(thinTickLabels(next, overlaps, true, undefined)).toEqual({ candidate: sets[1], autoRotation: 0 });
    });

    it('keeps the first candidate when collisions are not avoided', () => {
        const { next, overlaps, sets } = candidates({ overlaps: [true] }, { overlaps: [false] });
        expect(thinTickLabels(next, overlaps, false, undefined).candidate).toBe(sets[0]);
    });

    it('auto-rotates a candidate that only fits rotated', () => {
        const { next, overlaps, sets } = candidates({ overlaps: [true, false] }, { overlaps: [false, false] });
        expect(thinTickLabels(next, overlaps, true, 335)).toEqual({ candidate: sets[0], autoRotation: 335 });
    });

    it('stops at a pinned candidate even when its labels overlap', () => {
        const { next, overlaps, sets } = candidates({ overlaps: [true, true], pinned: true }, { overlaps: [false] });
        expect(thinTickLabels(next, overlaps, true, 335)).toEqual({ candidate: sets[0], autoRotation: 335 });
    });

    it('settles on the last candidate once they run out', () => {
        const { next, overlaps, sets } = candidates({ overlaps: [true] }, { overlaps: [true] });
        expect(thinTickLabels(next, overlaps, true, undefined).candidate).toBe(sets[1]);
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
