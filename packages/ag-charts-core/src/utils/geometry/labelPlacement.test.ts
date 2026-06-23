import { describe, expect, it } from 'vitest';

import type { Point, SizedPoint } from '../../types/scene';
import { type BoxBounds, boxCollides, boxContains } from './boxBounds';
import { type LabelPlacement, type PlacedLabel, type PointLabelDatum, placeLabels } from './labelPlacement';

const PLACEMENTS: (LabelPlacement | undefined)[] = [
    undefined,
    'top',
    'bottom',
    'left',
    'right',
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
];

// Verbatim reproduction of the pre-index O(n^2) algorithm, used as a parity oracle.
const labelPlacementVectors: Record<LabelPlacement, { x: -1 | 0 | 1; y: -1 | 0 | 1 }> = {
    top: { x: 0, y: -1 },
    bottom: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    'top-left': { x: -1, y: -1 },
    'top-right': { x: 1, y: -1 },
    'bottom-left': { x: -1, y: 1 },
    'bottom-right': { x: 1, y: 1 },
};

function circleRectOverlapOracle(
    { point: c, anchor: unitCenter }: PointLabelDatum,
    x: number,
    y: number,
    w: number,
    h: number
): boolean {
    if (c.size === 0) return false;
    let cx = c.x;
    let cy = c.y;
    if (unitCenter != null) {
        cx -= (unitCenter.x - 0.5) * c.size;
        cy -= (unitCenter.y - 0.5) * c.size;
    }
    let edgeX = cx;
    if (cx < x) edgeX = x;
    else if (cx > x + w) edgeX = x + w;
    let edgeY = cy;
    if (cy < y) edgeY = y;
    else if (cy > y + h) edgeY = y + h;
    const dx = cx - edgeX;
    const dy = cy - edgeY;
    return Math.hypot(dx, dy) <= c.size / 2;
}

function placeLabelsOracle(data: Map<string, PointLabelDatum[]>, bounds: BoxBounds, padding = 5) {
    const result = new Map<string, PlacedLabel[]>();
    const previousResults: PlacedLabel[] = [];
    const sortedDataClone = new Map(
        Array.from(data.entries(), ([k, d]) => [k, d.toSorted((a, b) => b.point.size - a.point.size)])
    );
    const dataValues = [...sortedDataClone.values()].flat();
    for (const [seriesId, datums] of sortedDataClone.entries()) {
        const labels: PlacedLabel[] = [];
        if (!datums[0]?.label) continue;
        for (let index = 0, ln = datums.length; index < ln; index++) {
            const d = datums[index];
            const { point, label, anchor } = d;
            const { text, width, height } = label;
            const r = point.size / 2;
            let dx = 0;
            let dy = 0;
            if (r > 0 && d.placement != null) {
                const placement = labelPlacementVectors[d.placement];
                dx = (width / 2 + r + padding) * placement.x;
                dy = (height / 2 + r + padding) * placement.y;
            }
            let x = point.x - width / 2 + dx;
            let y = point.y - height / 2 + dy;
            if (anchor) {
                x -= (anchor.x - 0.5) * point.size;
                y -= (anchor.y - 0.5) * point.size;
            }
            if (
                boxContains(bounds, x, y, width, height) &&
                !dataValues.some((dd) => circleRectOverlapOracle(dd, x, y, width, height)) &&
                !previousResults.some((pr) => boxCollides(pr, x, y, width, height))
            ) {
                const resultDatum = { index, text, x, y, width, height, datum: d };
                labels.push(resultDatum);
                previousResults.push(resultDatum);
            }
        }
        result.set(seriesId, labels);
    }
    return result;
}

function makeFixture(seriesCount: number, perSeries: number, bounds: BoxBounds, seed0: number) {
    let seed = seed0;
    const next = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
    };
    const data = new Map<string, PointLabelDatum[]>();
    for (let s = 0; s < seriesCount; s++) {
        const datums: PointLabelDatum[] = [];
        for (let i = 0; i < perSeries; i++) {
            const size = next() < 0.2 ? 0 : next() * 30;
            const point: SizedPoint = {
                x: bounds.x + next() * bounds.width,
                y: bounds.y + next() * bounds.height,
                size,
            };
            const hasAnchor = next() < 0.4;
            const anchor: Point | undefined = hasAnchor ? { x: next(), y: next() } : undefined;
            datums.push({
                point,
                label: { text: `s${s}-${i}`, width: 10 + next() * 50, height: 8 + next() * 16 },
                anchor,
                placement: PLACEMENTS[Math.floor(next() * PLACEMENTS.length)],
            });
        }
        data.set(`series-${s}`, datums);
    }
    return data;
}

function normalise(result: Map<string, PlacedLabel[]>) {
    return [...result.entries()].map(([id, labels]) => [
        id,
        labels.map((l) => ({ index: l.index, x: l.x, y: l.y, width: l.width, height: l.height })),
    ]);
}

describe('placeLabels', () => {
    const bounds: BoxBounds = { x: -20, y: -20, width: 600, height: 400 };

    it.each([1, 2, 3])('matches the brute-force oracle (%i series)', (seriesCount) => {
        for (let seed = 1; seed <= 10; seed++) {
            const data = makeFixture(seriesCount, 40, bounds, seed * 7919);
            const actual = placeLabels(data, bounds, 5);
            const expected = placeLabelsOracle(structuredClone(data), bounds, 5);
            expect(normalise(actual)).toEqual(normalise(expected));
        }
    });

    it('produces identical results across consecutive calls (scratch reuse)', () => {
        const data = makeFixture(2, 60, bounds, 12345);
        const first = normalise(placeLabels(structuredClone(data), bounds, 5));
        const second = normalise(placeLabels(structuredClone(data), bounds, 5));
        expect(second).toEqual(first);
    });

    it('skips series whose first datum has no label, like the oracle', () => {
        const data = new Map<string, PointLabelDatum[]>([
            ['empty', []],
            [
                'present',
                [
                    {
                        point: { x: 10, y: 10, size: 0 },
                        label: { text: 'a', width: 10, height: 10 },
                        anchor: undefined,
                        placement: undefined,
                    },
                ],
            ],
        ]);
        const result = placeLabels(data, bounds, 5);
        expect(result.has('empty')).toBe(false);
        expect(result.get('present')?.length).toBe(1);
    });
});
