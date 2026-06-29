import { describe, expect, it, vi } from 'vitest';

import type { Point, SizedPoint } from '../../types/scene';
import { type BoxBounds, boxCollides, boxContains } from './boxBounds';
import { type LabelPlacement, type PlacedLabel, type PointLabelDatum, placeLabels } from './labelPlacement';
import { SpatialIndex } from './spatialIndex';

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
                // The oracle always resolves collisions; opt every fixture datum in to match it.
                avoid: true,
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

    it.each([1, 2, 3])(
        'matches the oracle with markers only (no placed-label collisions) (%i series)',
        (seriesCount) => {
            for (let seed = 1; seed <= 5; seed++) {
                // All datums share one far-apart label position so labels never collide with each other,
                // isolating the marker-circle obstacle path in the merged index.
                const data = makeFixture(seriesCount, 30, bounds, seed * 5101);
                for (const datums of data.values()) {
                    for (const d of datums) {
                        (d.label as { width: number; height: number }).width = 1;
                        (d.label as { width: number; height: number }).height = 1;
                    }
                }
                const actual = placeLabels(data, bounds, 5);
                const expected = placeLabelsOracle(structuredClone(data), bounds, 5);
                expect(normalise(actual)).toEqual(normalise(expected));
            }
        }
    );

    it.each([1, 2, 3])('matches the oracle with labels only (no markers) (%i series)', (seriesCount) => {
        for (let seed = 1; seed <= 5; seed++) {
            // Zero-size points emit no marker obstacles, isolating the placed-label rect path.
            const data = makeFixture(seriesCount, 40, bounds, seed * 3299);
            for (const datums of data.values()) {
                for (const d of datums) {
                    (d.point as { size: number }).size = 0;
                }
            }
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

    it('falls back to the next placement when the first collides', () => {
        // Two equal markers side by side: the right marker's label, if placed centre/left, would
        // collide with the left marker, so it must fall back to 'right'.
        const left: PointLabelDatum = {
            point: { x: 100, y: 100, size: 20 },
            label: { text: 'L', width: 40, height: 12 },
            anchor: undefined,
            placement: undefined,
            avoid: true,
        };
        const right: PointLabelDatum = {
            point: { x: 130, y: 100, size: 20 },
            label: { text: 'R', width: 40, height: 12 },
            anchor: undefined,
            placement: undefined,
            placements: ['left', 'right'],
            avoid: true,
        };
        const result = placeLabels(new Map([['s', [left, right]]]), bounds, 5);
        const placed = result.get('s')!;
        const rightPlaced = placed.find((l) => l.datum === right);
        expect(rightPlaced).toBeDefined();
        expect(rightPlaced!.placement).toBe('right');
        expect(rightPlaced!.x).toBeGreaterThan(right.point.x);
    });

    it('offsets a markerless label above its point via gap', () => {
        const datum: PointLabelDatum = {
            point: { x: 200, y: 200, size: 0 },
            label: { text: 'L', width: 40, height: 12 },
            anchor: undefined,
            placement: 'top',
            gap: 4,
        };
        const result = placeLabels(new Map([['s', [datum]]]), bounds, 5);
        const placed = result.get('s')![0];
        expect(placed).toBeDefined();
        // box bottom sits gap + padding above the point: y + height = point.y - (gap + padding)
        expect(placed.y + placed.height).toBeCloseTo(200 - (4 + 5));
        expect(placed.x).toBeCloseTo(200 - 40 / 2);
    });

    it('drops an avoiding label when no candidate placement fits', () => {
        // A large marker covers every candidate position; the avoiding label has nowhere to go.
        const blocker: PointLabelDatum = {
            point: { x: 100, y: 100, size: 200 },
            label: { text: '', width: 0, height: 0 },
            anchor: undefined,
            placement: undefined,
        };
        const blocked: PointLabelDatum = {
            point: { x: 100, y: 100, size: 0 },
            label: { text: 'X', width: 30, height: 12 },
            anchor: undefined,
            placement: undefined,
            placements: ['top'],
            gap: 0,
            avoid: true,
        };
        const result = placeLabels(new Map([['s', [blocker, blocked]]]), bounds, 5);
        expect(result.get('s')!.some((l) => l.datum === blocked)).toBe(false);
    });

    it('ignores content-less labels so they neither place nor block real labels', () => {
        // Series feed a datum per point; points without label text measure to an empty box.
        // Such boxes must not be placed or treated as obstacles, or they drop real labels.
        const empty: PointLabelDatum = {
            point: { x: 200, y: 185, size: 0 },
            label: { text: '', width: 60, height: 40 },
            anchor: undefined,
            placement: undefined,
        };
        const real: PointLabelDatum = {
            point: { x: 200, y: 200, size: 0 },
            label: { text: 'Real', width: 40, height: 12 },
            anchor: undefined,
            placement: 'top',
            placements: ['top'],
            gap: 2,
        };
        const result = placeLabels(new Map([['s', [empty, real]]]), bounds, 5);
        const placed = result.get('s')!;
        expect(placed.some((l) => l.datum === empty)).toBe(false);
        const realPlaced = placed.find((l) => l.datum === real);
        expect(realPlaced).toBeDefined();
        expect(realPlaced!.placement).toBe('top');
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

    it('short-circuits empty input without building the spatial index', () => {
        // placeLabels runs on every chart update; an empty pass must not touch the index.
        const resetSpy = vi.spyOn(SpatialIndex.prototype, 'reset');
        const result = placeLabels(new Map(), bounds, 5);
        expect(result.size).toBe(0);
        expect(resetSpy).not.toHaveBeenCalled();
        resetSpy.mockRestore();
    });

    it('places avoid:false labels unconditionally, ignoring obstacles and each other', () => {
        // A huge marker would block any avoiding label, and both labels share one position. With
        // avoid:false each takes its first placement regardless and is not inserted as an obstacle.
        const marker: PointLabelDatum = {
            point: { x: 100, y: 100, size: 300 },
            label: { text: '', width: 0, height: 0 },
            anchor: undefined,
            placement: undefined,
        };
        const a: PointLabelDatum = {
            point: { x: 100, y: 100, size: 0 },
            label: { text: 'A', width: 40, height: 12 },
            anchor: undefined,
            placement: 'top',
            placements: ['top'],
            avoid: false,
        };
        const b: PointLabelDatum = {
            point: { x: 100, y: 100, size: 0 },
            label: { text: 'B', width: 40, height: 12 },
            anchor: undefined,
            placement: 'top',
            placements: ['top'],
            avoid: false,
        };
        const placed = placeLabels(new Map([['s', [marker, a, b]]]), bounds, 5).get('s')!;
        expect(placed.some((l) => l.datum === a)).toBe(true);
        expect(placed.some((l) => l.datum === b)).toBe(true);
    });

    it('places an avoid:false label with no candidate placements rather than dropping it', () => {
        // An empty `placements` list with avoidance off must still place the label (centred),
        // honouring the "avoid:false is never dropped" contract.
        const datum: PointLabelDatum = {
            point: { x: 100, y: 100, size: 0 },
            label: { text: 'X', width: 40, height: 12 },
            anchor: undefined,
            placement: 'top',
            placements: [],
            avoid: false,
        };
        const placed = placeLabels(new Map([['s', [datum]]]), bounds, 5).get('s')!;
        const result = placed.find((l) => l.datum === datum);
        expect(result).toBeDefined();
        expect(result!.placement).toBeUndefined();
        expect(result!.x).toBeCloseTo(100 - 40 / 2);
        expect(result!.y).toBeCloseTo(100 - 12 / 2);
    });

    it('skips obstacle categories disabled via collideWith', () => {
        const marker: PointLabelDatum = {
            point: { x: 100, y: 100, size: 60 },
            label: { text: '', width: 0, height: 0 },
            anchor: undefined,
            placement: undefined,
        };
        const label = (markerEnabled: boolean): PointLabelDatum => ({
            point: { x: 100, y: 100, size: 0 },
            label: { text: 'X', width: 30, height: 12 },
            anchor: undefined,
            placement: 'top',
            placements: ['top'],
            gap: 0,
            avoid: true,
            collideWith: {
                marker: { enabled: markerEnabled },
                label: { enabled: true },
                seriesItem: { enabled: true },
            },
        });

        const enabled = label(true);
        const disabled = label(false);
        const enabledResult = placeLabels(new Map([['s', [marker, enabled]]]), bounds, 5).get('s')!;
        const disabledResult = placeLabels(new Map([['s', [marker, disabled]]]), bounds, 5).get('s')!;
        expect(enabledResult.some((l) => l.datum === enabled)).toBe(false);
        expect(disabledResult.some((l) => l.datum === disabled)).toBe(true);
    });

    it('inflates obstacles by per-category minSpacing', () => {
        const marker: PointLabelDatum = {
            point: { x: 100, y: 140, size: 20 },
            label: { text: '', width: 0, height: 0 },
            anchor: undefined,
            placement: undefined,
        };
        // Sits clear of the marker by default, but collides once the marker is inflated by minSpacing.
        const label = (minSpacing: number | undefined): PointLabelDatum => ({
            point: { x: 100, y: 100, size: 0 },
            label: { text: 'X', width: 30, height: 12 },
            anchor: undefined,
            placement: 'bottom',
            placements: ['bottom'],
            gap: 0,
            avoid: true,
            collideWith: {
                marker: { enabled: true, minSpacing },
                label: { enabled: true },
                seriesItem: { enabled: true },
            },
        });

        const noInflation = label(undefined);
        const inflated = label(30);
        const noInflationResult = placeLabels(new Map([['s', [marker, noInflation]]]), bounds, 5).get('s')!;
        const inflatedResult = placeLabels(new Map([['s', [marker, inflated]]]), bounds, 5).get('s')!;
        expect(noInflationResult.some((l) => l.datum === noInflation)).toBe(true);
        expect(inflatedResult.some((l) => l.datum === inflated)).toBe(false);
    });
});
