import { describe, expect, it, vi } from 'vitest';

import type { SizedPoint } from '../../types/scene';
import type { BoxBounds } from './boxBounds';
import { type LabelPlacement, type PointLabelDatum, type SeriesLabels, placeLabels } from './labelPlacement';

// jsdom has no canvas, so cachedTextMeasurer's real createCanvasContext throws.
vi.mock('../canvas', () => ({
    createCanvasContext: () => ({
        font: '',
        measureText(text: string) {
            return {
                width: [...text].length * 10,
                fontBoundingBoxAscent: 16,
                fontBoundingBoxDescent: 4,
                emHeightAscent: 16,
                emHeightDescent: 4,
            };
        },
    }),
}));

const PLACEMENTS: LabelPlacement[] = ['top', 'bottom', 'left', 'right', 'top-left', 'bottom-right'];

/**
 * `count` labelled markers spread over a region scaled to keep their density constant, so the only
 * thing growing between two fixtures is the label count.
 */
function densityFixture(count: number, seed0: number): { data: Map<string, SeriesLabels>; bounds: BoxBounds } {
    let seed = seed0;
    const next = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
    };
    const side = Math.ceil(Math.sqrt(count)) * 40;
    const bounds: BoxBounds = { x: 0, y: 0, width: side, height: side };
    const datums: PointLabelDatum[] = [];
    for (let i = 0; i < count; i++) {
        const point: SizedPoint = { x: next() * side, y: next() * side, size: 6 + next() * 8 };
        datums.push({
            point,
            label: { text: `label-${i}`, width: 40 + next() * 30, height: 12 },
            anchor: undefined,
            placement: undefined,
            placements: PLACEMENTS,
            alwaysShow: false,
        });
    }
    return { data: new Map([['series-0', { datums }]]), bounds };
}

/**
 * Per-label cost of one `placeLabels` call, in ms. A single call is far too short to time reliably,
 * so each sample runs the call repeatedly for a fixed budget; the cheapest sample is taken, being
 * the one least disturbed by GC and the scheduler.
 */
function perLabelCost(count: number, samples = 3, budgetMs = 60): number {
    const { data, bounds } = densityFixture(count, 7);
    placeLabels(data, bounds, 5);
    let best = Infinity;
    for (let s = 0; s < samples; s++) {
        let iterations = 0;
        const start = performance.now();
        let elapsed = 0;
        while (elapsed < budgetMs) {
            placeLabels(data, bounds, 5);
            iterations++;
            elapsed = performance.now() - start;
        }
        best = Math.min(best, elapsed / (iterations * count));
    }
    return best;
}

describe('placeLabels scaling', () => {
    // Wall-clock is noisy, so the bound is wide enough to ignore a constant-factor change and only
    // fail on a change in complexity: the spatial index is what keeps the per-label cost flat, and
    // losing it (or querying every obstacle again) turns this quadratic.
    it('keeps the per-label cost flat as the label count grows', { retry: 3 }, () => {
        const small = perLabelCost(500);
        const large = perLabelCost(4000);

        // Eight times the labels at the same density: the per-label cost is flat today, so this
        // passes with a wide margin and only fails if the cost picks up a term in the label count.
        expect(large).toBeLessThan(small * 4);
    });

    it('places the same labels however many times it runs', () => {
        const { data, bounds } = densityFixture(2000, 11);
        const first = placeLabels(data, bounds, 5);
        const second = placeLabels(data, bounds, 5);

        const flatten = (r: Map<string, ReturnType<typeof placeLabels> extends Map<string, infer T> ? T : never>) =>
            [...r.values()].flat().map((l) => `${l.index}@${l.x},${l.y}`);
        expect(flatten(second)).toEqual(flatten(first));
        // The fixture must actually exercise the index rather than trivially placing everything.
        expect(flatten(first).length).toBeGreaterThan(0);
        expect(flatten(first).length).toBeLessThan(2000);
    });
});
