import { describe, expect, it, vi } from 'vitest';

import type { AgChartLabelOrientation, PaddingOptions } from 'ag-charts-types';

import type { Point, SizedPoint } from '../../types/scene';
import { type BoxBounds, boxCollides, boxContains } from './boxBounds';
import {
    type BarLabelTarget,
    type BarPlacedLabelDatum,
    type CandidateLabelStyle,
    type CandidateStyleResolver,
    type CollideWith,
    type LabelObstacle,
    type LabelPlacement,
    type OrientationAnchor,
    type PlacedLabel,
    type PointLabelDatum,
    type PositionedLabelCandidate,
    type SeriesLabelDefaults,
    type SeriesLabels,
    applyBarLabelOrientation,
    bakedLabelObstacles,
    barLabelResolvesOrientation,
    barLabelResolvesPlacement,
    buildBarLabelDatum,
    buildBarPositionedLabelDatum,
    insideBarContainer,
    insideBarRegion,
    insideBarValueInsets,
    labelFootprintBox,
    labelGlyphCentre,
    measureLabelText,
    placeLabels,
    rectLabelObstacles,
    resolveLabelFit,
    rotatedGlyphDrift,
    rotatedLabelInset,
    sectorLabelContainer,
} from './labelPlacement';
import { SpatialIndex } from './spatialIndex';

// jsdom has no canvas, so cachedTextMeasurer's real createCanvasContext throws. This stand-in gives
// measureLabelText deterministic metrics, scaled by the measurer's font size.
const { CHAR_WIDTH, BASE_FONT_SIZE } = vi.hoisted(() => ({ CHAR_WIDTH: 10, BASE_FONT_SIZE: 12 }));
vi.mock('../canvas', () => ({
    createCanvasContext: () => ({
        font: '',
        measureText(text: string) {
            const scale = (Number.parseFloat(this.font) || BASE_FONT_SIZE) / BASE_FONT_SIZE;
            return {
                width: [...text].length * CHAR_WIDTH * scale,
                fontBoundingBoxAscent: 16 * scale,
                fontBoundingBoxDescent: 4 * scale,
                emHeightAscent: 16 * scale,
                emHeightDescent: 4 * scale,
            };
        },
    }),
}));

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

/** Wraps per-series datums (optionally with series-level collision defaults) into the engine carrier. */
function seriesLabels(datums: PointLabelDatum[], defaults?: SeriesLabelDefaults): SeriesLabels {
    return { datums, defaults };
}

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

