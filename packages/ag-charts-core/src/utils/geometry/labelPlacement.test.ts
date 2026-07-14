import { describe, expect, it, vi } from 'vitest';

import type { AgChartLabelOrientation } from 'ag-charts-types';

import type { Point, SizedPoint } from '../../types/scene';
import { type BoxBounds, boxCollides, boxContains } from './boxBounds';
import {
    type BarPlacedLabelDatum,
    type CollideWith,
    type LabelObstacle,
    type LabelPlacement,
    type OrientationAnchor,
    type PlacedLabel,
    type PointLabelDatum,
    applyBarLabelOrientation,
    barLabelResolvesOrientation,
    buildBarLabelDatum,
    labelGlyphCentre,
    placeLabels,
    resolveLabelFit,
} from './labelPlacement';
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

    it('centres an inside label on the point, applying no directional offset', () => {
        const datum: PointLabelDatum = {
            point: { x: 200, y: 200, size: 30 },
            label: { text: 'L', width: 40, height: 12 },
            anchor: { x: 0.5, y: 0.5 },
            placement: 'inside',
        };
        const result = placeLabels(new Map([['s', [datum]]]), bounds, 5);
        const placed = result.get('s')![0];
        expect(placed).toBeDefined();
        expect(placed.placement).toBe('inside');
        // No offset despite the 30px marker and 5px padding: the box is centred on the point.
        expect(placed.x).toBeCloseTo(200 - 40 / 2);
        expect(placed.y).toBeCloseTo(200 - 12 / 2);
    });

    it('recentres an inside label into the marker body for an offset anchor', () => {
        const datum: PointLabelDatum = {
            point: { x: 100, y: 100, size: 20 },
            label: { text: 'L', width: 10, height: 8 },
            anchor: { x: 0.5, y: 1 },
            placement: 'inside',
        };
        const result = placeLabels(new Map([['s', [datum]]]), bounds, 5);
        const placed = result.get('s')![0];
        expect(placed).toBeDefined();
        // A pin anchor (y=1) puts the point at the tip; the label centres on the body, half a diameter up.
        expect(placed.x).toBeCloseTo(100 - 10 / 2);
        expect(placed.y).toBeCloseTo(100 - 8 / 2 - (1 - 0.5) * 20);
    });

    it('lets an inside avoiding label sit over its own marker but not another', () => {
        const own: PointLabelDatum = {
            point: { x: 100, y: 100, size: 20 },
            label: { text: 'I', width: 16, height: 10 },
            anchor: { x: 0.5, y: 0.5 },
            placement: 'inside',
            placements: ['inside'],
            gap: 0,
            avoid: true,
        };
        // Its own marker is the only obstacle: the centred inside label ignores it and is placed.
        const alone = placeLabels(new Map([['s', [own]]]), bounds, 5).get('s')!;
        expect(alone.some((l) => l.datum === own)).toBe(true);

        // A second marker overlapping the centred box is a real obstacle; with no room to move, the
        // inside label drops rather than overlapping a marker that isn't its own.
        const neighbour: PointLabelDatum = {
            point: { x: 108, y: 100, size: 20 },
            label: { text: '', width: 0, height: 0 },
            anchor: undefined,
            placement: undefined,
        };
        const withNeighbour = placeLabels(new Map([['s', [own, neighbour]]]), bounds, 5).get('s')!;
        expect(withNeighbour.some((l) => l.datum === own)).toBe(false);
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

    it('routes labels around external seriesItem obstacles only when that category is enabled', () => {
        // A bar-style rect obstacle (category 'seriesItem') sits where the label's only placement lands.
        const obstacle: LabelObstacle = {
            kind: 'rect',
            box: { x: 80, y: 96, width: 60, height: 16 },
            category: 'seriesItem',
        };
        const label = (seriesItemEnabled: boolean): PointLabelDatum => ({
            point: { x: 100, y: 100, size: 0 },
            label: { text: 'X', width: 30, height: 12 },
            anchor: undefined,
            placement: 'top',
            placements: ['top'],
            gap: 0,
            avoid: true,
            collideWith: {
                marker: { enabled: true },
                label: { enabled: true },
                seriesItem: { enabled: seriesItemEnabled },
            },
        });

        const enabled = label(true);
        const disabled = label(false);
        const enabledResult = placeLabels(new Map([['s', [enabled]]]), bounds, 5, [obstacle]).get('s')!;
        const disabledResult = placeLabels(new Map([['s', [disabled]]]), bounds, 5, [obstacle]).get('s')!;
        expect(enabledResult.some((l) => l.datum === enabled)).toBe(false);
        expect(disabledResult.some((l) => l.datum === disabled)).toBe(true);
    });

    it('disabled-category obstacles do not perturb placement of other categories', () => {
        const data = makeFixture(2, 40, bounds, 12345);
        // Stamp a collideWith that disables seriesItem on every datum (matches a series that opts
        // into avoidance but not cross-series geometry).
        for (const datums of data.values()) {
            for (const d of datums) {
                (d as { collideWith?: unknown }).collideWith = {
                    marker: { enabled: true },
                    label: { enabled: true },
                    seriesItem: { enabled: false },
                };
            }
        }
        const seriesItemObstacles: LabelObstacle[] = Array.from({ length: 30 }, (_, i) => ({
            kind: 'rect',
            box: { x: (i % 6) * 90, y: Math.floor(i / 6) * 70, width: 80, height: 60 },
            category: 'seriesItem',
        }));

        const without = placeLabels(structuredClone(data), bounds, 5);
        const with_ = placeLabels(structuredClone(data), bounds, 5, seriesItemObstacles);
        expect(normalise(with_)).toEqual(normalise(without));
    });
});