function placeLabelsOracle(data: Map<string, SeriesLabels>, bounds: BoxBounds, padding = 5) {
    const result = new Map<string, PlacedLabel[]>();
    const previousResults: PlacedLabel[] = [];
    const sortedDataClone = new Map(
        Array.from(data.entries(), ([k, e]) => [k, e.datums.toSorted((a, b) => b.point.size - a.point.size)])
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
    const data = new Map<string, SeriesLabels>();
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
        // The oracle always resolves collisions; opt the whole series in via the series default to
        // match it, exercising the defaults path rather than per-datum stamping.
        data.set(`series-${s}`, seriesLabels(datums, { alwaysShow: false }));
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
                for (const { datums } of data.values()) {
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
            for (const { datums } of data.values()) {
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
            alwaysShow: false,
        };
        const right: PointLabelDatum = {
            point: { x: 130, y: 100, size: 20 },
            label: { text: 'R', width: 40, height: 12 },
            anchor: undefined,
            placement: undefined,
            placements: ['left', 'right'],
            alwaysShow: false,
        };
        const result = placeLabels(new Map([['s', seriesLabels([left, right])]]), bounds, 5);
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
        const result = placeLabels(new Map([['s', seriesLabels([datum])]]), bounds, 5);
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
        const result = placeLabels(new Map([['s', seriesLabels([datum])]]), bounds, 5);
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
        const result = placeLabels(new Map([['s', seriesLabels([datum])]]), bounds, 5);
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
            alwaysShow: false,
        };
        // Its own marker is the only obstacle: the centred inside label ignores it and is placed.
        const alone = placeLabels(new Map([['s', seriesLabels([own])]]), bounds, 5).get('s')!;
        expect(alone.some((l) => l.datum === own)).toBe(true);

        // A second marker overlapping the centred box is a real obstacle; with no room to move, the
        // inside label drops rather than overlapping a marker that isn't its own.
        const neighbour: PointLabelDatum = {
            point: { x: 108, y: 100, size: 20 },
            label: { text: '', width: 0, height: 0 },
            anchor: undefined,
            placement: undefined,
        };
        const withNeighbour = placeLabels(new Map([['s', seriesLabels([own, neighbour])]]), bounds, 5).get('s')!;
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
        };
        const result = placeLabels(
            new Map([['s', seriesLabels([blocker, blocked], { alwaysShow: false })]]),
            bounds,
            5
        );
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
        const result = placeLabels(new Map([['s', seriesLabels([empty, real])]]), bounds, 5);
        const placed = result.get('s')!;
        expect(placed.some((l) => l.datum === empty)).toBe(false);
        const realPlaced = placed.find((l) => l.datum === real);
        expect(realPlaced).toBeDefined();
        expect(realPlaced!.placement).toBe('top');
    });

    it('skips series whose first datum has no label, like the oracle', () => {
        const data = new Map<string, SeriesLabels>([
            ['empty', seriesLabels([])],
            [
                'present',
                seriesLabels([
                    {
                        point: { x: 10, y: 10, size: 0 },
                        label: { text: 'a', width: 10, height: 10 },
                        anchor: undefined,
                        placement: undefined,
                    },
                ]),
            ],
        ]);
        const result = placeLabels(data, bounds, 5);
        expect(result.has('empty')).toBe(false);
        expect(result.get('present')?.length).toBe(1);
    });

    it('short-circuits a label-free chart without building the spatial index', () => {
        // placeLabels runs on every chart update; a chart with no labels must not touch the index,
        // whether the map is empty or its series carry only label-less datums.
        const resetSpy = vi.spyOn(SpatialIndex.prototype, 'reset');

        expect(placeLabels(new Map(), bounds, 5).size).toBe(0);

        const labelless = new Map<string, SeriesLabels>([['s', seriesLabels([])]]);
        expect(placeLabels(labelless, bounds, 5).size).toBe(0);

        expect(resetSpy).not.toHaveBeenCalled();
        resetSpy.mockRestore();
    });

    it('takes a sole kept placement unconditionally, ignoring obstacles and each other', () => {
        // A huge marker would block any resolving label, and both labels share one position. Each has
        // a single placement it is kept at (alwaysShow), so it takes it regardless of obstacles.
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
            alwaysShow: true,
        };
        const b: PointLabelDatum = {
            point: { x: 100, y: 100, size: 0 },
            label: { text: 'B', width: 40, height: 12 },
            anchor: undefined,
            placement: 'top',
            placements: ['top'],
            alwaysShow: true,
        };
        const placed = placeLabels(new Map([['s', seriesLabels([marker, a, b])]]), bounds, 5).get('s')!;
        expect(placed.some((l) => l.datum === a)).toBe(true);
        expect(placed.some((l) => l.datum === b)).toBe(true);
    });

    it('resolves keep-series before droppable series regardless of declaration order', () => {
        // Fixed obstacles seed the index before droppable labels, so declaration order does not matter.
        const avoiding: PointLabelDatum = {
            point: { x: 200, y: 200, size: 0 },
            label: { text: 'A', width: 40, height: 12 },
            anchor: undefined,
            placement: 'top',
            placements: ['top', 'bottom'],
            gap: 10,
            alwaysShow: false,
        };
        const fixed: PointLabelDatum = {
            point: { x: 200, y: 200, size: 0 },
            label: { text: 'B', width: 40, height: 12 },
            anchor: undefined,
            placement: 'top',
            placements: ['top'],
            gap: 10,
            alwaysShow: true,
        };
        const result = placeLabels(
            new Map([
                ['avoiding', seriesLabels([avoiding])],
                ['fixed', seriesLabels([fixed])],
            ]),
            bounds,
            5
        );
        const fixedPlaced = result.get('fixed')!.find((l) => l.datum === fixed);
        const avoidingPlaced = result.get('avoiding')!.find((l) => l.datum === avoiding);
        expect(fixedPlaced).toBeDefined();
        expect(avoidingPlaced).toBeDefined();
        // The fixed label keeps its first placement above the point; the avoiding label is pushed below it.
        expect(fixedPlaced!.placement).toBe('top');
        expect(avoidingPlaced!.placement).toBe('bottom');
        expect(avoidingPlaced!.y).toBeGreaterThan(fixedPlaced!.y);
    });

    it('resolves a later fallback datum against an earlier one placed in the same series', () => {
        // The obstacle index is always built, so a first datum kept at its sole placement is a fixed
        // obstacle the second datum's fallback list must clear, even with no series `defaults`.
        const first: PointLabelDatum = {
            point: { x: 200, y: 200, size: 0 },
            label: { text: 'A', width: 40, height: 12 },
            anchor: undefined,
            placement: 'top',
            placements: ['top'],
            gap: 10,
        };
        const second: PointLabelDatum = {
            point: { x: 200, y: 200, size: 0 },
            label: { text: 'B', width: 40, height: 12 },
            anchor: undefined,
            placement: 'top',
            placements: ['top', 'bottom'],
            gap: 10,
            alwaysShow: false,
        };
        const placed = placeLabels(new Map([['s', seriesLabels([first, second])]]), bounds, 5).get('s')!;
        const firstPlaced = placed.find((l) => l.datum === first);
        const secondPlaced = placed.find((l) => l.datum === second);
        expect(firstPlaced).toBeDefined();
        expect(secondPlaced).toBeDefined();
        // The non-avoiding first label keeps 'top'; the avoiding second is pushed below it.
        expect(firstPlaced!.placement).toBe('top');
        expect(secondPlaced!.placement).toBe('bottom');
        expect(secondPlaced!.y).toBeGreaterThan(firstPlaced!.y);
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
            alwaysShow: true,
        };
        const placed = placeLabels(new Map([['s', seriesLabels([datum])]]), bounds, 5).get('s')!;
        const result = placed.find((l) => l.datum === datum);
        expect(result).toBeDefined();
        expect(result!.placement).toBeUndefined();
        expect(result!.x).toBeCloseTo(100 - 40 / 2);
        expect(result!.y).toBeCloseTo(100 - 12 / 2);
    });

    it('cascades a placement fallback list with avoidance off, mirroring line/area', () => {
        // The list is a directional fallback set, so an overflowing 'top' falls to 'bottom' regardless.
        const datum: PointLabelDatum = {
            point: { x: 100, y: 0, size: 0 },
            label: { text: 'A', width: 40, height: 12 },
            anchor: undefined,
            placement: 'top',
            gap: 10,
        };
        const defaults: SeriesLabelDefaults = { alwaysShow: true, placements: ['top', 'bottom'] };
        const placed = placeLabels(new Map([['s', seriesLabels([datum], defaults)]]), bounds, 5).get('s')!;
        const result = placed.find((l) => l.datum === datum);
        expect(result).toBeDefined();
        expect(result!.placement).toBe('bottom');
        expect(result!.y).toBeGreaterThan(0);
    });

    it('keeps the least-overflowing fallback candidate rather than dropping it when avoidance is off', () => {
        // Nothing fits the tiny region; with avoidance off the label is never dropped, so the
        // engine keeps the best candidate instead of returning undefined.
        const tiny: BoxBounds = { x: 0, y: 0, width: 10, height: 10 };
        const datum: PointLabelDatum = {
            point: { x: 5, y: 5, size: 0 },
            label: { text: 'A', width: 40, height: 12 },
            anchor: undefined,
            placement: 'top',
            placements: ['top', 'bottom'],
            gap: 10,
            alwaysShow: true,
        };
        const placed = placeLabels(new Map([['s', seriesLabels([datum])]]), tiny, 5).get('s')!;
        const result = placed.find((l) => l.datum === datum);
        expect(result).toBeDefined();
        expect(result!.placement === 'top' || result!.placement === 'bottom').toBe(true);
    });

    describe('kept candidate when every placement collides', () => {
        // The label sits at (300, 200) with a 100x20 box and a 10px gap, so its `top` candidate spans
        // x 250..350 / y 165..185 and its `left` candidate x 185..285 / y 190..210.
        const buriedDatum = (): PointLabelDatum => ({
            point: { x: 300, y: 200, size: 0 },
            label: { text: 'A', width: 100, height: 20 },
            anchor: undefined,
            placement: 'top',
            placements: ['top', 'left'],
            gap: 10,
            alwaysShow: true,
        });

        const keptPlacement = (box: BoxBounds) => {
            const datum = buriedDatum();
            const obstacle: LabelObstacle = { kind: 'rect', box, category: 'label' };
            const placed = placeLabels(new Map([['s', seriesLabels([datum])]]), bounds, 5, [obstacle]).get('s')!;
            const result = placed.find((l) => l.datum === datum);
            expect(result).toBeDefined();
            return result!.placement;
        };

        it('keeps the least buried candidate, not the first one', () => {
            // Buries `top` under the whole 100x20 box while only grazing `left` by 35x1.
            expect(keptPlacement({ x: 250, y: 165, width: 100, height: 26 })).toBe('left');
        });

        it('keeps the first candidate when it is the least buried', () => {
            // The mirror case: `left` is the deeply buried one, so the cascade stays at `top`.
            expect(keptPlacement({ x: 185, y: 184, width: 100, height: 26 })).toBe('top');
        });
    });

    it('takes a single placement unconditionally with avoidance off, even when it overflows', () => {
        // Single-candidate labels keep the fast path: the first (only) placement is used as-is,
        // never bounds-clipped and never cascaded.
        const datum: PointLabelDatum = {
            point: { x: 100, y: 0, size: 0 },
            label: { text: 'A', width: 40, height: 12 },
            anchor: undefined,
            placement: 'top',
            placements: ['top'],
            gap: 10,
            alwaysShow: true,
        };
        const placed = placeLabels(new Map([['s', seriesLabels([datum])]]), bounds, 5).get('s')!;
        const result = placed.find((l) => l.datum === datum);
        expect(result).toBeDefined();
        expect(result!.placement).toBe('top');
        expect(result!.y).toBeLessThan(bounds.y);
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
            collideWith: {
                marker: markerEnabled,
                label: true,
                seriesItem: true,
            },
        });

        const enabled = label(true);
        const disabled = label(false);
        const avoids = { alwaysShow: false };
        const enabledResult = placeLabels(new Map([['s', seriesLabels([marker, enabled], avoids)]]), bounds, 5).get(
            's'
        )!;
        const disabledResult = placeLabels(new Map([['s', seriesLabels([marker, disabled], avoids)]]), bounds, 5).get(
            's'
        )!;
        expect(enabledResult.some((l) => l.datum === enabled)).toBe(false);
        expect(disabledResult.some((l) => l.datum === disabled)).toBe(true);
    });

    // Places `label` (series 's') against `marker` (a separate series) at the given threshold.
    const placeAgainstOtherMarker = (marker: PointLabelDatum, label: PointLabelDatum, threshold: number) =>
        placeLabels(
            new Map([
                ['markers', seriesLabels([marker], { alwaysShow: false })],
                ['s', seriesLabels([label], { alwaysShow: false, threshold })],
            ]),
            bounds,
            5
        ).get('s')!;

    it('grows the collision box against another series marker by a positive threshold', () => {
        const marker: PointLabelDatum = {
            point: { x: 100, y: 140, size: 20 },
            label: { text: '', width: 0, height: 0 },
            anchor: undefined,
            placement: undefined,
        };
        // Sits clear of the other series' marker by default, but collides once the box grows by threshold.
        const label: PointLabelDatum = {
            point: { x: 100, y: 100, size: 0 },
            label: { text: 'X', width: 30, height: 12 },
            anchor: undefined,
            placement: 'bottom',
            placements: ['bottom'],
            gap: 0,
        };

        expect(placeAgainstOtherMarker(marker, label, 0).some((l) => l.datum === label)).toBe(true);
        expect(placeAgainstOtherMarker(marker, label, 30).some((l) => l.datum === label)).toBe(false);
    });

    it('inflates the collision box against a neighbouring same-series marker', () => {
        // A neighbouring point's marker in the same series is a normal obstacle (only the label's own
        // anchor marker is exempt): the threshold grows the box against it, dropping the label.
        const marker: PointLabelDatum = {
            point: { x: 100, y: 140, size: 20 },
            label: { text: '', width: 0, height: 0 },
            anchor: undefined,
            placement: undefined,
        };
        const label: PointLabelDatum = {
            point: { x: 100, y: 100, size: 0 },
            label: { text: 'X', width: 30, height: 12 },
            anchor: undefined,
            placement: 'bottom',
            placements: ['bottom'],
            gap: 0,
        };
        const result = placeLabels(
            new Map([['s', seriesLabels([marker, label], { alwaysShow: false, threshold: 30 })]]),
            bounds,
            5
        ).get('s')!;
        expect(result.some((l) => l.datum === label)).toBe(false);
    });

    it('keeps a label clear of its own anchor marker until the threshold exceeds its spacing', () => {
        // A labelled point that also renders a marker: the label sits `spacing` from that marker's edge,
        // so it is exempt from threshold inflation until the threshold demands more clearance than spacing.
        const labelled = (): PointLabelDatum => ({
            point: { x: 100, y: 100, size: 20 },
            label: { text: 'X', width: 30, height: 12 },
            anchor: undefined,
            placement: 'top',
            placements: ['top'],
            spacing: 10,
        });
        const place = (threshold: number, d: PointLabelDatum) =>
            placeLabels(new Map([['s', seriesLabels([d], { alwaysShow: false, threshold })]]), bounds, 5).get('s')!;

        const kept = labelled();
        const dropped = labelled();
        // threshold == spacing: still clear of its own marker.
        expect(place(10, kept).some((l) => l.datum === kept)).toBe(true);
        // threshold > spacing: the box reaches back onto its own marker, so the label is dropped.
        expect(place(20, dropped).some((l) => l.datum === dropped)).toBe(false);
    });

    it('measures own-marker clearance geometrically, so a diagonal keeps its longer corner gap', () => {
        // A diagonal label's corner gap is √2·(r + spacing) − r ≈ 18.3, not `spacing` = 10.
        const labelled = (placement: 'top' | 'top-right'): PointLabelDatum => ({
            point: { x: 100, y: 100, size: 20 },
            label: { text: 'X', width: 30, height: 12 },
            anchor: undefined,
            placement,
            placements: [placement],
            spacing: 10,
        });
        const place = (d: PointLabelDatum) =>
            placeLabels(new Map([['s', seriesLabels([d], { alwaysShow: false, threshold: 12 })]]), bounds, 5).get('s')!;

        const above = labelled('top');
        const diagonal = labelled('top-right');
        expect(place(above).some((l) => l.datum === above)).toBe(false);
        expect(place(diagonal).some((l) => l.datum === diagonal)).toBe(true);
    });

    it('keeps a label flush against the shared bounds at a positive threshold', () => {
        // The threshold is clearance from obstacles, not an inset on the bounds.
        const centred = (y: number): PointLabelDatum => ({
            point: { x: 100, y, size: 0 },
            label: { text: 'A', width: 40, height: 12 },
            anchor: undefined,
            placement: undefined,
        });
        const place = (d: PointLabelDatum, threshold: number) =>
            placeLabels(new Map([['s', seriesLabels([d], { alwaysShow: false, threshold })]]), bounds, 5).get('s')!;

        // Centred on its point, so the box's top edge lands exactly on `bounds.y`.
        const flush = centred(bounds.y + 6);
        expect(place(flush, 0).some((l) => l.datum === flush)).toBe(true);
        expect(place(flush, 8).some((l) => l.datum === flush)).toBe(true);
        // One pixel further out leaves the bounds, and no threshold buys it back.
        const outside = centred(bounds.y + 5);
        expect(place(outside, 0).some((l) => l.datum === outside)).toBe(false);
    });

    it('tolerates label overlap within a negative threshold', () => {
        // Two centred labels whose boxes overlap by 5px in x. The second is dropped at threshold 0, but
        // kept once a negative threshold shrinks the first label's obstacle box past the overlap.
        const first: PointLabelDatum = {
            point: { x: 100, y: 100, size: 0 },
            label: { text: 'A', width: 40, height: 12 },
            anchor: undefined,
            placement: undefined,
        };
        const second: PointLabelDatum = {
            point: { x: 135, y: 100, size: 0 },
            label: { text: 'B', width: 40, height: 12 },
            anchor: undefined,
            placement: undefined,
        };
        const place = (threshold: number) =>
            placeLabels(
                new Map([['s', seriesLabels([first, second], { alwaysShow: false, threshold })]]),
                bounds,
                5
            ).get('s')!;

        expect(place(0).some((l) => l.datum === second)).toBe(false);
        expect(place(-5).some((l) => l.datum === second)).toBe(true);
    });

    it('never triggers avoidance when a negative threshold exceeds the maximum overlap', () => {
        // Two labels stacked on the same point overlap completely; a threshold more negative than that
        // overlap shrinks the obstacle box to nothing, so the second label is always kept.
        const stacked = (text: string): PointLabelDatum => ({
            point: { x: 100, y: 100, size: 0 },
            label: { text, width: 40, height: 12 },
            anchor: undefined,
            placement: undefined,
        });
        const first = stacked('A');
        const second = stacked('B');
        const result = placeLabels(
            new Map([['s', seriesLabels([first, second], { alwaysShow: false, threshold: -50 })]]),
            bounds,
            5
        ).get('s')!;

        expect(result.some((l) => l.datum === second)).toBe(true);
    });

    it('tolerates marker overlap when a negative threshold collapses the label box', () => {
        // A negative threshold can collapse the label box, which must then clear the marker, not collide.
        const marker: PointLabelDatum = {
            point: { x: 100, y: 100, size: 16 },
            label: { text: '', width: 0, height: 0 },
            anchor: undefined,
            placement: undefined,
        };
        const label: PointLabelDatum = {
            point: { x: 100, y: 100, size: 0 },
            label: { text: 'X', width: 30, height: 12 },
            anchor: undefined,
            placement: undefined,
        };

        expect(placeAgainstOtherMarker(marker, label, 0).some((l) => l.datum === label)).toBe(false);
        expect(placeAgainstOtherMarker(marker, label, -10).some((l) => l.datum === label)).toBe(true);
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
            alwaysShow: false,
            collideWith: {
                marker: true,
                label: true,
                seriesItem: seriesItemEnabled,
            },
        });

        const enabled = label(true);
        const disabled = label(false);
        const enabledResult = placeLabels(new Map([['s', seriesLabels([enabled])]]), bounds, 5, [obstacle]).get('s')!;
        const disabledResult = placeLabels(new Map([['s', seriesLabels([disabled])]]), bounds, 5, [obstacle]).get('s')!;
        expect(enabledResult.some((l) => l.datum === enabled)).toBe(false);
        expect(disabledResult.some((l) => l.datum === disabled)).toBe(true);
    });

    it('disabled-category obstacles do not perturb placement of other categories', () => {
        const data = makeFixture(2, 40, bounds, 12345);
        // Stamp a collideWith that disables seriesItem on every datum (matches a series that opts
        // into avoidance but not cross-series geometry).
        for (const { datums } of data.values()) {
            for (const d of datums) {
                (d as { collideWith?: unknown }).collideWith = {
                    marker: true,
                    label: true,
                    seriesItem: false,
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

    it('resolves collisions from series defaults when datums carry no per-datum config', () => {
        // Neither datum sets avoid/placements; both come from the series default. Two labels share a
        // point, so with default avoidance the second must fall through default placements to 'bottom'.
        const first: PointLabelDatum = {
            point: { x: 200, y: 200, size: 0 },
            label: { text: 'A', width: 40, height: 12 },
            anchor: undefined,
            placement: undefined,
            gap: 10,
        };
        const second: PointLabelDatum = {
            point: { x: 200, y: 200, size: 0 },
            label: { text: 'B', width: 40, height: 12 },
            anchor: undefined,
            placement: undefined,
            gap: 10,
        };
        const result = placeLabels(
            new Map([['s', seriesLabels([first, second], { alwaysShow: false, placements: ['top', 'bottom'] })]]),
            bounds,
            5
        );
        const placed = result.get('s')!;
        const firstPlaced = placed.find((l) => l.datum === first);
        const secondPlaced = placed.find((l) => l.datum === second);
        expect(firstPlaced).toBeDefined();
        expect(secondPlaced).toBeDefined();
        expect(firstPlaced!.placement).toBe('top');
        expect(secondPlaced!.placement).toBe('bottom');
    });

    describe('inside placement with a marker-fit fallback list', () => {
        const insideThenDirectional: (LabelPlacement | undefined)[] = ['inside', 'top', 'bottom'];

        it('keeps a label inside when it fits the marker inscribed rect', () => {
            const datum: PointLabelDatum = {
                point: { x: 200, y: 200, size: 100 },
                label: { text: 'L', width: 40, height: 12 },
                anchor: { x: 0.5, y: 0.5 },
                placement: 'inside',
                placements: insideThenDirectional,
                insideSize: { width: 0.7, height: 0.7 },
                alwaysShow: false,
            };
            const result = placeLabels(new Map([['s', seriesLabels([datum])]]), bounds, 5);
            const placed = result.get('s')![0];
            expect(placed).toBeDefined();
            expect(placed.placement).toBe('inside');
        });

        // A large marker pushes the directional candidates clear of the centred inside box, so an
        // inside failure is isolated to the insideSize containment test rather than obstacle overlap.
        it('cascades to top when the label is too large for the marker inscribed rect', () => {
            const datum: PointLabelDatum = {
                point: { x: 200, y: 200, size: 100 },
                label: { text: 'L', width: 40, height: 12 },
                anchor: { x: 0.5, y: 0.5 },
                placement: 'inside',
                placements: insideThenDirectional,
                insideSize: { width: 0.1, height: 0.1 },
                alwaysShow: false,
            };
            const result = placeLabels(new Map([['s', seriesLabels([datum])]]), bounds, 5);
            const placed = result.get('s')![0];
            expect(placed).toBeDefined();
            expect(placed.placement).toBe('top');
            // The top box sits entirely above the point.
            expect(placed.y + placed.height).toBeLessThanOrEqual(200);
        });

        it('cascades to bottom when inside is too small and top is blocked', () => {
            const datum: PointLabelDatum = {
                point: { x: 200, y: 200, size: 100 },
                label: { text: 'L', width: 40, height: 12 },
                anchor: { x: 0.5, y: 0.5 },
                placement: 'inside',
                placements: insideThenDirectional,
                insideSize: { width: 0.1, height: 0.1 },
                alwaysShow: false,
            };
            // A marker over the top candidate box only; it clears the centred inside box and bottom box.
            const blockerAbove: PointLabelDatum = {
                point: { x: 200, y: 139, size: 20 },
                label: { text: '', width: 0, height: 0 },
                anchor: undefined,
                placement: undefined,
            };
            const result = placeLabels(new Map([['s', seriesLabels([datum, blockerAbove])]]), bounds, 5);
            const placed = result.get('s')!.find((l) => l.datum === datum);
            expect(placed).toBeDefined();
            expect(placed!.placement).toBe('bottom');
            expect(placed!.y).toBeGreaterThanOrEqual(200);
        });

        it('drops a droppable label when inside is too small and top and bottom are blocked', () => {
            const datum: PointLabelDatum = {
                point: { x: 200, y: 200, size: 100 },
                label: { text: 'L', width: 40, height: 12 },
                anchor: { x: 0.5, y: 0.5 },
                placement: 'inside',
                placements: insideThenDirectional,
                insideSize: { width: 0.1, height: 0.1 },
                alwaysShow: false,
            };
            const blockerAbove: PointLabelDatum = {
                point: { x: 200, y: 139, size: 20 },
                label: { text: '', width: 0, height: 0 },
                anchor: undefined,
                placement: undefined,
            };
            const blockerBelow: PointLabelDatum = {
                point: { x: 200, y: 261, size: 20 },
                label: { text: '', width: 0, height: 0 },
                anchor: undefined,
                placement: undefined,
            };
            const result = placeLabels(new Map([['s', seriesLabels([datum, blockerAbove, blockerBelow])]]), bounds, 5);
            const placed = result.get('s')!.find((l) => l.datum === datum);
            expect(placed).toBeUndefined();
        });

        it('holds a fitting label inside its marker at a positive threshold, and lets a negative one spill', () => {
            const datum = (width: number): PointLabelDatum => ({
                point: { x: 200, y: 200, size: 100 },
                label: { text: 'L', width, height: 12 },
                anchor: { x: 0.5, y: 0.5 },
                placement: 'inside',
                placements: insideThenDirectional,
                // 70×70 rect: a 40-wide label fits inside it, an 80-wide one overflows by 5 a side.
                insideSize: { width: 0.7, height: 0.7 },
                // Spacing ≥ threshold keeps the top fallback clear of its own marker, so any cascade
                // below is driven by the inside region, not own-marker inflation.
                spacing: 20,
                alwaysShow: false,
            });
            const place = (width: number, threshold: number) =>
                placeLabels(
                    new Map([['s', seriesLabels([datum(width)], { alwaysShow: false, threshold })]]),
                    bounds,
                    5
                ).get('s')![0];

            // A positive threshold constrains the glyph budget, not containment, so it cannot evict a
            // label that geometrically fits the shape it sits on.
            expect(place(40, 0).placement).toBe('inside');
            expect(place(40, 20).placement).toBe('inside');
            // An overflowing label cascades out, unless a negative threshold grants it that much spill.
            expect(place(80, 0).placement).toBe('top');
            expect(place(80, -10).placement).toBe('inside');
        });

        it('tests inside against the shared bounds when no insideSize is given (gating regression)', () => {
            const datum: PointLabelDatum = {
                point: { x: 200, y: 200, size: 20 },
                label: { text: 'L', width: 40, height: 12 },
                anchor: { x: 0.5, y: 0.5 },
                placement: 'inside',
                placements: insideThenDirectional,
                alwaysShow: false,
            };
            const result = placeLabels(new Map([['s', seriesLabels([datum])]]), bounds, 5);
            const placed = result.get('s')![0];
            expect(placed).toBeDefined();
            // Without insideSize the marker-fit test is inert, so inside wins as before.
            expect(placed.placement).toBe('inside');
        });
    });
});

describe('placeLabels orientation candidates', () => {
    const bounds: BoxBounds = { x: 0, y: 0, width: 200, height: 200 };

    const wideLabel = (
        orientation?: AgChartLabelOrientation | AgChartLabelOrientation[],
        alwaysShow = false
    ): PointLabelDatum => ({
        point: { x: 50, y: 50, size: 0 },
        label: { text: 'W', width: 100, height: 10 },
        anchor: undefined,
        placement: undefined,
        orientation,
        gap: 0,
        alwaysShow,
    });

    it('leaves rotation unset when no orientation is supplied', () => {
        const placed = placeLabels(new Map([['s', seriesLabels([wideLabel()])]]), bounds, 5).get('s')![0];
        expect(placed.rotation).toBeUndefined();
    });

    it('rotates a vertical label to fit when the horizontal box overflows the bounds', () => {
        // The 100-wide label overflows the 60-wide bounds when horizontal; when vertical it becomes
        // a 10x100 box that clears them. With no orientation it is dropped.
        const tall: BoxBounds = { x: 0, y: 0, width: 60, height: 200 };
        const overflowing = { ...wideLabel(), point: { x: 50, y: 100, size: 0 } };

        const dropped = placeLabels(new Map([['s', seriesLabels([overflowing])]]), tall, 5).get('s')!;
        expect(dropped.length).toBe(0);

        const rotated = placeLabels(
            new Map([['s', seriesLabels([{ ...overflowing, orientation: 'vertical' }])]]),
            tall,
            5
        ).get('s')![0];
        expect(rotated).toBeDefined();
        expect(rotated.rotation).toBe(-90);
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
            alwaysShow: false,
        };
        const placed = placeLabels(new Map([['s', seriesLabels([small])]]), bounds, 5).get('s')![0];
        expect(placed.rotation).toBe(-90);
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
            alwaysShow: false,
        };

        const blocked = placeLabels(new Map([['s', seriesLabels([wideLabel('vertical'), second])]]), bounds, 5).get(
            's'
        )!;
        expect(blocked.some((l) => l.datum === second)).toBe(false);

        const clear = placeLabels(new Map([['s', seriesLabels([wideLabel('horizontal'), second])]]), bounds, 5).get(
            's'
        )!;
        expect(clear.some((l) => l.datum === second)).toBe(true);
    });

    it('adopts the first orientation candidate for an avoid:false label', () => {
        const placed = placeLabels(new Map([['s', seriesLabels([wideLabel('vertical', true)])]]), bounds, 5).get(
            's'
        )![0];
        expect(placed.rotation).toBe(-90);
        expect(placed.width).toBe(100);
        expect(placed.height).toBe(10);
    });

    it('cascades an orientation fallback list with avoidance off, choosing the first that fits', () => {
        // A multi-entry orientation list is a fallback set even when avoidance is off: the 100-wide
        // horizontal box overflows the 60-wide bounds, so the label rotates vertical to fit.
        const tall: BoxBounds = { x: 0, y: 0, width: 60, height: 200 };
        const datum: PointLabelDatum = {
            point: { x: 50, y: 100, size: 0 },
            label: { text: 'W', width: 100, height: 10 },
            anchor: undefined,
            placement: undefined,
            orientation: ['horizontal', 'vertical'],
            gap: 0,
            alwaysShow: true,
        };
        const placed = placeLabels(new Map([['s', seriesLabels([datum])]]), tall, 5).get('s')![0];
        expect(placed).toBeDefined();
        expect(placed.rotation).toBe(-90);
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
            alwaysShow: false,
            region,
        };

        const constrained = placeLabels(new Map([['s', seriesLabels([datum])]]), bounds, 5).get('s')![0];
        expect(constrained.rotation).toBe(-90);

        // Without a region the horizontal box fits the shared bounds, so it stays unrotated.
        const { region: _omit, ...unconstrained } = datum;
        const free = placeLabels(new Map([['s', seriesLabels([unconstrained])]]), bounds, 5).get('s')![0];
        expect(free.rotation).toBeUndefined();
    });

    it('falls through orientations on collision with another label', () => {
        const labelOnly: CollideWith = {
            label: true,
            marker: false,
            seriesItem: false,
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
            alwaysShow: false,
            collideWith: labelOnly,
        };
        const b: PointLabelDatum = {
            point: { x: 30, y: 100, size: 0 },
            label: { text: 'B', width: 60, height: 10 },
            anchor: undefined,
            placement: undefined,
            orientation: ['horizontal', 'vertical'],
            gap: 0,
            alwaysShow: false,
            collideWith: labelOnly,
        };

        const placed = placeLabels(new Map([['s', seriesLabels([a, b])]]), bounds, 5).get('s')!;
        const placedB = placed.find((l) => l.datum === b);
        expect(placedB).toBeDefined();
        expect(placedB!.rotation).toBe(-90);
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

    describe('barLabelResolvesPlacement', () => {
        it.each([
            [undefined, false],
            ['inside-center' as const, false],
            [['inside-center'] as const, false],
            [['inside-center', 'outside-end'] as const, true],
        ])('%o -> %s', (placement, expected) => {
            expect(barLabelResolvesPlacement(placement as any)).toBe(expected);
        });
    });

    describe('rotatedLabelInset', () => {
        const zero = { top: 0, right: 0, bottom: 0, left: 0 };

        it('returns the facing padding unchanged when unrotated', () => {
            const padding = { top: 3, right: 4, bottom: 7, left: 9 };
            expect(rotatedLabelInset('top', 0, 20, 10, padding)).toBe(3);
            expect(rotatedLabelInset('bottom', 0, 20, 10, padding)).toBe(7);
            expect(rotatedLabelInset('left', 0, 20, 10, padding)).toBe(9);
            expect(rotatedLabelInset('right', 0, 20, 10, padding)).toBe(4);
        });

        it('reaches by the box cross-axis half-extent when rotated a quarter-turn', () => {
            // Vertical facing at ±90°: bar-facing extent is half the box WIDTH, minus the glyph half-height.
            expect(rotatedLabelInset('bottom', -Math.PI / 2, 20, 10, zero)).toBeCloseTo(5);
            expect(rotatedLabelInset('bottom', Math.PI / 2, 20, 10, zero)).toBeCloseTo(5);
            // Horizontal facing at ±90°: bar-facing extent is half the box HEIGHT, minus the glyph half-width.
            expect(rotatedLabelInset('left', Math.PI / 2, 20, 10, zero)).toBeCloseTo(-5);
        });

        it('folds the cross-axis padding into the reach and shifts by asymmetric facing padding', () => {
            // W = 20 + 8 + 2 = 30; halfExtent = 15; glyphHalf = 5; (padBottom - padTop)/2 = 0.
            expect(
                rotatedLabelInset('bottom', -Math.PI / 2, 20, 10, { top: 0, right: 2, bottom: 0, left: 8 })
            ).toBeCloseTo(10);
            // Facing padding shifts the box centre: (padBottom - padTop)/2 = (6 - 0)/2 = 3 added on.
            expect(
                rotatedLabelInset('bottom', -Math.PI / 2, 20, 10, { top: 0, right: 2, bottom: 6, left: 8 })
            ).toBeCloseTo(13);
        });
    });

    describe('rotatedGlyphDrift', () => {
        it('is zero when unrotated or when padding is symmetric', () => {
            expect(rotatedGlyphDrift(0, { top: 1, right: 2, bottom: 3, left: 4 })).toEqual({ x: 0, y: 0 });
            expect(rotatedGlyphDrift(-Math.PI / 2, { top: 5, right: 7, bottom: 5, left: 7 })).toEqual({ x: 0, y: 0 });
        });

        it('drifts by the box-centre offset carried through the rotation for asymmetric padding', () => {
            // shift = ((10-50)/2, 0) = (-20, 0); at -90° that lands the glyph at (-20, -20) off the anchor.
            const drift = rotatedGlyphDrift(-Math.PI / 2, { top: 0, right: 10, bottom: 0, left: 50 });
            expect(drift.x).toBeCloseTo(-20);
            expect(drift.y).toBeCloseTo(-20);
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

    describe('labelFootprintBox', () => {
        const anchor: OrientationAnchor = { x: 100, y: 50, textAlign: 'center', textBaseline: 'middle' };
        const padding: Required<PaddingOptions> = { top: 3, bottom: 3, left: 4, right: 4 };

        it('is the exact padded box, centred on the glyph, when unrotated', () => {
            // Glyph 40x10 centred at (100, 50); box grows by padding to 48x16, still centred.
            expect(labelFootprintBox(anchor, 40, 10, padding, 0)).toEqual({ x: 76, y: 42, width: 48, height: 16 });
        });

        it('offsets the centre by asymmetric padding', () => {
            const asym: Required<PaddingOptions> = { top: 0, bottom: 10, left: 0, right: 20 };
            // Box 60x20; centre shifts by ((20-0)/2, (10-0)/2) = (10, 5) to (110, 55).
            expect(labelFootprintBox(anchor, 40, 10, asym, 0)).toEqual({ x: 80, y: 45, width: 60, height: 20 });
        });

        it('returns the rotated outer AABB, swapping extents at a quarter turn', () => {
            // 48x16 box rotated -90deg → 16x48 AABB, centred on the glyph.
            const box = labelFootprintBox(anchor, 40, 10, padding, -Math.PI / 2);
            expect(box.width).toBeCloseTo(16);
            expect(box.height).toBeCloseTo(48);
            expect(box.x + box.width / 2).toBeCloseTo(100);
            expect(box.y + box.height / 2).toBeCloseTo(50);
        });
    });

    describe('bakedLabelObstacles', () => {
        const config = { fontSize: 12, fontFamily: 'sans-serif' };
        const box: Required<PaddingOptions> = { top: 3, bottom: 3, left: 4, right: 4 };
        const anchor: OrientationAnchor = { x: 100, y: 50, textAlign: 'center', textBaseline: 'middle' };
        const bake = (text: string, rotation = 0, hidden?: boolean) => ({
            label: { ...anchor, text, rotation, hidden },
        });

        it('builds one label rect obstacle per element, matching labelFootprintBox', () => {
            const result = bakedLabelObstacles([bake('Hello')], (e) => ({ label: e.label, config, box }));
            expect(result).toHaveLength(1);
            const { width, height } = measureLabelText('Hello', config);
            expect(result![0]).toEqual({
                kind: 'rect',
                box: labelFootprintBox(anchor, width, height, box, 0),
                category: 'label',
            });
        });

        it('skips absent, empty-text and hidden labels', () => {
            const elements = [bake('kept'), { label: undefined }, bake(''), bake('gone', 0, true)];
            const result = bakedLabelObstacles(elements, (e) => ({ label: e.label, config, box }));
            expect(result).toHaveLength(1);
        });

        it('returns undefined when nothing is contributed', () => {
            expect(bakedLabelObstacles(undefined, () => undefined)).toBeUndefined();
            expect(bakedLabelObstacles([bake('')], (e) => ({ label: e.label, config, box }))).toBeUndefined();
        });
    });

    describe('rectLabelObstacles', () => {
        it('maps rect node data to seriesItem rect obstacles', () => {
            const result = rectLabelObstacles([
                { x: 0, y: 10, width: 20, height: 30 },
                { x: 50, y: 5, width: 15, height: 25 },
            ]);
            expect(result).toEqual([
                { kind: 'rect', box: { x: 0, y: 10, width: 20, height: 30 }, category: 'seriesItem' },
                { kind: 'rect', box: { x: 50, y: 5, width: 15, height: 25 }, category: 'seriesItem' },
            ]);
        });

        it('skips phantom nodes', () => {
            const result = rectLabelObstacles([
                { x: 0, y: 0, width: 10, height: 10, phantom: true },
                { x: 0, y: 0, width: 10, height: 10, phantom: false },
            ]);
            expect(result).toEqual([
                { kind: 'rect', box: { x: 0, y: 0, width: 10, height: 10 }, category: 'seriesItem' },
            ]);
        });

        it('skips zero-area rects', () => {
            const result = rectLabelObstacles([
                { x: 0, y: 0, width: 0, height: 10 },
                { x: 0, y: 0, width: 10, height: 0 },
                { x: 0, y: 0, width: 10, height: 10 },
            ]);
            expect(result).toEqual([
                { kind: 'rect', box: { x: 0, y: 0, width: 10, height: 10 }, category: 'seriesItem' },
            ]);
        });

        it('returns undefined when there is nothing to contribute', () => {
            expect(rectLabelObstacles(undefined)).toBeUndefined();
            expect(rectLabelObstacles([])).toBeUndefined();
            expect(rectLabelObstacles([{ x: 0, y: 0, width: 0, height: 0, phantom: true }])).toBeUndefined();
        });
    });

    describe('insideBarValueInsets', () => {
        it('reserves nothing on the value axis for a centred label', () => {
            expect(insideBarValueInsets('center', true, true, 5)).toEqual({ min: 0, max: 0 });
            expect(insideBarValueInsets('center', false, false, 5)).toEqual({ min: 0, max: 0 });
        });

        it('reserves the gap on the value-origin end for inside-start, flipping with bar direction', () => {
            // vertical: the origin sits at the max side for an upward bar, the min side for a downward one.
            expect(insideBarValueInsets('start', true, true, 5)).toEqual({ min: 0, max: 5 });
            expect(insideBarValueInsets('start', false, true, 5)).toEqual({ min: 5, max: 0 });
            // horizontal: the origin sits at the min side for a positive bar, the max side for a negative one.
            expect(insideBarValueInsets('start', true, false, 5)).toEqual({ min: 5, max: 0 });
            expect(insideBarValueInsets('start', false, false, 5)).toEqual({ min: 0, max: 5 });
        });

        it('reserves the gap on the far end for inside-end (opposite of inside-start)', () => {
            expect(insideBarValueInsets('end', true, true, 5)).toEqual({ min: 5, max: 0 });
            expect(insideBarValueInsets('end', true, false, 5)).toEqual({ min: 0, max: 5 });
        });
    });

    describe('insideBarRegion', () => {
        const rect: BoxBounds = { x: 10, y: 20, width: 40, height: 200 };

        it('insets a vertical bar by the value insets on Y (length) and spans its full width', () => {
            expect(insideBarRegion(rect, 5, 3, true)).toEqual({ x: 10, y: 25, width: 40, height: 192 });
        });

        it('insets a horizontal bar by the value insets on X (length) and spans its full height', () => {
            expect(insideBarRegion(rect, 5, 3, false)).toEqual({ x: 15, y: 20, width: 32, height: 200 });
        });

        it('reserves the gap on a single value end when only one inset is set', () => {
            expect(insideBarRegion(rect, 5, 0, true)).toEqual({ x: 10, y: 25, width: 40, height: 195 });
            expect(insideBarRegion(rect, 0, 5, true)).toEqual({ x: 10, y: 20, width: 40, height: 195 });
        });

        it('leaves the whole rect flush when every inset is zero', () => {
            expect(insideBarRegion(rect, 0, 0, true)).toEqual(rect);
            expect(insideBarRegion(rect, 0, 0, false)).toEqual(rect);
        });
    });

    describe('insideBarContainer', () => {
        const region: BoxBounds = { x: 12, y: 25, width: 36, height: 192 };
        const box: Required<PaddingOptions> = { top: 1, bottom: 2, left: 3, right: 4 };

        it('shrinks the region by the drawn box on each side', () => {
            expect(insideBarContainer(region, box)).toEqual({ width: 29, height: 189 });
        });

        it('clamps to zero rather than returning negative room', () => {
            const tiny: BoxBounds = { x: 0, y: 0, width: 4, height: 4 };
            expect(insideBarContainer(tiny, box)).toEqual({ width: 0, height: 1 });
        });
    });

    describe('buildBarLabelDatum + applyBarLabelOrientation', () => {
        const region: BoxBounds = { x: 0, y: 0, width: 30, height: 200 };
        const anchor: OrientationAnchor = { x: 15, y: 100, textAlign: 'center', textBaseline: 'middle' };
        const collideWith = { marker: true, label: true, seriesItem: true, seriesArea: true };

        it('centres the candidate box, constrains it to the region, and stamps the resolved collideWith', () => {
            const target = { rotation: 0 };
            const datum = buildBarLabelDatum(
                anchor,
                'label',
                100,
                10,
                ['horizontal', 'vertical'],
                region,
                collideWith,
                0,
                target
            );
            expect(datum.point).toEqual({ x: 15, y: 100, size: 0 });
            expect(datum.region).toBe(region);
            // The region doubles as the own-shape box so an inside label excludes its own bar.
            expect(datum.ownBox).toBe(region);
            expect(datum.neverDrop).toBe(true);
            expect(datum.placement).toBeUndefined();
            expect(datum.orientation).toEqual(['horizontal', 'vertical']);
            expect(datum.collideWith).toBe(collideWith);
            expect(datum.target).toBe(target);
        });

        it('resolves the orientation through the engine and writes the rotation (radians) back to the target', () => {
            const target = { rotation: 0 };
            const datum = buildBarLabelDatum(
                anchor,
                'label',
                100,
                10,
                ['horizontal', 'vertical'],
                region,
                collideWith,
                0,
                target
            );
            const placed = placeLabels(
                new Map([['s', seriesLabels([datum])]]),
                { x: 0, y: 0, width: 200, height: 200 },
                5
            ).get('s') as PlacedLabel<BarPlacedLabelDatum>[];

            applyBarLabelOrientation(placed);
            // Horizontal (100 wide) overflows the 30-wide region, so it falls through to vertical (-90deg).
            expect(target.rotation).toBeCloseTo(-Math.PI / 2);
        });

        it('excludes any-category obstacle overlapping the own box on the compass path', () => {
            // The own-shape exclusion is category-agnostic, so an obstacle inside the own box is ignored.
            const wideRegion: BoxBounds = { x: 0, y: 0, width: 200, height: 200 };
            const centred: OrientationAnchor = { x: 100, y: 100, textAlign: 'center', textBaseline: 'middle' };
            const target = { rotation: 0 };
            const datum = buildBarLabelDatum(
                centred,
                'label',
                100,
                10,
                ['horizontal', 'vertical'],
                wideRegion,
                collideWith,
                0,
                target
            );
            const marker: LabelObstacle = {
                kind: 'circle',
                box: { x: 70, y: 70, width: 60, height: 60 },
                cx: 100,
                cy: 100,
                r: 30,
                category: 'marker',
            };
            const placed = placeLabels(
                new Map([['s', seriesLabels([datum])]]),
                { x: 0, y: 0, width: 200, height: 200 },
                5,
                [marker]
            ).get('s') as PlacedLabel<BarPlacedLabelDatum>[];

            applyBarLabelOrientation(placed);
            expect(target.rotation).toBe(0);
        });
    });
});

describe('placeLabels positioned candidates', () => {
    const bounds: BoxBounds = { x: 0, y: 0, width: 200, height: 200 };
    const anchorOf = (x: number, y: number): OrientationAnchor => ({
        x,
        y,
        textAlign: 'center',
        textBaseline: 'middle',
    });
    // A bar-family positioned candidate: the generic engine box plus the anchor/placement written back.
    type BarCandidate = PositionedLabelCandidate & { anchor: OrientationAnchor; placement: string };

    // A zero-size default own box never intersects any obstacle, so the own-bar exclusion is inert
    // unless a test opts in with a real rect.
    const place = (
        candidates: BarCandidate[],
        obstacles: LabelObstacle[] = [],
        ownBox: BoxBounds = { x: 0, y: 0, width: 0, height: 0 },
        alwaysShow = true,
        collideWith = { marker: true, label: true, seriesItem: true, seriesArea: true }
    ) => {
        const target: BarLabelTarget = { rotation: 0 };
        const datum = buildBarPositionedLabelDatum(
            'label',
            20,
            10,
            candidates,
            target,
            ownBox,
            alwaysShow,
            collideWith
        );
        const placed = placeLabels(new Map([['s', seriesLabels([datum])]]), bounds, 5, obstacles).get(
            's'
        ) as PlacedLabel[];
        return { placed, target };
    };

    const seriesItemRect = (box: BoxBounds): LabelObstacle => ({ kind: 'rect', box, category: 'seriesItem' });

    it('returns the first candidate that fits its region', () => {
        const first: BarCandidate = {
            box: { x: 10, y: 10, width: 20, height: 10 },
            region: bounds,
            anchor: anchorOf(20, 15),
            placement: 'inside-center',
        };
        const second: BarCandidate = {
            box: { x: 60, y: 60, width: 20, height: 10 },
            region: bounds,
            anchor: anchorOf(70, 65),
            placement: 'outside-end',
        };
        const { placed } = place([first, second]);
        expect(placed).toHaveLength(1);
        expect(placed[0].candidate).toBe(first);
        expect(placed[0].x).toBeCloseTo(10);
        expect(placed[0].y).toBeCloseTo(10);
    });

    it('skips a candidate that overflows its own region and takes the next that fits', () => {
        const tooWide: BarCandidate = {
            box: { x: 10, y: 10, width: 100, height: 10 },
            region: { x: 0, y: 0, width: 40, height: 200 },
            anchor: anchorOf(60, 15),
            placement: 'inside-center',
        };
        const fits: BarCandidate = {
            box: { x: 10, y: 40, width: 20, height: 10 },
            region: bounds,
            anchor: anchorOf(20, 45),
            placement: 'outside-end',
        };
        const { placed } = place([tooWide, fits]);
        expect(placed[0].candidate).toBe(fits);
    });

    it('skips a candidate an obstacle overlaps and takes the next clear one', () => {
        const blocked: BarCandidate = {
            box: { x: 10, y: 10, width: 20, height: 10 },
            region: bounds,
            anchor: anchorOf(20, 15),
            placement: 'inside-center',
        };
        const clear: BarCandidate = {
            box: { x: 100, y: 100, width: 20, height: 10 },
            region: bounds,
            anchor: anchorOf(110, 105),
            placement: 'outside-end',
        };
        // Bar labels avoid other labels only, so the obstacle must be a `label` to block them.
        const obstacle: LabelObstacle = { kind: 'rect', box: { x: 5, y: 5, width: 30, height: 20 }, category: 'label' };
        const { placed } = place([blocked, clear], [obstacle]);
        expect(placed[0].candidate).toBe(clear);
    });

    it('keeps the least region-overflowing candidate when none fits (neverDrop)', () => {
        const bigOverflow: BarCandidate = {
            box: { x: 0, y: 0, width: 100, height: 10 },
            region: { x: 0, y: 0, width: 20, height: 200 },
            anchor: anchorOf(50, 5),
            placement: 'inside-center',
        };
        const smallOverflow: BarCandidate = {
            box: { x: 0, y: 0, width: 30, height: 10 },
            region: { x: 0, y: 0, width: 20, height: 200 },
            anchor: anchorOf(15, 5),
            placement: 'outside-end',
        };
        const { placed } = place([bigOverflow, smallOverflow]);
        expect(placed).toHaveLength(1);
        expect(placed[0].candidate).toBe(smallOverflow);
    });

    it('slides a region-bound candidate flush and records the offset; a region-less one floats', () => {
        const inside: BarCandidate = {
            box: { x: -10, y: 50, width: 20, height: 10 },
            region: bounds,
            anchor: anchorOf(0, 55),
            placement: 'inside-center',
        };
        const insideResult = place([inside]);
        expect(insideResult.placed[0].offsetX).toBeCloseTo(10);
        expect(insideResult.placed[0].x).toBeCloseTo(0);

        const outside: BarCandidate = {
            box: { x: -10, y: 50, width: 20, height: 10 },
            anchor: anchorOf(0, 55),
            placement: 'outside-end',
        };
        const outsideResult = place([outside]);
        expect(outsideResult.placed[0].offsetX).toBe(0);
        expect(outsideResult.placed[0].x).toBeCloseTo(-10);
    });

    it('reports the chosen candidate identity and its rotation in degrees', () => {
        const rotated: BarCandidate = {
            box: { x: 10, y: 10, width: 10, height: 20 },
            region: bounds,
            rotation: 90,
            anchor: anchorOf(15, 20),
            placement: 'inside-center',
        };
        const { placed } = place([rotated]);
        expect(placed[0].candidate).toBe(rotated);
        expect(placed[0].rotation).toBe(90);
    });

    it('writes the chosen candidate anchor, placement and rotation (radians) back to the target', () => {
        const chosen: BarCandidate = {
            box: { x: 10, y: 10, width: 20, height: 10 },
            region: bounds,
            rotation: 90,
            anchor: { x: 25, y: 40, textAlign: 'left', textBaseline: 'top' },
            placement: 'outside-end',
        };
        const { placed, target } = place([chosen]);
        applyBarLabelOrientation(placed);
        expect(target.rotation).toBeCloseTo(Math.PI / 2);
        expect(target).toMatchObject({
            x: 25,
            y: 40,
            textAlign: 'left',
            textBaseline: 'top',
            placement: 'outside-end',
        });
    });

    describe('neighbouring-bar collision', () => {
        it('falls through a candidate that lands on a neighbouring bar in another column', () => {
            const ownBar = { x: 40, y: 60, width: 30, height: 80 };
            const neighbourBar = { x: 120, y: 60, width: 30, height: 80 };
            const beside: BarCandidate = {
                box: { x: 118, y: 90, width: 28, height: 16 }, // sits on the neighbour bar
                region: bounds,
                anchor: anchorOf(132, 98),
                placement: 'beside-after-center',
            };
            const inside: BarCandidate = {
                box: { x: 42, y: 90, width: 26, height: 16 }, // inside the own bar
                region: bounds,
                anchor: anchorOf(55, 98),
                placement: 'inside-center',
            };
            const { placed } = place([beside, inside], [seriesItemRect(ownBar), seriesItemRect(neighbourBar)], ownBar);
            expect(placed[0].candidate).toBe(inside);
        });

        it('never collides with its own bar or an identical stacked sibling', () => {
            const ownColumn = { x: 40, y: 40, width: 30, height: 120 };
            // A same-sign stacked sibling shares the identical full-column obstacle box.
            const sibling = { ...ownColumn };
            const insideOwn: BarCandidate = {
                box: { x: 44, y: 80, width: 22, height: 16 },
                region: bounds,
                anchor: anchorOf(55, 88),
                placement: 'inside-center',
            };
            const elsewhere: BarCandidate = {
                box: { x: 120, y: 80, width: 22, height: 16 },
                region: bounds,
                anchor: anchorOf(131, 88),
                placement: 'outside-end',
            };
            const { placed } = place(
                [insideOwn, elsewhere],
                [seriesItemRect(ownColumn), seriesItemRect(sibling)],
                ownColumn
            );
            expect(placed[0].candidate).toBe(insideOwn);
        });

        it('excludes a grouped:false behind-bar overlapping its own bar (geometric, not exact match)', () => {
            const frontBar = { x: 40, y: 40, width: 30, height: 120 };
            // grouped:false draws a different series in the same band: overlapping in area but a
            // different height, so exact box-value matching would miss it.
            const behindBar = { x: 40, y: 70, width: 30, height: 90 };
            const insideFront: BarCandidate = {
                box: { x: 44, y: 100, width: 22, height: 16 },
                region: bounds,
                anchor: anchorOf(55, 108),
                placement: 'inside-center',
            };
            const elsewhere: BarCandidate = {
                box: { x: 120, y: 100, width: 22, height: 16 },
                region: bounds,
                anchor: anchorOf(131, 108),
                placement: 'outside-end',
            };
            const { placed } = place(
                [insideFront, elsewhere],
                [seriesItemRect(frontBar), seriesItemRect(behindBar)],
                frontBar
            );
            expect(placed[0].candidate).toBe(insideFront);
        });
    });

    describe('hideable (alwaysShow: false)', () => {
        // Wider than its region on the cross axis, so no amount of sliding can contain the padded box.
        const overflowingCandidate = (): BarCandidate => ({
            box: { x: 180, y: 90, width: 40, height: 16 },
            region: { x: 180, y: 80, width: 30, height: 40 },
            anchor: anchorOf(200, 98),
            placement: 'inside-center',
        });

        it('drops a sole candidate whose box overflows its region', () => {
            const { placed } = place([overflowingCandidate()], [], { x: 0, y: 0, width: 0, height: 0 }, false);
            expect(placed).toHaveLength(0);
        });

        it('keeps that same overflowing candidate when not hideable (least overflow)', () => {
            const overflowing = overflowingCandidate();
            const { placed } = place([overflowing]);
            expect(placed).toHaveLength(1);
            expect(placed[0].candidate).toBe(overflowing);
        });

        it('drops a sole candidate landing on a neighbouring bar', () => {
            const ownBar = { x: 40, y: 60, width: 30, height: 80 };
            const neighbourBar = { x: 120, y: 60, width: 30, height: 80 };
            const beside: BarCandidate = {
                box: { x: 118, y: 90, width: 28, height: 16 }, // sits on the neighbour bar
                region: bounds,
                anchor: anchorOf(132, 98),
                placement: 'beside-after-center',
            };
            const { placed } = place([beside], [seriesItemRect(ownBar), seriesItemRect(neighbourBar)], ownBar, false);
            expect(placed).toHaveLength(0);
        });

        it('keeps a sole candidate over its own bar (own-box exclusion)', () => {
            const ownBar = { x: 40, y: 60, width: 30, height: 80 };
            const inside: BarCandidate = {
                box: { x: 42, y: 90, width: 26, height: 16 }, // inside the own bar
                region: bounds,
                anchor: anchorOf(55, 98),
                placement: 'inside-center',
            };
            const { placed } = place([inside], [seriesItemRect(ownBar)], ownBar, false);
            expect(placed).toHaveLength(1);
            expect(placed[0].candidate).toBe(inside);
        });
    });
});

describe('resolveLabelFit', () => {
    it('returns undefined (show) when there is no overflow strategy and no wrapping', () => {
        expect(resolveLabelFit({})).toBeUndefined();
        // A bound alone does not opt in: without truncate, hide or wrapping the full text renders.
        expect(resolveLabelFit({ maxWidth: 120 })).toBeUndefined();
        expect(resolveLabelFit({ maxWidth: 120, maxHeight: 40 })).toBeUndefined();
    });

    it('activates a fit for wrapping alone, decoupled from any overflow strategy', () => {
        expect(resolveLabelFit({ maxWidth: 120, wrapping: 'on-space' })).toEqual({
            maxWidth: 120,
            maxHeight: undefined,
            wrapping: 'on-space',
            overflowStrategy: undefined,
        });
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

describe('sectorLabelContainer', () => {
    const anchorAt = (radius: number, angle: number) => ({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
    const cornersOf = (anchor: Point, box: { width: number; height: number }) => {
        const hw = box.width / 2;
        const hh = box.height / 2;
        return [
            { x: anchor.x - hw, y: anchor.y - hh },
            { x: anchor.x + hw, y: anchor.y - hh },
            { x: anchor.x + hw, y: anchor.y + hh },
            { x: anchor.x - hw, y: anchor.y + hh },
        ];
    };
    const contained = (
        p: Point,
        s: { startAngle: number; endAngle: number; innerRadius: number; outerRadius: number }
    ) => {
        const r = Math.hypot(p.x, p.y);
        const a = Math.atan2(p.y, p.x);
        return (
            r >= s.innerRadius - 1e-6 && r <= s.outerRadius + 1e-6 && a >= s.startAngle - 1e-6 && a <= s.endAngle + 1e-6
        );
    };

    // The (anchor-centred) box must sit wholly inside the wedge at every orientation, so a fitted label placed
    // within it can never spill past the arc or the straight edges into a neighbouring sector.
    it.each([0, Math.PI / 6, Math.PI / 4, Math.PI / 3, Math.PI / 2 - 0.05])(
        'keeps every corner inside the wedge at mid-angle %f',
        (midAngle) => {
            const halfSpan = Math.PI / 6;
            const sector = {
                startAngle: midAngle - halfSpan,
                endAngle: midAngle + halfSpan,
                innerRadius: 40,
                outerRadius: 120,
            };
            const anchor = anchorAt(85, midAngle);
            const box = sectorLabelContainer(anchor, sector, 14);
            expect(box.width).toBeGreaterThan(0);
            expect(box.height).toBeGreaterThan(0);
            for (const corner of cornersOf(anchor, box)) {
                expect(contained(corner, sector)).toBe(true);
            }
        }
    );

    it('offers a narrower box in a thinner wedge', () => {
        // At mid-angle π/2 the label sits at the top of the circle, so the straight edges bound its width.
        const mid = Math.PI / 2;
        const anchor = anchorAt(85, mid);
        const wide = sectorLabelContainer(
            anchor,
            { startAngle: mid - Math.PI / 4, endAngle: mid + Math.PI / 4, innerRadius: 0, outerRadius: 120 },
            14
        );
        const thin = sectorLabelContainer(
            anchor,
            { startAngle: mid - Math.PI / 12, endAngle: mid + Math.PI / 12, innerRadius: 0, outerRadius: 120 },
            14
        );
        expect(thin.width).toBeLessThan(wide.width);
    });

    it('returns an empty box at the centre', () => {
        const box = sectorLabelContainer(
            { x: 0, y: 0 },
            { startAngle: 0, endAngle: Math.PI / 2, innerRadius: 0, outerRadius: 120 },
            14
        );
        expect(box).toEqual({ width: 0, height: 0 });
    });
});

// Text is refitted per candidate, so an earlier candidate's truncation cannot disqualify a later one.
// The mocked measurer makes each character 10px wide and every line 20px tall.
describe('placeLabels per-candidate fit', () => {
    const bounds: BoxBounds = { x: 0, y: 0, width: 400, height: 400 };
    const FONT = { fontSize: 12, fontFamily: 'sans-serif' };
    const TEXT = 'WWWWW';

    /** A `TEXT` label centred in `region`, cascading through `orientation`, refitted per candidate. */
    const fittedLabel = (region: BoxBounds, overrides: Partial<PointLabelDatum> = {}): PointLabelDatum => ({
        point: { x: region.x + region.width / 2, y: region.y + region.height / 2, size: 0 },
        label: { text: TEXT, width: 50, height: 20 },
        fit: { text: TEXT, policy: { overflowStrategy: 'ellipsis' }, font: FONT },
        anchor: undefined,
        placement: undefined,
        orientation: ['horizontal', 'vertical'],
        gap: 0,
        region,
        alwaysShow: true,
        ...overrides,
    });

    const placeOne = (datum: PointLabelDatum, obstacles: LabelObstacle[] = []) =>
        placeLabels(new Map([['s', seriesLabels([datum])]]), bounds, 0, obstacles).get('s')![0];

    it('prefers a later untruncated candidate over an earlier truncated one', () => {
        // 34px of width truncates the horizontal candidate to 'WW…'; rotated, the label measures against
        // the region's 200px height instead and holds the whole text.
        const placed = placeOne(fittedLabel({ x: 0, y: 0, width: 34, height: 200 }));
        expect(placed.text).toBe(TEXT);
        expect(placed.rotation).toBe(-90);
    });

    it('keeps the least-truncated candidate when every candidate truncates', () => {
        // Horizontal fits 34px of text ('WW…'), vertical 44px ('WWW…'); neither holds all five characters.
        const placed = placeOne(fittedLabel({ x: 0, y: 0, width: 34, height: 44 }));
        expect(placed.text).toBe('WWW…');
        expect(placed.rotation).toBe(-90);
    });

    it('resolves equally-truncated candidates in cascade order', () => {
        const placed = placeOne(fittedLabel({ x: 0, y: 0, width: 34, height: 34 }));
        expect(placed.text).toBe('WW…');
        expect(placed.rotation).toBeUndefined();
    });

    it('does not let an obstacle-blocked untruncated candidate pre-empt a clear truncated one', () => {
        // 60px of width holds the whole text horizontally, so that candidate wins outright; an obstacle over
        // its (wider) box leaves only the vertical candidate, which the 34px height truncates. The obstacle
        // reaches far enough in that shrinking the horizontal candidate clear of it would cost more text
        // than rotating does.
        const region = { x: 0, y: 0, width: 60, height: 34 };
        const blocker: LabelObstacle = { kind: 'rect', box: { x: 0, y: 7, width: 20, height: 20 }, category: 'label' };
        expect(placeOne(fittedLabel(region)).rotation).toBeUndefined();

        const blocked = placeOne(fittedLabel(region), [blocker]);
        expect(blocked.rotation).toBe(-90);
        expect(blocked.text).toBe('WW…');
    });

    it('leaves the text unfitted when the datum carries no fit descriptor', () => {
        const region = { x: 0, y: 0, width: 34, height: 200 };
        const placed = placeOne(fittedLabel(region, { fit: undefined }));
        expect(placed.text).toBe(TEXT);
        expect(placed.width).toBe(50);
        expect(placed.height).toBe(20);
    });

    it('bounds an unregioned label by the fit policy alone', () => {
        const placed = placeOne(
            fittedLabel(
                { x: 0, y: 0, width: 400, height: 400 },
                {
                    region: undefined,
                    fit: { text: TEXT, policy: { maxWidth: 34, overflowStrategy: 'ellipsis' }, font: FONT },
                }
            )
        );
        expect(placed.text).toBe('WW…');
    });

    it('drops a sole-candidate label whose fit policy hides the text', () => {
        // `overflowStrategy: 'hide'` empties the text instead of truncating it, and one placement leaves
        // nowhere else to try; rendering the unfitted text would defeat the policy.
        const placed = placeOne(
            fittedLabel(
                { x: 0, y: 0, width: 34, height: 34 },
                {
                    orientation: 'horizontal',
                    fit: { text: TEXT, policy: { overflowStrategy: 'hide' }, font: FONT },
                }
            )
        );
        expect(placed).toBeUndefined();
    });

    describe('positioned candidates', () => {
        const target = (): BarLabelTarget => ({ rotation: 0 });
        const anchor: OrientationAnchor = { x: 50, y: 50, textAlign: 'center', textBaseline: 'middle' };
        const padding = { top: 0, right: 0, bottom: 0, left: 0 };

        /** Two candidates at the same anchor: a narrow first one and an unbounded (floating) fallback. */
        const candidates = (firstContainerWidth: number): PositionedLabelCandidate[] => [
            {
                box: { x: 25, y: 40, width: 50, height: 20 },
                region: { x: 20, y: 20, width: 60, height: 60 },
                fitTo: { container: { width: firstContainerWidth, height: 60 }, anchor, padding },
            },
            {
                box: { x: 25, y: 140, width: 50, height: 20 },
                fitTo: { anchor: { ...anchor, y: 150 }, padding },
            },
        ];

        const placePositioned = (firstContainerWidth: number) =>
            placeLabels(
                new Map([
                    [
                        's',
                        seriesLabels([
                            buildBarPositionedLabelDatum(
                                TEXT,
                                50,
                                20,
                                candidates(firstContainerWidth),
                                target(),
                                { x: 20, y: 20, width: 60, height: 60 },
                                true,
                                {},
                                0,
                                false,
                                { text: TEXT, policy: { overflowStrategy: 'ellipsis' }, font: FONT }
                            ),
                        ]),
                    ],
                ]),
                bounds,
                0
            ).get('s')![0];

        it('takes the first candidate whole when its container holds the text', () => {
            const placed = placePositioned(60);
            expect(placed.text).toBe(TEXT);
            expect(placed.y).toBe(40);
        });

        it('falls through to the unbounded candidate rather than truncating into the first', () => {
            const placed = placePositioned(34);
            expect(placed.text).toBe(TEXT);
            expect(placed.y).toBe(140);
        });

        it('shrinks a floating candidate to the room a neighbouring label leaves', () => {
            // The fallback candidate offers no container, so only an obstacle can bound its text. Shrinking
            // clear of the neighbour costs it one character, where truncating into the first candidate's
            // 34px container costs two.
            const blocker: LabelObstacle = {
                kind: 'rect',
                box: { x: 70, y: 140, width: 40, height: 20 },
                category: 'label',
            };
            const placed = placeLabels(
                new Map([
                    [
                        's',
                        seriesLabels([
                            buildBarPositionedLabelDatum(
                                TEXT,
                                50,
                                20,
                                candidates(34),
                                target(),
                                { x: 20, y: 20, width: 60, height: 60 },
                                false,
                                {},
                                0,
                                false,
                                { text: TEXT, policy: { overflowStrategy: 'ellipsis' }, font: FONT }
                            ),
                        ]),
                    ],
                ]),
                bounds,
                0,
                [blocker]
            ).get('s')![0];
            expect(placed.text).toBe('WWW…');
            expect(placed.width).toBe(40);
            expect(placed.y).toBe(140);
        });
    });
});

describe('placeLabels obstacle-driven shrink', () => {
    const bounds: BoxBounds = { x: 0, y: 0, width: 400, height: 400 };
    const FONT = { fontSize: 12, fontFamily: 'sans-serif' };
    const TEXT = 'WWWWW';
    const POINT = { x: 200, y: 200, size: 0 };

    /** A `TEXT` label offset 10px off `POINT`, refitted per candidate, bound only by its obstacles. */
    const shrinkableLabel = (overrides: Partial<PointLabelDatum> = {}): PointLabelDatum => ({
        point: POINT,
        label: { text: TEXT, width: 50, height: 20 },
        fit: { text: TEXT, policy: { overflowStrategy: 'ellipsis' }, font: FONT },
        anchor: undefined,
        placement: 'top',
        placements: ['top'],
        orientation: 'horizontal',
        gap: 10,
        spacing: 0,
        alwaysShow: false,
        ...overrides,
    });

    const placeOne = (datum: PointLabelDatum, obstacles: LabelObstacle[] = []) =>
        placeLabels(new Map([['s', seriesLabels([datum])]]), bounds, 0, obstacles).get('s')![0];

    // The `top` candidate box: 50x20 centred on x, sitting gap+height above the point.
    const TOP_BOX: BoxBounds = { x: 175, y: 170, width: 50, height: 20 };
    /** A label obstacle reaching `depth` px into the right of {@link TOP_BOX}. */
    const fromTheRight = (depth: number): LabelObstacle => ({
        kind: 'rect',
        box: { x: TOP_BOX.x + TOP_BOX.width - depth, y: TOP_BOX.y, width: 60, height: TOP_BOX.height },
        category: 'label',
    });

    // A `top` label is centred over its point, so it retreats from an obstacle on one side by giving up
    // twice that on both sides: 10px of intrusion costs 20px of width, leaving 'WW…'.
    it('truncates a colliding label into the room the obstacle leaves rather than hiding it', () => {
        expect(placeOne(shrinkableLabel(), [fromTheRight(10)])).toMatchObject({ text: 'WW…', width: 30 });
    });

    it('truncates rather than overlapping when the label may not be hidden', () => {
        const placed = placeOne(shrinkableLabel({ alwaysShow: true }), [fromTheRight(10)]);
        expect(placed.text).toBe('WW…');
        expect(placed.x + placed.width).toBeLessThanOrEqual(215);
    });

    it('wraps into the room the obstacle leaves rather than dropping characters', () => {
        const text = 'WW WW';
        const placed = placeOne(
            shrinkableLabel({
                label: { text, width: 50, height: 20 },
                fit: { text, policy: { wrapping: 'on-space', overflowStrategy: 'ellipsis' }, font: FONT },
            }),
            [fromTheRight(10)]
        );
        expect(placed.text).toBe('WW\nWW');
        expect(placed.width).toBe(20);
        expect(placed.height).toBe(40);
    });

    it('prefers a placement that needs no shrinking at all', () => {
        const placed = placeOne(shrinkableLabel({ placements: ['top', 'bottom'] }), [fromTheRight(10)]);
        expect(placed.text).toBe(TEXT);
        expect(placed.placement).toBe('bottom');
    });

    it('prefers the colliding placement that loses the least text', () => {
        // Both candidates collide; the bottom obstacle leaves room for one more character than the top one.
        const below = fromTheRight(5);
        const placed = placeOne(shrinkableLabel({ placements: ['top', 'bottom'] }), [
            fromTheRight(10),
            { ...below, box: { ...below.box, y: 210 } },
        ]);
        expect(placed.text).toBe('WWW…');
        expect(placed.placement).toBe('bottom');
    });

    it('does not shrink away from an obstacle on the edge the label is pinned to', () => {
        // A `left` label hangs off its right edge, so shrinking walks that edge no further from the obstacle
        // sitting against it: the reduction that would clear it is the whole label, and it hides instead.
        const placed = placeOne(shrinkableLabel({ placement: 'left', placements: ['left'] }), [
            { kind: 'rect', box: { x: 180, y: 185, width: 30, height: 30 }, category: 'label' },
        ]);
        expect(placed).toBeUndefined();
    });

    it('hides a label the obstacles leave no real character of', () => {
        expect(placeOne(shrinkableLabel(), [fromTheRight(24)])).toBeUndefined();
    });

    it('leaves a label with no fit policy overlapping its obstacle', () => {
        const placed = placeOne(shrinkableLabel({ fit: undefined, alwaysShow: true }), [fromTheRight(10)]);
        expect(placed.text).toBe(TEXT);
        expect(placed.width).toBe(50);
    });

    it('truncates an inside label into its marker rather than dropping it', () => {
        // The obstacle spans the whole `top` candidate, which no shrinking can clear: it is only as tall as
        // the room it leaves above, and clearing it sideways costs the whole label. The marker rect is left.
        const placed = placeOne(
            shrinkableLabel({
                point: { x: 200, y: 200, size: 100 },
                anchor: { x: 0.5, y: 0.5 },
                placement: 'inside',
                placements: ['inside', 'top'],
                insideSize: { width: 0.3, height: 0.3 },
            }),
            [{ kind: 'rect', box: { x: 150, y: 168, width: 100, height: 16 }, category: 'label' }]
        );
        expect(placed.placement).toBe('inside');
        expect(placed.text).toBe('WW…');
    });
});

describe('placeLabels candidate styles', () => {
    const bounds: BoxBounds = { x: 0, y: 0, width: 400, height: 400 };
    const FONT = { fontSize: 12, fontFamily: 'sans-serif' };
    const NO_PADDING: Required<PaddingOptions> = { top: 0, right: 0, bottom: 0, left: 0 };
    const PADDING: Required<PaddingOptions> = { top: 10, right: 10, bottom: 10, left: 10 };
    const TEXT = 'WW';

    /** A 20×20 `TEXT` label cascading top-then-bottom, 10px off its point, styled per candidate. */
    const styledDatum = (overrides: Partial<PointLabelDatum> = {}): PointLabelDatum => ({
        point: { x: 200, y: 200, size: 0 },
        label: { text: TEXT, width: 20, height: 20 },
        fit: { text: TEXT, policy: {}, font: FONT, boxPadding: NO_PADDING, boundByRegion: false },
        anchor: undefined,
        placement: undefined,
        placements: ['top', 'bottom'],
        gap: 10,
        ...overrides,
    });

    /** Records every candidate the engine resolved a style for, in the order it tried them. */
    function recordingResolver(style: (placement: LabelPlacement | undefined) => CandidateLabelStyle) {
        const calls: (LabelPlacement | undefined)[] = [];
        const resolve: CandidateStyleResolver = (_datum, placement) => {
            calls.push(placement);
            return style(placement);
        };
        return { calls, resolve };
    }

    const place = (
        datums: PointLabelDatum[],
        resolveCandidateStyle: CandidateStyleResolver,
        obstacles: LabelObstacle[] = []
    ) => placeLabels(new Map([['s', { datums, resolveCandidateStyle }]]), bounds, 0, obstacles).get('s')!;

    it('resolves the styles of only the candidates it needs, in cascade order', () => {
        const { calls, resolve } = recordingResolver(() => ({ font: FONT, boxPadding: NO_PADDING }));
        const placed = place([styledDatum()], resolve);
        expect(placed[0].placement).toBe('top');
        expect(calls).toEqual(['top']);
    });

    it('cascades past a placement the styled box cannot fit', () => {
        // The unstyled 20×20 box spans y 170–190 above the point and clears the obstacle; the styled box
        // is 40×40 (10px padding a side), reaches y 150 and collides, so `top` is abandoned.
        const blocker: LabelObstacle = {
            kind: 'rect',
            box: { x: 180, y: 150, width: 40, height: 10 },
            category: 'label',
        };
        const unstyled = recordingResolver(() => ({ font: FONT, boxPadding: NO_PADDING }));
        expect(place([styledDatum()], unstyled.resolve, [blocker])[0].placement).toBe('top');

        const styled = recordingResolver(() => ({ font: FONT, boxPadding: PADDING }));
        const placed = place([styledDatum()], styled.resolve, [blocker]);
        expect(placed[0].placement).toBe('bottom');
        expect(placed[0].height).toBe(40);
        expect(styled.calls).toEqual(['top', 'bottom']);
    });

    it('reserves the styled box so a later label avoids what is drawn', () => {
        // Without the styled padding the two labels' `top` boxes (y 170–190 and 185–205) already overlap,
        // so this asserts the second label is pushed to `bottom` by the first label's *drawn* footprint.
        const near = styledDatum({ point: { x: 200, y: 215, size: 0 } });
        const { resolve } = recordingResolver(() => ({ font: FONT, boxPadding: PADDING }));
        const placed = place([styledDatum(), near], resolve);
        expect(placed.map((p) => p.placement)).toEqual(['top', 'bottom']);
    });

    it('drops a label the styler disabled and leaves the space to its neighbour', () => {
        const near = styledDatum({ point: { x: 200, y: 215, size: 0 } });
        const hidden = (datum: PointLabelDatum): CandidateLabelStyle => ({
            font: FONT,
            boxPadding: NO_PADDING,
            hidden: datum !== near,
        });
        const placed = place([styledDatum(), near], hidden);
        expect(placed).toHaveLength(1);
        expect(placed[0].datum).toBe(near);
        // The dropped label reserved nothing and never entered the obstacle index, so `top` is still free.
        expect(placed[0].placement).toBe('top');
    });

    it('keeps the disabled label out of the obstacle index only when it is disabled', () => {
        const near = styledDatum({ point: { x: 200, y: 215, size: 0 } });
        const { resolve } = recordingResolver(() => ({ font: FONT, boxPadding: NO_PADDING }));
        expect(place([styledDatum(), near], resolve).map((p) => p.placement)).toEqual(['top', 'bottom']);
    });

    it('re-fits the text to the styled font', () => {
        // 'WWW' measures 30px at the configured 12px font and 60px at the styler's 24px one, so only the
        // styled label overruns the 45px bound and has to ellipsise.
        const bounded = styledDatum({
            label: { text: 'WWW', width: 30, height: 20 },
            fit: {
                text: 'WWW',
                policy: { maxWidth: 45, overflowStrategy: 'ellipsis' },
                font: FONT,
                boxPadding: NO_PADDING,
                boundByRegion: false,
            },
        });
        const unstyled = recordingResolver(() => ({ font: FONT, boxPadding: NO_PADDING }));
        expect(place([bounded], unstyled.resolve)[0].text).toBe('WWW');

        const styled = recordingResolver(() => ({ font: { ...FONT, fontSize: 24 }, boxPadding: NO_PADDING }));
        const placed = place([bounded], styled.resolve)[0];
        expect(placed.text).toBe('W…');
        expect(placed.width).toBe(40);
    });
});

describe('placeLabels collision shrink', () => {
    const bounds: BoxBounds = { x: 0, y: 0, width: 400, height: 400 };
    const FONT = { fontSize: 12, fontFamily: 'sans-serif' };
    const TEXT = 'WWWWW';
    const NO_PADDING = { top: 0, right: 0, bottom: 0, left: 0 };

    /** A `TEXT` label anchored above `x`, free to shrink to `minimumFontSize` to clear an obstacle. */
    const shrinkable = (x: number, overrides: Partial<PointLabelDatum> = {}): PointLabelDatum => ({
        point: { x, y: 200, size: 0 },
        label: { text: TEXT, width: 50, height: 20 },
        fit: {
            text: TEXT,
            policy: { minimumFontSize: 6 },
            font: FONT,
            boxPadding: NO_PADDING,
            boundByRegion: false,
        },
        anchor: undefined,
        placement: 'top',
        gap: 0,
        alwaysShow: false,
        ...overrides,
    });

    const place = (datums: PointLabelDatum[], obstacles: LabelObstacle[] = []) =>
        placeLabels(new Map([['s', seriesLabels(datums)]]), bounds, 0, obstacles).get('s')!;

    // Blocks everything left of x=180, so a 50px-wide label centred on x=200 overlaps it and a narrow
    // enough one does not.
    const leftBlocker: LabelObstacle = {
        kind: 'rect',
        box: { x: 100, y: 180, width: 80, height: 20 },
        category: 'label',
    };

    it('shrinks a colliding label to the largest size that clears its obstacle', () => {
        const [placed] = place([shrinkable(200)], [leftBlocker]);
        // 10px still measures 41.7px wide and overlaps; 9px measures 37.5px and clears.
        expect(placed.fontSize).toBe(9);
        expect(placed.width).toBeCloseTo(37.5);
        expect(placed.text).toBe(TEXT);
    });

    it('drops the label when it would still collide at minimumFontSize', () => {
        const wide: LabelObstacle = {
            kind: 'rect',
            box: { x: 100, y: 180, width: 105, height: 20 },
            category: 'label',
        };
        expect(place([shrinkable(200)], [wide])).toEqual([]);
    });

    it('does not shrink a label that places cleanly at its configured size', () => {
        const [placed] = place([shrinkable(200)]);
        expect(placed.fontSize).toBeUndefined();
        expect(placed.width).toBe(50);
    });

    it('does not shrink a label whose fit carries no minimumFontSize', () => {
        const datum = shrinkable(200, {
            fit: { text: TEXT, policy: {}, font: FONT, boxPadding: NO_PADDING, boundByRegion: false },
        });
        expect(place([datum], [leftBlocker])).toEqual([]);
    });

    it('does not shrink a label carrying no fit descriptor at all', () => {
        expect(place([shrinkable(200, { fit: undefined })], [leftBlocker])).toEqual([]);
    });

    it('keeps the full-size fallback when no size clears and the label is kept', () => {
        const wide: LabelObstacle = {
            kind: 'rect',
            box: { x: 100, y: 180, width: 105, height: 20 },
            category: 'label',
        };
        const [placed] = place([shrinkable(200, { alwaysShow: true })], [wide]);
        expect(placed.fontSize).toBeUndefined();
        expect(placed.width).toBe(50);
    });

    it('blocks a later label by the shrunken box rather than the full-size one', () => {
        // The first label shrinks to 37.5px wide, so its box ends at x=218.75. A second label whose own
        // box starts at x=220 clears that, where the unshrunk 50px box (ending at x=225) would not.
        const placed = place([shrinkable(200), shrinkable(245)], [leftBlocker]);
        expect(placed).toHaveLength(2);
        expect(placed[0].fontSize).toBe(9);
        expect(placed[1].fontSize).toBeUndefined();
        expect(placed[1].x).toBeCloseTo(220);
    });
});