describe('placeLabels orientation candidates', () => {
    const bounds: BoxBounds = { x: 0, y: 0, width: 200, height: 200 };

    const wideLabel = (
        orientation?: AgChartLabelOrientation | AgChartLabelOrientation[],
        avoid = true
    ): PointLabelDatum => ({
        point: { x: 50, y: 50, size: 0 },
        label: { text: 'W', width: 100, height: 10 },
        anchor: undefined,
        placement: undefined,
        orientation,
        gap: 0,
        avoid,
    });

    it('leaves rotation unset when no orientation is supplied', () => {
        const placed = placeLabels(new Map([['s', [wideLabel()]]]), bounds, 5).get('s')![0];
        expect(placed.rotation).toBeUndefined();
    });

    it('rotates a vertical label to fit when the horizontal box overflows the bounds', () => {
        // The 100-wide label overflows the 60-wide bounds when horizontal; when vertical it becomes
        // a 10x100 box that clears them. With no orientation it is dropped.
        const tall: BoxBounds = { x: 0, y: 0, width: 60, height: 200 };
        const overflowing = { ...wideLabel(), point: { x: 50, y: 100, size: 0 } };

        const dropped = placeLabels(new Map([['s', [overflowing]]]), tall, 5).get('s')!;
        expect(dropped.length).toBe(0);

        const rotated = placeLabels(new Map([['s', [{ ...overflowing, orientation: 'vertical' }]]]), tall, 5).get(
            's'
        )![0];
        expect(rotated).toBeDefined();
        expect(rotated.rotation).toBe(90);
        expect(rotated.width).toBe(100);
        expect(rotated.height).toBe(10);
    });

    it('tries orientations in order, choosing the first that fits', () => {
        const small: PointLabelDatum = {
            point: { x: 100, y: 100, size: 0 },
            label: { text: 'S', width: 20, height: 10 },
            anchor: undefined,
            placement: undefined,
            orientation: ['vertical', 'horizontal'],
            gap: 0,
            avoid: true,
        };
        const placed = placeLabels(new Map([['s', [small]]]), bounds, 5).get('s')![0];
        expect(placed.rotation).toBe(90);
    });

    it('blocks a later label by the rotated footprint, not the measured box', () => {
        // A vertical 100x10 label occupies a tall 10x100 footprint; a second label overlapping
        // that footprint collides, whereas it would clear the horizontal 100x10 footprint.
        const second: PointLabelDatum = {
            point: { x: 52, y: 20, size: 0 },
            label: { text: 'B', width: 10, height: 10 },
            anchor: undefined,
            placement: undefined,
            gap: 0,
            avoid: true,
        };

        const blocked = placeLabels(new Map([['s', [wideLabel('vertical'), second]]]), bounds, 5).get('s')!;
        expect(blocked.some((l) => l.datum === second)).toBe(false);

        const clear = placeLabels(new Map([['s', [wideLabel('horizontal'), second]]]), bounds, 5).get('s')!;
        expect(clear.some((l) => l.datum === second)).toBe(true);
    });

    it('adopts the first orientation candidate for an avoid:false label', () => {
        const placed = placeLabels(new Map([['s', [wideLabel('vertical', false)]]]), bounds, 5).get('s')![0];
        expect(placed.rotation).toBe(90);
        expect(placed.width).toBe(100);
        expect(placed.height).toBe(10);
    });

    it('tests containment against a per-label region, falling through when the first orientation overflows it', () => {
        // A 100x10 label in a narrow-tall region: horizontal overflows the 30-wide region, vertical
        // (10x100 footprint) fits. The shared bounds are large enough that only the region forces it.
        const region: BoxBounds = { x: 40, y: 0, width: 30, height: 200 };
        const datum: PointLabelDatum = {
            point: { x: 55, y: 100, size: 0 },
            label: { text: 'W', width: 100, height: 10 },
            anchor: undefined,
            placement: undefined,
            orientation: ['horizontal', 'vertical'],
            gap: 0,
            avoid: true,
            region,
        };

        const constrained = placeLabels(new Map([['s', [datum]]]), bounds, 5).get('s')![0];
        expect(constrained.rotation).toBe(90);

        // Without a region the horizontal box fits the shared bounds, so it stays unrotated.
        const { region: _omit, ...unconstrained } = datum;
        const free = placeLabels(new Map([['s', [unconstrained]]]), bounds, 5).get('s')![0];
        expect(free.rotation).toBeUndefined();
    });

    it('falls through orientations on collision with another label', () => {
        const labelOnly: CollideWith = {
            label: { enabled: true },
            marker: { enabled: false },
            seriesItem: { enabled: false },
        };
        // A occupies a wide flat band. B's horizontal box reaches into it, but B's vertical
        // (narrow-tall) footprint sits clear to the left, so B rotates to avoid A.
        const a: PointLabelDatum = {
            point: { x: 100, y: 100, size: 0 },
            label: { text: 'A', width: 100, height: 10 },
            anchor: undefined,
            placement: undefined,
            orientation: 'horizontal',
            gap: 0,
            avoid: true,
            collideWith: labelOnly,
        };
        const b: PointLabelDatum = {
            point: { x: 30, y: 100, size: 0 },
            label: { text: 'B', width: 60, height: 10 },
            anchor: undefined,
            placement: undefined,
            orientation: ['horizontal', 'vertical'],
            gap: 0,
            avoid: true,
            collideWith: labelOnly,
        };

        const placed = placeLabels(new Map([['s', [a, b]]]), bounds, 5).get('s')!;
        const placedB = placed.find((l) => l.datum === b);
        expect(placedB).toBeDefined();
        expect(placedB!.rotation).toBe(90);
    });
});

describe('bar label placement helpers', () => {
    describe('barLabelResolvesOrientation', () => {
        it.each([
            [undefined, false],
            ['horizontal' as const, false],
            [['horizontal'] as const, false],
            [['horizontal', 'vertical'] as const, true],
        ])('%o -> %s', (orientation, expected) => {
            expect(barLabelResolvesOrientation(orientation as any)).toBe(expected);
        });
    });

    describe('labelGlyphCentre', () => {
        // The renderer pivots rotation about this centre, so it must be invariant to text alignment:
        // every alignment of the same box maps back to the same rendered centre.
        const anchorAt = (textAlign: CanvasTextAlign, textBaseline: CanvasTextBaseline): OrientationAnchor => {
            let x = 100;
            if (textAlign === 'left' || textAlign === 'start') x = 80;
            else if (textAlign === 'right' || textAlign === 'end') x = 120;
            let y = 50;
            if (textBaseline === 'top') y = 45;
            else if (textBaseline === 'bottom') y = 55;
            return { x, y, textAlign, textBaseline };
        };

        it.each<[CanvasTextAlign, CanvasTextBaseline]>([
            ['center', 'middle'],
            ['left', 'top'],
            ['start', 'bottom'],
            ['right', 'top'],
            ['end', 'middle'],
        ])('recovers the box centre from a %s/%s anchor', (textAlign, textBaseline) => {
            const centre = labelGlyphCentre(anchorAt(textAlign, textBaseline), 40, 10);
            expect(centre).toEqual({ x: 100, y: 50 });
        });
    });

    describe('buildBarLabelDatum + applyBarLabelOrientation', () => {
        const region: BoxBounds = { x: 0, y: 0, width: 30, height: 200 };
        const anchor: OrientationAnchor = { x: 15, y: 100, textAlign: 'center', textBaseline: 'middle' };

        it('centres the candidate box, constrains it to the region, and avoids other labels only', () => {
            const target = { rotation: 0 };
            const datum = buildBarLabelDatum(anchor, 'label', 100, 10, ['horizontal', 'vertical'], region, target);
            expect(datum.point).toEqual({ x: 15, y: 100, size: 0 });
            expect(datum.region).toBe(region);
            expect(datum.avoid).toBe(true);
            expect(datum.placement).toBeUndefined();
            expect(datum.orientation).toEqual(['horizontal', 'vertical']);
            expect(datum.collideWith).toEqual({
                label: { enabled: true },
                marker: { enabled: false },
                seriesItem: { enabled: false },
            });
            expect(datum.target).toBe(target);
        });

        it('resolves the orientation through the engine and writes the rotation (radians) back to the target', () => {
            const target = { rotation: 0 };
            const datum = buildBarLabelDatum(anchor, 'label', 100, 10, ['horizontal', 'vertical'], region, target);
            const placed = placeLabels(
                new Map<string, BarPlacedLabelDatum[]>([['s', [datum]]]),
                { x: 0, y: 0, width: 200, height: 200 },
                5
            ).get('s') as PlacedLabel<BarPlacedLabelDatum>[];

            applyBarLabelOrientation(placed);
            // Horizontal (100 wide) overflows the 30-wide region, so it falls through to vertical (90deg).
            expect(target.rotation).toBeCloseTo(Math.PI / 2);
        });
    });
});

describe('resolveLabelFit', () => {
    it('returns undefined (show) when neither truncate nor collision avoidance is set', () => {
        expect(resolveLabelFit({})).toBeUndefined();
        // A bound alone does not opt in: without truncate or avoidance the full text renders.
        expect(resolveLabelFit({ maxWidth: 120, wrapping: 'on-space' })).toBeUndefined();
    });

    it('resolves truncate:true to an ellipsis overflow, honouring the explicit bound', () => {
        expect(resolveLabelFit({ maxWidth: 120, wrapping: 'on-space', truncate: true })).toEqual({
            maxWidth: 120,
            maxHeight: undefined,
            wrapping: 'on-space',
            overflowStrategy: 'ellipsis',
        });
    });

    it('resolves collision avoidance without truncate to a hide overflow', () => {
        expect(resolveLabelFit({ maxWidth: 120 }, true)).toEqual({
            maxWidth: 120,
            maxHeight: undefined,
            wrapping: undefined,
            overflowStrategy: 'hide',
        });
    });

    it('lets truncate:true win over collision avoidance', () => {
        expect(resolveLabelFit({ maxWidth: 120, truncate: true }, true)?.overflowStrategy).toBe('ellipsis');
    });
});
