import type { MatchImageSnapshotOptions } from 'jest-image-snapshot';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    MIN_TOOLTIP_HIDE_DELAY,
    clickAction,
    clickLegendItem,
    compareImageSnapshot,
    contextMenuAction,
    deproxy,
    doubleClickAction,
    expectWarningMessages,
    getSeriesNodeData,
    hoverAction,
    hoverNode,
    isTooltipVisible,
    resetMockConsole,
    setupMockCanvas,
    setupMockConsole,
    setupMockPointerEvent,
    waitForChartStability,
} from 'ag-charts-community-test';
import { BBox, type Geometry, type Position, Selection, Text, Transformable } from 'ag-charts-core';

import { getSeriesGroup, getSeriesInstance } from '../../test/enterpriseSeriesAccessors';
import { createEnterpriseChart } from '../../test/utils';
import { rect, reverseRing } from '../map-test/gapSyntheticRings';
import { type GapTopology, featurePolygons } from '../map-test/gapTestUtil';
import indonesiaTimorTopology from '../map-test/indonesiaTimorTopology.json';
import { type Pixels, hexToRgb, measureStrip, pixelAt, pixelBox, readPixels } from '../map-test/pixelRuns';
import southernAfricaItalyTopology from '../map-test/southernAfricaItalyTopology.json';
import { usData } from '../map-test/usData';
import { central, eastern, mountain, pacific } from '../map-test/usTimeZoneData';
import usTopology from '../map-test/usTopology.json';
import worldTopology from '../map-test/worldTopology.json';
import type { GeoGeometry } from '../map-util/geoGeometry';
import { MapShapeGapIndex } from '../map-util/mapShapeGapIndex';
import { MapShapeGapNeighbours, collectPolygons, findDrawnPolygon } from '../map-util/mapShapeGapNeighbours';
import { polygonDistance } from '../map-util/polygonUtil';
import { type MapShapeNodeDatum, MapShapeSeries } from './mapShapeSeries';

// ---------------------------------------------------------------------------------------------------------------------
// Fixtures and helpers
// ---------------------------------------------------------------------------------------------------------------------

type Zone = 'pacific' | 'mountain' | 'central' | 'eastern';
const ZONES: Zone[] = ['pacific', 'mountain', 'central', 'eastern'];
const ZONE_DATA = { pacific, mountain, central, eastern };
/** Saturated primaries, so that an antialiased pixel can be told from a blend with the grey outline and white chart. */
const ZONE_FILL: Record<Zone, string> = {
    pacific: '#ff0000',
    mountain: '#00ff00',
    central: '#0000ff',
    eastern: '#ffff00',
};
const ZONE_OF = new Map<string, Zone>(
    ZONES.flatMap((zone) => ZONE_DATA[zone].map(({ name }) => [name, zone] as const))
);

interface TimeZoneOptions {
    /** `gap` per series; a zone left out leaves `gap` unset. */
    gaps?: Partial<Record<Zone, number | undefined>>;
    /** Merged into every series. */
    series?: Record<string, unknown>;
    /** Merged into the series of one zone, after `series`. */
    zoneSeries?: Partial<Record<Zone, Record<string, unknown>>>;
    chart?: Record<string, unknown>;
}

/** The four time-zone series of the docs example, in TC1's colours: `fill` per series and a dark `stroke`. */
function timeZoneOptions({
    gaps = {},
    series = {},
    zoneSeries = {},
    chart = {},
}: TimeZoneOptions = {}): AgChartOptions {
    return {
        topology: usTopology,
        legend: { enabled: false },
        series: ZONES.map((zone) => ({
            type: 'map-shape',
            data: ZONE_DATA[zone],
            idKey: 'name',
            title: zone,
            fill: ZONE_FILL[zone],
            stroke: '#222222',
            strokeWidth: 1,
            ...(gaps[zone] === undefined ? {} : { gap: gaps[zone] }),
            ...series,
            ...zoneSeries[zone],
        })),
        ...chart,
    } as AgChartOptions;
}

const allGaps = (gap: number): Record<Zone, number> => ({ pacific: gap, mountain: gap, central: gap, eastern: gap });

const mapSeries = (chart: AgChartInstance, index = 0) => getSeriesInstance(chart, MapShapeSeries, index);
const seriesOf = (name: string) => ZONES.indexOf(ZONE_OF.get(name)!);

function datumOf(chart: AgChartInstance, name: string, seriesIndex = seriesOf(name)): MapShapeNodeDatum {
    const datum = getSeriesNodeData<MapShapeNodeDatum>(chart, seriesIndex).find(({ idValue }) => idValue === name);
    expect(datum, `${name} is drawn`).toBeDefined();
    return datum!;
}

/** The scene node that draws a region in the main layer. */
function nodeOf(chart: AgChartInstance, name: string, seriesIndex = seriesOf(name)): GeoGeometry<MapShapeNodeDatum> {
    const node = mapSeries(chart, seriesIndex)
        .datumSelection.nodes()
        .find((candidate) => candidate.datum?.idValue === name);
    expect(node, `${name} has a node`).toBeDefined();
    return node!;
}

function highlightNodes(chart: AgChartInstance, seriesIndex: number): GeoGeometry<MapShapeNodeDatum>[] {
    return [...mapSeries(chart, seriesIndex).highlightNodeGroup.children()] as GeoGeometry<MapShapeNodeDatum>[];
}

/** The canvas position of a longitude and latitude, through the chart's current projection, zoom and pan. */
function canvasPoint(chart: AgChartInstance, [lon, lat]: Position, seriesIndex = 0) {
    const series = mapSeries(chart, seriesIndex);
    const [x, y] = series.scale!.convert([lon, lat]);
    const { canvasX, canvasY } = Transformable.toCanvasPoint(series.contentGroup, x, y);
    return { x: canvasX, y: canvasY };
}

/** The exterior ring points of every polygon of a geometry. */
function exteriorPoints(geometry: Geometry | undefined): Position[] {
    return geometry == null ? [] : collectPolygons(geometry).flatMap(([exterior]) => exterior ?? []);
}

function extent(geometry: Geometry | undefined) {
    const points = exteriorPoints(geometry);
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

type TopologyFeature = GapTopology['features'][number];

const edgeKey = (a: Position, b: Position) => {
    const [p, q] = a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]) ? [a, b] : [b, a];
    return `${p[0]},${p[1]}|${q[0]},${q[1]}`;
};

interface Border {
    /** The middle of the longest straight shared edge. */
    at: Position;
    /** The end points of that edge. */
    ends: [Position, Position];
    /** `'x'` for a border that runs north to south, so a row of pixels crosses it. */
    axis: 'x' | 'y';
}

/** Whether an edge is one two different regions of the topology have, matched by end points as D-1 does. */
function sharedEdgeTest(topology: { features: TopologyFeature[] }): (a: Position, b: Position) => boolean {
    const owners = new Map<string, Set<string>>();
    for (const { properties, ...rest } of topology.features) {
        for (const polygon of featurePolygons({ properties, ...rest })) {
            for (const ring of polygon) {
                for (let i = 1; i < ring.length; i += 1) {
                    const key = edgeKey(ring[i - 1], ring[i]);
                    owners.set(key, (owners.get(key) ?? new Set()).add(properties!.name!));
                }
            }
        }
    }
    return (a, b) => (owners.get(edgeKey(a, b))?.size ?? 0) > 1;
}

/** The edges of a polygon's rings, with the vertex either side of each. */
function* ringEdges(polygon: Position[][]): Generator<[Position, Position]> {
    for (const ring of polygon) {
        for (let i = 1; i < ring.length; i += 1) yield [ring[i - 1], ring[i]];
    }
}

/**
 * Checks that each vertex of `polygon` with no shared edge on either side is in the drawn polygon, exactly where
 * projection put it; returns how many it checked.
 */
function expectUnmovedVertices(
    polygon: Position[][],
    projected: Position[][],
    drawn: Position[][],
    isShared: (a: Position, b: Position) => boolean,
    label: string
): number {
    let checked = 0;
    for (const [r, ring] of polygon.entries()) {
        const drawnPoints = new Set((drawn[r] ?? []).map(([x, y]) => `${x},${y}`));
        for (let i = 0; i < ring.length - 1; i += 1) {
            const before = ring[i === 0 ? ring.length - 2 : i - 1];
            if (isShared(before, ring[i]) || isShared(ring[i], ring[i + 1])) continue;
            const [x, y] = projected[r][i];
            expect(drawnPoints.has(`${x},${y}`), `${label} ring ${r} vertex ${i}`).toBe(true);
            checked += 1;
        }
    }
    return checked;
}

/** `'x'` for an edge that runs north to south, `'y'` for east to west, `undefined` for a diagonal. */
function straightAxis(dx: number, dy: number): 'x' | 'y' | undefined {
    if (dx <= dy * 0.01) return 'x';
    return dy <= dx * 0.01 ? 'y' : undefined;
}

/** The longest straight edge two regions of a topology share (the same two end points, as `D-1` matches them) that runs north to south or east to west. */
function sharedBorder(
    topology: { features: TopologyFeature[] },
    nameA: string,
    nameB: string,
    near?: Position
): Border {
    const feature = (name: string) => topology.features.find((f) => f.properties?.name === name)!;
    const edgesOfB = new Set<string>();
    for (const polygon of featurePolygons(feature(nameB))) {
        for (const ring of polygon) {
            for (let i = 1; i < ring.length; i += 1) edgesOfB.add(edgeKey(ring[i - 1], ring[i]));
        }
    }
    // Without `near`, the longest edge wins; with it, the edge with an end closest to `near`, if it is at least half a degree.
    const distanceToEnds = (a: Position, b: Position) =>
        near == null
            ? 0
            : Math.min(Math.hypot(a[0] - near[0], a[1] - near[1]), Math.hypot(b[0] - near[0], b[1] - near[1]));
    let best: (Border & { length: number; distance: number }) | undefined;
    for (const polygon of featurePolygons(feature(nameA))) {
        for (const ring of polygon) {
            for (let i = 1; i < ring.length; i += 1) {
                const [a, b] = [ring[i - 1], ring[i]];
                if (!edgesOfB.has(edgeKey(a, b))) continue;
                // The fixture's coordinates are rounded to a thousandth of a degree, so "straight" allows a 1% tilt.
                const [dx, dy] = [Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])];
                const axis = straightAxis(dx, dy);
                const length = Math.hypot(dx, dy);
                const distance = distanceToEnds(a, b);
                const better =
                    near == null ? best == null || length > best.length : best == null || distance < best.distance;
                if (axis != null && (near == null || length >= 0.5) && better) {
                    best = { at: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], ends: [a, b], axis, length, distance };
                }
            }
        }
    }
    expect(best, `${nameA} and ${nameB} share a straight edge`).toBeDefined();
    return best!;
}

/** The point `degrees` along a border from whichever end of it is nearer `near`. */
function pointAlong({ ends: [a, b] }: Border, near: Position, degrees: number): Position {
    const [from, to] =
        Math.hypot(a[0] - near[0], a[1] - near[1]) <= Math.hypot(b[0] - near[0], b[1] - near[1]) ? [a, b] : [b, a];
    const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
    return [from[0] + ((to[0] - from[0]) * degrees) / length, from[1] + ((to[1] - from[1]) * degrees) / length];
}

/**
 * The background and outline widths across the border two regions share, read off the canvas. `first` is the region
 * on the lower-coordinate side: west of, or north of, `second`.
 */
function stripAcross(
    chart: AgChartInstance,
    pixels: Pixels,
    first: string,
    second: string,
    { near, degrees }: { near?: Position; degrees?: number } = {}
) {
    const border = sharedBorder(usTopology, first, second, near);
    const at = near == null ? border.at : pointAlong(border, near, degrees ?? 0.45);
    const point = canvasPoint(chart, at, seriesOf(first));
    return {
        point,
        axis: border.axis,
        ...measureStrip(pixels, point, border.axis, {
            before: hexToRgb(ZONE_FILL[ZONE_OF.get(first)!]),
            after: hexToRgb(ZONE_FILL[ZONE_OF.get(second)!]),
        }),
    };
}

/** Pairs of states that share a straight border, west or north one first, with how the zones relate (V2, V3). */
const BORDERS = [
    { first: 'Nevada', second: 'Utah', note: 'Pacific and Mountain' },
    { first: 'Utah', second: 'Colorado', note: 'within Mountain' },
    { first: 'Wyoming', second: 'Colorado', note: 'within Mountain, north to south' },
    { first: 'Wyoming', second: 'Nebraska', note: 'Mountain and Central' },
    { first: 'Illinois', second: 'Indiana', note: 'Central and Eastern' },
] as const;

const southernAfricaItaly = (series: Record<string, unknown> = {}): AgChartOptions =>
    ({
        topology: southernAfricaItalyTopology,
        legend: { enabled: false },
        series: [
            {
                type: 'map-shape',
                data: southernAfricaItalyTopology.features.map(({ properties }) => ({ name: properties.name })),
                idKey: 'name',
                fill: '#7fb3d5',
                stroke: '#222222',
                strokeWidth: 1,
                gap: 4,
                ...series,
            },
        ],
    }) as AgChartOptions;

/**
 * How far a point of the undrawn map lies from the outline a region is drawn with: how far its edge there has moved in.
 * `Infinity` for a region with nothing drawn. Both are in the series' own pixel space.
 */
function recession(chart: AgChartInstance, name: string, at: Position, seriesIndex = seriesOf(name)): number {
    const [x, y] = mapSeries(chart, seriesIndex).scale!.convert(at);
    const polygons = collectPolygons(datumOf(chart, name, seriesIndex).drawnGeometry!).filter(
        ({ length }) => length > 0
    );
    if (polygons.length === 0) return Infinity;
    return Math.min(...polygons.map((polygon) => Math.abs(polygonDistance(polygon, x, y))));
}

/** The region the pointer is over, as the highlight reports it. */
const hoveredName = (chart: AgChartInstance) =>
    (deproxy(chart).ctx.highlightManager.getActiveHighlight() as MapShapeNodeDatum | undefined)?.idValue;

/** `options` with its chart-level topology handed to each series as a copy of its own. */
function withSeriesTopology(options: AgChartOptions, copies = ZONES.map(() => structuredClone(usTopology))) {
    const { topology: _topology, ...rest } = options as AgChartOptions & { topology: unknown };
    return {
        ...rest,
        series: (rest.series as unknown as Record<string, unknown>[]).map((series, i) => ({
            ...series,
            topology: copies[i],
        })),
    } as AgChartOptions;
}

const expectStrip = (actual: number, expected: number, what: string) => {
    expect(
        Math.abs(actual - expected),
        `${what}: ${actual.toFixed(2)}px, expected ${expected}px ±0.5`
    ).toBeLessThanOrEqual(0.5);
};

// ---------------------------------------------------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------------------------------------------------

describe('MapShapeSeries gap', () => {
    setupMockConsole();
    setupMockPointerEvent();
    const ctx = setupMockCanvas();

    let chart: AgChartInstance | undefined;

    const create = async (options: AgChartOptions) => {
        chart = await createEnterpriseChart(options);
        return chart;
    };

    const compare = async (options?: MatchImageSnapshotOptions) => {
        await compareImageSnapshot(chart!, ctx, { ...IMAGE_SNAPSHOT_DEFAULTS, ...options });
    };

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
        vi.restoreAllMocks();
    });

    describe('option (AC1)', () => {
        it('defaults to 0', async () => {
            await create(timeZoneOptions());
            expect(mapSeries(chart!).options.gap).toBe(0);
        });

        it('takes a series gap', async () => {
            await create(timeZoneOptions({ gaps: { pacific: 4 } }));
            expect(mapSeries(chart!, 0).options.gap).toBe(4);
            expect(mapSeries(chart!, 1).options.gap).toBe(0);
        });

        it('takes a theme gap, which a series gap overrides', async () => {
            await create(
                timeZoneOptions({
                    gaps: { central: 2 },
                    chart: { theme: { overrides: { 'map-shape': { series: { gap: 6 } } } } },
                })
            );
            expect(mapSeries(chart!, 0).options.gap).toBe(6);
            expect(mapSeries(chart!, 2).options.gap).toBe(2);
        });

        it('draws a theme gap', async () => {
            await create(timeZoneOptions({ chart: { theme: { overrides: { 'map-shape': { series: { gap: 4 } } } } } }));
            const strip = stripAcross(chart!, readPixels(chart!), 'Nevada', 'Utah');
            expectStrip(strip.background, 4, 'Nevada to Utah');
        });

        it('warns about a negative gap and draws none', async () => {
            resetMockConsole();
            await create(timeZoneOptions({ gaps: { pacific: -3 } }));

            expectWarningMessages([
                'AG Charts - Option `series[0].gap` cannot be set to `-3`; expecting a number greater than or equal to 0, ignoring.',
            ]);
            expect(mapSeries(chart!, 0).options.gap).toBe(0);
        });
    });

    describe('gap: 0 is the base behaviour (AC7, D-6, V1, V22)', () => {
        // The setup files load the series before this file can mock `insetPolygonRings`, so the spies sit on the two calls
        // that lead to it: the index is asked for each polygon's rings right before they are inset.
        const spyOnGapWork = () => ({
            ensure: vi.spyOn(MapShapeGapNeighbours.prototype, 'ensure'),
            build: vi.spyOn(MapShapeGapIndex.prototype, 'build'),
            inset: vi.spyOn(MapShapeGapIndex.prototype, 'getPolygonRingInfo'),
        });

        const everyDatum = (c: AgChartInstance, check: (datum: MapShapeNodeDatum, index: number) => void) => {
            for (let i = 0; i < ZONES.length; i += 1) {
                const data = getSeriesNodeData<MapShapeNodeDatum>(c, i);
                expect(data.length).toBeGreaterThan(0);
                for (const datum of data) check(datum, i);
            }
        };

        it.each([
            { name: 'the default', gaps: {} },
            { name: 'an explicit 0 on every series', gaps: allGaps(0) },
        ])('draws and picks the undrawn geometry with $name, and never builds the index', async ({ gaps }) => {
            const { ensure, build, inset } = spyOnGapWork();
            await create(timeZoneOptions({ gaps }));

            expect(ensure).not.toHaveBeenCalled();
            expect(build).not.toHaveBeenCalled();
            expect(inset).not.toHaveBeenCalled();
            everyDatum(chart!, (datum) => {
                expect(datum.drawnGeometry).toBe(datum.projectedGeometry);
                expect(datum.sourceGeometry).toBeUndefined();
            });
            for (let i = 0; i < ZONES.length; i += 1) {
                for (const node of mapSeries(chart!, i).datumSelection.nodes()) {
                    expect(node.pickGeometry).toBeUndefined();
                    expect(node.projectedGeometry).toBe(node.datum!.projectedGeometry);
                }
            }
        });

        it('is not vacuous: a gap does build the index and inset', async () => {
            const { ensure, build, inset } = spyOnGapWork();
            await create(timeZoneOptions({ gaps: { pacific: 4 } }));

            expect(ensure).toHaveBeenCalled();
            expect(build).toHaveBeenCalledTimes(1);
            expect(inset).toHaveBeenCalled();
        });

        it('does nothing for a gap on a series that is hidden', async () => {
            const { ensure, inset } = spyOnGapWork();
            await create(timeZoneOptions({ gaps: { pacific: 4 }, zoneSeries: { pacific: { visible: false } } }));

            expect(ensure).not.toHaveBeenCalled();
            expect(inset).not.toHaveBeenCalled();
        });

        it('does nothing after a gap is switched back to 0', async () => {
            await create(timeZoneOptions({ gaps: allGaps(4) }));
            const { ensure, inset } = spyOnGapWork();

            await chart!.updateDelta(timeZoneOptions({ gaps: allGaps(0) }));
            await waitForChartStability(chart!);

            expect(ensure).not.toHaveBeenCalled();
            expect(inset).not.toHaveBeenCalled();
            everyDatum(chart!, (datum) => expect(datum.drawnGeometry).toBe(datum.projectedGeometry));
        });

        it('draws islands with no neighbour as they are drawn without a gap, however small (D-15, V22)', async () => {
            const names = ['Malta', 'Faroes', 'Mauritius'];
            // None of them shares an edge with another region of the topology.
            const isShared = sharedEdgeTest(worldTopology as unknown as { features: TopologyFeature[] });
            for (const name of names) {
                const feature = worldTopology.features.find((f) => f.properties.name === name)!;
                for (const polygon of featurePolygons(feature as TopologyFeature)) {
                    for (const [a, b] of ringEdges(polygon))
                        expect(isShared(a, b), `${name} shares no edge`).toBe(false);
                }
            }

            await create({
                topology: worldTopology,
                legend: { enabled: false },
                series: [
                    {
                        type: 'map-shape',
                        data: worldTopology.features.map(({ properties }) => ({ name: properties.name })),
                        idKey: 'name',
                        gap: 4,
                    },
                ],
            } as AgChartOptions);

            for (const name of names) {
                const datum = datumOf(chart!, name, 0);
                const polygons = collectPolygons(datum.projectedGeometry!);
                expect(datum.drawnGeometry, name).toBe(datum.projectedGeometry);
                for (const [i, polygon] of collectPolygons(datum.drawnGeometry!).entries()) {
                    expect(polygon, `${name} polygon ${i} is the same array`).toBe(polygons[i]);
                }
            }
        });
    });

    describe('gap along shared borders (AC2, AC3, V2, V3, V4)', () => {
        it.each(BORDERS)('opens 4px between $first and $second ($note)', async ({ first, second }) => {
            await create(timeZoneOptions({ gaps: allGaps(4) }));
            const strip = stripAcross(chart!, readPixels(chart!), first, second);
            expectStrip(strip.background, 4, `${first} to ${second}`);
            expectStrip(strip.stroke, 2, 'the two 1px outlines');
        });

        it.each(BORDERS)(
            'leaves $first and $second touching when no gap is set (control)',
            async ({ first, second }) => {
                await create(timeZoneOptions({ gaps: allGaps(0) }));
                const strip = stripAcross(chart!, readPixels(chart!), first, second);
                expect(strip.background).toBeLessThan(0.5);
            }
        );

        it('splits the gap: 2px next to a region with gap 0 (V3)', async () => {
            await create(timeZoneOptions({ gaps: { pacific: 4, mountain: 0, central: 0, eastern: 0 } }));
            const pixels = readPixels(chart!);

            expectStrip(stripAcross(chart!, pixels, 'Nevada', 'Utah').background, 2, 'Pacific to Mountain');
            // Edges shared only by gap 0 regions stay put.
            expect(stripAcross(chart!, pixels, 'Wyoming', 'Nebraska').background).toBeLessThan(0.5);
            expect(stripAcross(chart!, pixels, 'Illinois', 'Indiana').background).toBeLessThan(0.5);
        });

        it('adds the two halves of two different gaps', async () => {
            await create(timeZoneOptions({ gaps: { pacific: 6, mountain: 2, central: 0, eastern: 0 } }));
            expectStrip(stripAcross(chart!, readPixels(chart!), 'Nevada', 'Utah').background, 4, '(6 + 2) / 2');
        });

        it('keeps the gap at 4px with thicker outlines (V4)', async () => {
            await create(timeZoneOptions({ gaps: allGaps(4), series: { strokeWidth: 3 } }));
            const pixels = readPixels(chart!);
            for (const { first, second } of BORDERS) {
                const strip = stripAcross(chart!, pixels, first, second);
                expectStrip(strip.background, 4, `${first} to ${second}`);
                expectStrip(strip.stroke, 6, 'the two 3px outlines');
            }
        });

        it('leaves coastlines and the national border where they were (AC2)', async () => {
            const around = (c: AgChartInstance, name: string, [lon, lat]: Position, half = 8) => {
                const { x, y } = canvasPoint(c, [lon, lat], seriesOf(name));
                return { x: Math.round(x) - half, y: Math.round(y) - half, size: half * 2 };
            };
            // The Pacific coast of California, the national border of Montana, and the Gulf coast of Texas.
            const spots: [string, Position][] = [
                ['California', [-123.8, 40]],
                ['Montana', [-110, 49]],
                ['Texas', [-97.4, 26.5]],
            ];

            await create(timeZoneOptions({ gaps: allGaps(0) }));
            const without = readPixels(chart!);
            const boxes = spots.map(([name, at]) => around(chart!, name, at));
            const before = boxes.map(({ x, y, size }) => pixelBox(without, x, y, size, size));
            chart!.destroy();

            await create(timeZoneOptions({ gaps: allGaps(4) }));
            const withGap = readPixels(chart!);
            for (const [i, { x, y, size }] of boxes.entries()) {
                expect(pixelBox(withGap, x, y, size, size), spots[i][0]).toEqual(before[i]);
            }
        });
    });

    // -----------------------------------------------------------------------------------------------------------------
    // Synthetic topologies: squares in degrees, so every border is exactly straight and exactly shared.
    // -----------------------------------------------------------------------------------------------------------------

    const feature = (name: string, ...polygons: Position[][][]) => ({
        type: 'Feature',
        properties: { name },
        geometry:
            polygons.length === 1
                ? { type: 'Polygon', coordinates: polygons[0] }
                : { type: 'MultiPolygon', coordinates: polygons },
    });
    /** A feature whose geometry is a `GeometryCollection` of the given geometries, which GeoJSON allows for one region. */
    const collectionFeature = (name: string, ...geometries: Geometry[]) => ({
        type: 'Feature',
        properties: { name },
        geometry: { type: 'GeometryCollection', geometries },
    });
    const polygonOf = (...rings: Position[][]): Geometry => ({ type: 'Polygon', coordinates: rings });
    const multiPolygonOf = (...polygons: Position[][][]): Geometry => ({ type: 'MultiPolygon', coordinates: polygons });
    const syntheticOptions = (features: { properties: { name: string } }[], series: Record<string, unknown> = {}) =>
        ({
            topology: { type: 'FeatureCollection', features },
            legend: { enabled: false },
            series: [
                {
                    type: 'map-shape',
                    data: features.map(({ properties }) => ({ name: properties.name })),
                    idKey: 'name',
                    fill: '#ff0000',
                    stroke: '#222222',
                    strokeWidth: 1,
                    gap: 4,
                    ...series,
                },
            ],
        }) as AgChartOptions;
    const RED = hexToRgb('#ff0000');

    describe('multi-part and enclosed regions (AC4, AC5)', () => {
        it('separates each polygon of a multi-part region on its own (AC4)', async () => {
            // `Pair` is two squares, each next to a different neighbour; the sides facing each other have none.
            await create(
                syntheticOptions([
                    feature('Pair', [rect(-10, -10, -2, 10)], [rect(2, -10, 10, 10)]),
                    feature('Left', [rect(-14, -10, -10, 10)]),
                    feature('Right', [rect(10, -10, 14, 10)]),
                ])
            );
            const [left, right] = collectPolygons(datumOf(chart!, 'Pair', 0).drawnGeometry!);
            const [leftBefore, rightBefore] = collectPolygons(datumOf(chart!, 'Pair', 0).projectedGeometry!);
            const ring = (polygon: Position[][]) => extent({ type: 'Polygon', coordinates: polygon });
            const shift = (a: number, b: number) => Math.abs(a - b);

            // The outer sides moved by half the gap plus half the stroke, the inner sides stayed.
            expectStrip(ring(left).x0 - ring(leftBefore).x0, 2.5, 'left part, outer side');
            expect(shift(ring(left).x1, ring(leftBefore).x1)).toBeLessThan(0.01);
            expectStrip(ring(rightBefore).x1 - ring(right).x1, 2.5, 'right part, outer side');
            expect(shift(ring(right).x0, ring(rightBefore).x0)).toBeLessThan(0.01);

            const pixels = readPixels(chart!);
            const across = (at: Position) =>
                measureStrip(pixels, canvasPoint(chart!, at), 'x', { before: RED, after: RED });
            expectStrip(across([-10, 0]).background, 4, 'Left to the first part');
            expectStrip(across([10, 0]).background, 4, 'second part to Right');
        });

        it('separates an enclave from its host on every side (AC5)', async () => {
            const hole = rect(-2, -2, 2, 2);
            await create(
                syntheticOptions([
                    feature('Host', [rect(-10, -10, 10, 10), reverseRing(hole)]),
                    feature('Enclave', [hole]),
                ])
            );
            const pixels = readPixels(chart!);
            const strip = (at: Position, axis: 'x' | 'y') =>
                measureStrip(pixels, canvasPoint(chart!, at), axis, { before: RED, after: RED });

            expectStrip(strip([-2, 0], 'x').background, 4, 'west side');
            expectStrip(strip([2, 0], 'x').background, 4, 'east side');
            expectStrip(strip([0, 2], 'y').background, 4, 'north side');
            expectStrip(strip([0, -2], 'y').background, 4, 'south side');

            // The host's outer edge is a coastline.
            const host = datumOf(chart!, 'Host', 0);
            expect(extent(host.drawnGeometry).x0).toBeCloseTo(extent(host.projectedGeometry).x0, 6);
        });

        it('separates Lesotho from South Africa on every side, with the lake holes left alone (V7)', async () => {
            await create(southernAfricaItaly());
            const lesotho = datumOf(chart!, 'Lesotho', 0);
            const before = extent(lesotho.projectedGeometry);
            const after = extent(lesotho.drawnGeometry);
            expect(after.x0 - before.x0).toBeGreaterThan(0.5);
            expect(before.x1 - after.x1).toBeGreaterThan(0.5);
            expect(after.y0 - before.y0).toBeGreaterThan(0.5);
            expect(before.y1 - after.y1).toBeGreaterThan(0.5);

            // South Africa's hole for it grows by the same amount, so the host is pulled back from it on every side.
            const host = datumOf(chart!, 'South Africa', 0);
            const holes = collectPolygons(host.drawnGeometry!).flatMap((polygon) => polygon.slice(1));
            const undrawnHoles = collectPolygons(host.projectedGeometry!).flatMap((polygon) => polygon.slice(1));
            expect(holes).toHaveLength(undrawnHoles.length);
            const grown = holes.map((h) => extent({ type: 'Polygon', coordinates: [h] }));
            const was = undrawnHoles.map((h) => extent({ type: 'Polygon', coordinates: [h] }));
            const index = grown.findIndex((g, i) => g.x1 - g.x0 > was[i].x1 - was[i].x0 + 1);
            expect(index, 'the hole around Lesotho grew').toBeGreaterThanOrEqual(0);
        });
    });

    describe('the gap holds in every state (D-9, D-18, V5, V19)', () => {
        const NO_GLOW = { highlight: { highlightedItem: { strokeWidth: 3, glow: { enabled: false } } } };
        /** Mountain states Colorado touches, with the state first that is west or north of the other. */
        const COLORADO_BORDERS = [
            ['Utah', 'Colorado'],
            ['Wyoming', 'Colorado'],
        ] as const;

        const expectColoradoGap = (c: AgChartInstance, expectedBackground: number, expectedStroke?: number) => {
            const pixels = readPixels(c);
            for (const [first, second] of COLORADO_BORDERS) {
                const strip = stripAcross(c, pixels, first, second);
                expectStrip(strip.background, expectedBackground, `${first} to ${second}`);
                if (expectedStroke != null) expectStrip(strip.stroke, expectedStroke, `${first} to ${second} outlines`);
            }
        };

        it('keeps the gap at 4px around a hovered region whose highlight outline is thicker (V5)', async () => {
            await create(timeZoneOptions({ gaps: allGaps(4), series: NO_GLOW }));
            const colorado = datumOf(chart!, 'Colorado');
            const utah = nodeOf(chart!, 'Utah');
            const mainNode = nodeOf(chart!, 'Colorado');
            const [drawn, utahGeometry, mainGeometry] = [
                colorado.drawnGeometry,
                utah.projectedGeometry,
                mainNode.projectedGeometry,
            ];
            const restingExtent = extent(drawn);
            expectColoradoGap(chart!, 4, 2);

            await hoverNode(chart!, colorado);

            // The 3px outline is 1px more than the 1px the node data was built for, so the highlight node insets
            // another 1px, and the 1px the outline gains grows inwards over the fill.
            expectColoradoGap(chart!, 4, 4);
            const [highlighted] = highlightNodes(chart!, seriesOf('Colorado'));
            expect(highlighted.projectedGeometry).not.toBe(drawn);
            expectStrip(extent(highlighted.projectedGeometry).x0 - restingExtent.x0, 1, 'extra inset');

            // Nothing else moved: the datum, the neighbour's node and Colorado's own main-layer node are as they were.
            expect(colorado.drawnGeometry).toBe(drawn);
            expect(nodeOf(chart!, 'Utah').projectedGeometry).toBe(utahGeometry);
            expect(nodeOf(chart!, 'Colorado').projectedGeometry).toBe(mainGeometry);
            // The highlight node picks over the same undrawn shape as the main one.
            expect(highlighted.pickGeometry).toBe(colorado.projectedGeometry);
        });

        it('leaves a highlight outline of the same width on the base inset (no extra inset)', async () => {
            await create(
                timeZoneOptions({ gaps: allGaps(4), series: { highlight: { highlightedItem: { strokeWidth: 1 } } } })
            );
            const colorado = datumOf(chart!, 'Colorado');
            await hoverNode(chart!, colorado);

            const [highlighted] = highlightNodes(chart!, seriesOf('Colorado'));
            expect(highlighted.projectedGeometry).toBe(colorado.drawnGeometry);
        });

        it('keeps the gap at 4px around a selected region whose selected outline is thicker (V5)', async () => {
            await create(
                timeZoneOptions({
                    gaps: allGaps(4),
                    series: {
                        highlight: { enabled: false },
                        selection: { enabled: true, selectedItem: { strokeWidth: 3 }, unselectedItem: { opacity: 1 } },
                    },
                })
            );
            expectColoradoGap(chart!, 4, 2);

            const series = mapSeries(chart!, seriesOf('Colorado'));
            const datum = datumOf(chart!, 'Colorado');
            deproxy(chart!).publicApi!.setSelection([
                { seriesId: series.id, itemId: series.data!.getItemIdFromIndex(datum.datumIndex) },
            ]);
            await waitForChartStability(chart!);

            expectColoradoGap(chart!, 4, 4);
        });

        it('keeps the gap at 4px for a region its itemStyler gives a thicker outline (V5)', async () => {
            await create(
                timeZoneOptions({
                    gaps: allGaps(4),
                    series: {
                        itemStyler: ({ datum }: { datum: { name: string } }) =>
                            datum.name === 'Colorado' ? { strokeWidth: 3 } : {},
                    },
                })
            );
            expectColoradoGap(chart!, 4, 4);
        });

        it('keeps the gap at 4px for a region its itemStyler thickens only while highlighted (V5)', async () => {
            await create(
                timeZoneOptions({
                    gaps: allGaps(4),
                    series: {
                        highlight: { highlightedItem: { glow: { enabled: false } } },
                        itemStyler: ({ datum, highlightState }: { datum: { name: string }; highlightState: string }) =>
                            datum.name === 'Colorado' && highlightState === 'highlighted-item'
                                ? { strokeWidth: 3 }
                                : {},
                    },
                })
            );
            expectColoradoGap(chart!, 4, 2);
            await hoverNode(chart!, datumOf(chart!, 'Colorado'));
            expectColoradoGap(chart!, 4, 4);
        });

        it('covers spread px of the gap with the default hover glow, and moves no neighbour (V19, D-18a)', async () => {
            await create(timeZoneOptions({ gaps: allGaps(4) }));
            const utahBefore = nodeOf(chart!, 'Utah').projectedGeometry;
            const resting = stripAcross(chart!, readPixels(chart!), 'Utah', 'Colorado');

            await hoverNode(chart!, datumOf(chart!, 'Colorado'));
            const hovered = stripAcross(chart!, readPixels(chart!), 'Utah', 'Colorado');

            expect(nodeOf(chart!, 'Utah').projectedGeometry).toBe(utahBefore);
            // The glow is the neutral grey of the default theme. The reading counts it as chart background where it is a
            // lighter grey than the outline, so it shows as the gap losing less than `spread` (1px): the outline
            // centred on the fill edge hides the inner half of it, so 0.5px of it lies in the gap.
            expect(resting.background - hovered.background).toBeGreaterThan(0.2);
            expect(resting.background - hovered.background).toBeLessThanOrEqual(1);
        });
    });

    describe('zoom and pan (V6, D-7)', () => {
        const FOUR_CORNERS: Position = [-109.046, 37];
        /** The four borders that meet at the Four Corners, each read about half a degree from it. */
        const ARMS = [
            ['Utah', 'Colorado'],
            ['Arizona', 'New Mexico'],
            ['Utah', 'Arizona'],
            ['Colorado', 'New Mexico'],
        ] as const;

        interface ZoomWindow {
            x: { min: number; max: number };
            y: { min: number; max: number };
        }
        const applyZoom = async (window: ZoomWindow) => {
            deproxy(chart!).ctx.zoomManager!.updateZoom(
                { source: 'state-change', sourceDetail: 'unspecified' },
                window
            );
            await waitForChartStability(chart!);
        };
        /** Zooms `ratio` times in on the Four Corners, from the unzoomed chart; returns the window it zoomed to. */
        const zoomTo = async (ratio: number): Promise<ZoomWindow> => {
            const view = deproxy(chart!).ctx.zoomManager!.panToBBoxZoomRect!;
            const { x, y } = canvasPoint(chart!, FOUR_CORNERS);
            const cx = (x - view.x) / view.width;
            const cy = 1 - (y - view.y) / view.height;
            const half = 1 / ratio / 2;
            const window = { x: { min: cx - half, max: cx + half }, y: { min: cy - half, max: cy + half } };
            await applyZoom(window);
            return window;
        };

        const expectArms = () => {
            const pixels = readPixels(chart!);
            for (const [first, second] of ARMS) {
                expectStrip(
                    stripAcross(chart!, pixels, first, second, { near: FOUR_CORNERS }).background,
                    4,
                    `${first} to ${second}`
                );
            }
        };

        it.each([2, 4, 8])('keeps every gap 4px wide at zoom x%i, and after a pan', async (ratio) => {
            await create(timeZoneOptions({ gaps: allGaps(4), chart: { zoom: { enabled: true } } }));
            const { x, y } = await zoomTo(ratio);
            expectArms();

            // Pan by a fifth of the window, which moves the Four Corners off the middle of the view.
            const shift = (x.max - x.min) / 5;
            await applyZoom({ x: { min: x.min + shift, max: x.max + shift }, y });
            expectArms();
        });

        it('shows the strips of the four borders crossing at the Four Corners (V6)', async () => {
            await create(timeZoneOptions({ gaps: allGaps(4), chart: { zoom: { enabled: true } } }));
            await zoomTo(8);
            const { x, y } = canvasPoint(chart!, FOUR_CORNERS);
            const centre = pixelBox(readPixels(chart!), x, y, 1, 1);
            expect(centre.every((channel) => channel >= 250)).toBe(true);
        });
    });

    // -----------------------------------------------------------------------------------------------------------------
    // Neighbours follow the chart
    // -----------------------------------------------------------------------------------------------------------------

    describe('neighbours follow the chart (D-3, D-3a, DR2-3, DR2-4, V13, V21)', () => {
        /** `h + s`: half of a 4px gap and half of a 1px outline. */
        const MOVED = 2.5;
        const NEVADA_UTAH = sharedBorder(usTopology, 'Nevada', 'Utah').at;
        const NEVADA_CALIFORNIA = sharedBorder(usTopology, 'California', 'Nevada').at;
        const WYOMING_NEBRASKA = sharedBorder(usTopology, 'Wyoming', 'Nebraska').at;
        const WYOMING_COLORADO = sharedBorder(usTopology, 'Wyoming', 'Colorado').at;
        const PACIFIC_ONLY = { pacific: 4, mountain: 0, central: 0, eastern: 0 };

        const expectMoved = (actual: number, expected: number, what: string) => {
            expect(
                Math.abs(actual - expected),
                `${what} moved ${actual.toFixed(2)}px, expected ${expected}px`
            ).toBeLessThan(0.05);
        };

        describe.each(['chart', 'series'] as const)('with %s-level topology', (level) => {
            const topologyCopies = () => ZONES.map(() => structuredClone(usTopology));
            const build = (options: AgChartOptions, copies = topologyCopies()) =>
                level === 'series' ? withSeriesTopology(options, copies) : options;

            it('regrows the borders of a series hidden from the legend, and back (D-3, V13)', async () => {
                await create(build(timeZoneOptions({ gaps: allGaps(4), chart: { legend: { enabled: true } } })));
                expectMoved(recession(chart!, 'Nevada', NEVADA_UTAH), MOVED, 'Nevada towards Utah');
                expectMoved(recession(chart!, 'Nebraska', WYOMING_NEBRASKA), MOVED, 'Nebraska towards Wyoming');

                await clickLegendItem(chart!, 1);
                await waitForChartStability(chart!);

                // Mountain draws nothing now, so Pacific and Central reach the old Mountain borders, as at a coastline.
                expect(getSeriesNodeData(chart!, 1)).toHaveLength(0);
                expectMoved(recession(chart!, 'Nevada', NEVADA_UTAH), 0, 'Nevada towards Utah');
                expectMoved(recession(chart!, 'Nebraska', WYOMING_NEBRASKA), 0, 'Nebraska towards Wyoming');
                // Borders between series that are still shown keep their gap.
                expectMoved(recession(chart!, 'Nevada', NEVADA_CALIFORNIA), MOVED, 'Nevada towards California');

                await clickLegendItem(chart!, 1);
                await waitForChartStability(chart!);
                expectMoved(recession(chart!, 'Nevada', NEVADA_UTAH), MOVED, 'Nevada towards Utah, shown again');
            });

            it('re-insets the neighbours of a series whose gap changes, though their options did not (V21, D-3a)', async () => {
                // One set of copies throughout, so a delta changes no topology.
                const copies = topologyCopies();
                const make = (gaps: Partial<Record<Zone, number>>, data = mountain) =>
                    build(timeZoneOptions({ gaps, zoneSeries: { mountain: { data } } }), copies);

                await create(make(allGaps(0)));
                expectMoved(recession(chart!, 'Utah', NEVADA_UTAH), 0, 'Utah before');

                // Only Pacific's gap changes. Mountain's own options are as they were.
                const gapIndex = vi.spyOn(MapShapeGapIndex.prototype, 'build');
                await chart!.updateDelta(make(PACIFIC_ONLY));
                await waitForChartStability(chart!);
                expect(mapSeries(chart!, 1).options.gap).toBe(0);
                // Utah has gap 0, so its fill moves by half its 1px outline towards Nevada, and Nevada by 2px + that.
                expectMoved(recession(chart!, 'Utah', NEVADA_UTAH), 0.5, 'Utah');
                expectMoved(recession(chart!, 'Nevada', NEVADA_UTAH), MOVED, 'Nevada');
                // Borders no gapped series touches stay put.
                expectMoved(recession(chart!, 'Wyoming', WYOMING_NEBRASKA), 0, 'Wyoming towards Nebraska');
                expect(gapIndex).toHaveBeenCalledTimes(1);

                // Only Mountain's data changes: Utah leaves, and Nevada's side of that border becomes a coast.
                await chart!.updateDelta(
                    make(
                        PACIFIC_ONLY,
                        mountain.filter(({ name }) => name !== 'Utah')
                    )
                );
                await waitForChartStability(chart!);
                expect(mapSeries(chart!, 0).options.gap).toBe(4);
                expectMoved(recession(chart!, 'Nevada', NEVADA_UTAH), 0, 'Nevada towards the removed Utah');
                expectMoved(recession(chart!, 'Nevada', NEVADA_CALIFORNIA), MOVED, 'Nevada towards California');
                expect(gapIndex).toHaveBeenCalledTimes(2);
            });
        });

        it('rebuilds the index only when its inputs change, not for a hover or a zoom (DR2-3)', async () => {
            await create(timeZoneOptions({ gaps: allGaps(4), chart: { zoom: { enabled: true } } }));
            const build = vi.spyOn(MapShapeGapIndex.prototype, 'build');
            const inset = vi.spyOn(MapShapeGapNeighbours.prototype, 'getPolygonRingInfo');
            const ringInfo = vi.spyOn(MapShapeGapIndex.prototype, 'getPolygonRingInfo');

            await hoverNode(chart!, datumOf(chart!, 'Colorado'));
            deproxy(chart!).ctx.zoomManager!.updateZoom(
                { source: 'state-change', sourceDetail: 'unspecified' },
                { x: { min: 0.2, max: 0.6 }, y: { min: 0.2, max: 0.6 } }
            );
            await waitForChartStability(chart!);

            // The zoom moved the scale, so every region insets again, from the index it already has and from the ring
            // infos already cached for each source polygon.
            expect(inset).toHaveBeenCalled();
            expect(build).not.toHaveBeenCalled();
            expect(ringInfo).not.toHaveBeenCalled();
        });

        it('hands the one index to every map-shape series (DR2-3)', async () => {
            await create(timeZoneOptions({ gaps: allGaps(4) }));
            const [first, ...rest] = ZONES.map((_, i) => mapSeries(chart!, i).gapNeighbours);
            expect(first, 'the chart hands one out').toBeInstanceOf(MapShapeGapNeighbours);
            expect(rest).toHaveLength(ZONES.length - 1);
            for (const neighbours of rest) {
                expect(neighbours).toBe(first);
            }
        });

        describe('rows without a colour value (V20, DR2-4)', () => {
            const DROPPED = ['Colorado', 'Utah'];
            const fills = [{ color: '#ff0000' }, { color: '#ff0000' }];
            const gdpOptions = (colorScale: Record<string, unknown> = {}) =>
                ({
                    topology: usTopology,
                    legend: { enabled: false },
                    data: usData.map((row) => (DROPPED.includes(row.name) ? { name: row.name, code: row.code } : row)),
                    series: [
                        {
                            type: 'map-shape',
                            idKey: 'name',
                            colorKey: 'gdp',
                            colorScale: { fills, ...colorScale },
                            stroke: '#222222',
                            strokeWidth: 1,
                            gap: 4,
                        },
                    ],
                }) as AgChartOptions;
            const IDAHO_WYOMING = sharedBorder(usTopology, 'Idaho', 'Wyoming').at;

            it('treats the border with a dropped state as a coastline, and opens the others (V20)', async () => {
                await create(gdpOptions());
                const names = getSeriesNodeData<MapShapeNodeDatum>(chart!).map(({ idValue }) => idValue);
                expect(names).toHaveLength(usData.length - DROPPED.length);
                expect(names).not.toContain('Colorado');

                expectMoved(
                    recession(chart!, 'Wyoming', WYOMING_COLORADO, 0),
                    0,
                    'Wyoming towards the dropped Colorado'
                );
                expectMoved(recession(chart!, 'Wyoming', IDAHO_WYOMING, 0), MOVED, 'Wyoming towards Idaho');
                const strip = measureStrip(readPixels(chart!), canvasPoint(chart!, IDAHO_WYOMING), 'x', {
                    before: RED,
                    after: RED,
                });
                expectStrip(strip.background, 4, 'Idaho to Wyoming');
            });

            it('draws the rows again, and re-insets their neighbours, when missingDataFill is set (DR2-4)', async () => {
                await create(gdpOptions());
                expectMoved(recession(chart!, 'Wyoming', WYOMING_COLORADO, 0), 0, 'Wyoming before');

                await chart!.updateDelta(gdpOptions({ missingDataFill: '#ff0000' }));
                await waitForChartStability(chart!);
                expect(getSeriesNodeData<MapShapeNodeDatum>(chart!).map(({ idValue }) => idValue)).toContain(
                    'Colorado'
                );
                expectMoved(
                    recession(chart!, 'Wyoming', WYOMING_COLORADO, 0),
                    MOVED,
                    'Wyoming towards the filled Colorado'
                );
                expectMoved(recession(chart!, 'Colorado', WYOMING_COLORADO, 0), MOVED, 'Colorado towards Wyoming');
            });

            it('drops the rows again, and regrows their neighbours, when missingDataFill is removed (DR2-4)', async () => {
                await create(gdpOptions({ missingDataFill: '#ff0000' }));
                expectMoved(recession(chart!, 'Wyoming', WYOMING_COLORADO, 0), MOVED, 'Wyoming before');

                await chart!.update(gdpOptions());
                await waitForChartStability(chart!);
                expect(getSeriesNodeData<MapShapeNodeDatum>(chart!).map(({ idValue }) => idValue)).not.toContain(
                    'Colorado'
                );
                expectMoved(
                    recession(chart!, 'Wyoming', WYOMING_COLORADO, 0),
                    0,
                    'Wyoming towards the dropped Colorado'
                );
            });
        });
    });

    describe('a series drawn under the gapped ones does not count (D-2, V15)', () => {
        it('leaves the coast of a gapped series where it was beside a map-shape-background', async () => {
            const CALIFORNIA_NEVADA = sharedBorder(usTopology, 'California', 'Nevada').at;
            const CALIFORNIA_ARIZONA = sharedBorder(usTopology, 'California', 'Arizona').at;
            await create({
                topology: usTopology,
                legend: { enabled: false },
                series: [
                    { type: 'map-shape-background' },
                    { type: 'map-shape', data: pacific, idKey: 'name', stroke: '#222222', strokeWidth: 1, gap: 4 },
                ],
            } as AgChartOptions);

            // California and Nevada are both in the series, so their border opens. Arizona is only in the background:
            // from the series' side its border is a coastline.
            expect(recession(chart!, 'California', CALIFORNIA_NEVADA, 1)).toBeCloseTo(2.5, 1);
            expect(recession(chart!, 'California', CALIFORNIA_ARIZONA, 1)).toBeLessThan(0.05);
        });
    });

    // -----------------------------------------------------------------------------------------------------------------
    // A region narrower than its share of the gap
    // -----------------------------------------------------------------------------------------------------------------

    /** Degrees wide: about 3px on the chart, well under the 5px the two sides ask for. */
    const SLIVER = 0.1;
    const collapsedOptions = (series: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) =>
        ({
            ...syntheticOptions(
                [
                    feature('West', [rect(-10, -10, 0, 10)]),
                    feature('Sliver', [rect(0, -10, SLIVER, 10)]),
                    feature('East', [rect(SLIVER, -10, 10, 10)]),
                ],
                series
            ),
            ...extra,
        }) as AgChartOptions;

    describe('regions narrower than their share of the gap (D-15, D-16, D-17, D-19, V8)', () => {
        const middle: Position = [SLIVER / 2, 0];

        it('is narrow enough to collapse (the fixture holds)', async () => {
            await create(collapsedOptions());
            const [left, right] = [canvasPoint(chart!, [0, 0]).x, canvasPoint(chart!, [SLIVER, 0]).x];
            expect(right - left).toBeGreaterThan(1);
            expect(right - left).toBeLessThan(5);
        });

        it('keeps the node of a region that collapsed, with no rings (D-15, D-16)', async () => {
            await create(collapsedOptions());
            const sliver = datumOf(chart!, 'Sliver', 0);

            expect(sliver.drawnGeometry).toEqual({ type: 'Polygon', coordinates: [] });
            expect(sliver.projectedGeometry).toEqual(expect.objectContaining({ type: 'Polygon' }));
            expect(collectPolygons(sliver.projectedGeometry!)[0].length).toBeGreaterThan(0);

            const node = nodeOf(chart!, 'Sliver', 0);
            expect(node.isDrawnEmpty()).toBe(true);
            expect(node.pickGeometry).toEqual(sliver.projectedGeometry);
            expect(nodeOf(chart!, 'West', 0).isDrawnEmpty()).toBe(false);
        });

        it('still counts as a neighbour, so the regions either side are inset (D-1, question A)', async () => {
            await create(collapsedOptions());
            expect(recession(chart!, 'West', [0, 0], 0)).toBeCloseTo(2.5, 1);
            expect(recession(chart!, 'East', [SLIVER, 0], 0)).toBeCloseTo(2.5, 1);
        });

        it('draws no ink where it was', async () => {
            await create(collapsedOptions());
            const { x, y } = canvasPoint(chart!, middle);
            // Both sides inset by 2.5px: the 3px sliver and 2.5px either side are background, with the outlines beyond.
            expect(pixelAt(readPixels(chart!), x, y)).toEqual([255, 255, 255]);
        });

        it('still picks, for hover, tooltip, click, double-click and context menu (D-17, V8)', async () => {
            const seen = { clicks: [] as string[], doubleClicks: [] as string[], menus: [] as string[] };
            await create(
                collapsedOptions(
                    {
                        nodeClickRange: 'exact',
                        tooltip: { range: 'exact' },
                        listeners: {
                            seriesNodeClick: ({ datum }: { datum: { name: string } }) => seen.clicks.push(datum.name),
                            seriesNodeDoubleClick: ({ datum }: { datum: { name: string } }) =>
                                seen.doubleClicks.push(datum.name),
                        },
                    },
                    {
                        contextMenu: {
                            enabled: true,
                            getItems: ({
                                allShowOnParams,
                            }: {
                                allShowOnParams: { showOn: string; datum?: { name: string } }[];
                            }) => {
                                for (const params of allShowOnParams) {
                                    if (params.showOn === 'series-node') seen.menus.push(params.datum!.name);
                                }
                                return [{ label: 'item' }];
                            },
                        },
                    }
                )
            );
            const { x, y } = canvasPoint(chart!, middle);

            await hoverAction(x, y)(chart!);
            await waitForChartStability(chart!, MIN_TOOLTIP_HIDE_DELAY);
            expect(hoveredName(chart!)).toBe('Sliver');
            expect(isTooltipVisible(deproxy(chart!))).toBe(true);

            await clickAction(x, y)(chart!);
            await waitForChartStability(chart!);
            expect(seen.clicks).toEqual(['Sliver']);

            await doubleClickAction(x, y)(chart!);
            await waitForChartStability(chart!);
            expect(seen.doubleClicks).toEqual(['Sliver']);

            await contextMenuAction(x, y)(chart!);
            await waitForChartStability(chart!);
            expect(seen.menus).toEqual(['Sliver']);
        });

        // `pickNodes` tries an exact shape match before it measures distance, so a point inside the region is found by
        // containment whatever the range. A point beyond the coast is not, and there the distance is to the undrawn
        // region: a collapsed one has no drawn distance at all.
        it.each(['nearest', 10] as const)(
            'is the nearest region to a point just beyond the coast it ends at, with a %s range (D-17, V8)',
            async (range) => {
                const clicks: string[] = [];
                // Twice as wide as it is tall, so the chart leaves room above the coast.
                await create(
                    syntheticOptions(
                        [
                            feature('West', [rect(-10, -5, 0, 5)]),
                            feature('Sliver', [rect(0, -5, SLIVER, 5)]),
                            feature('East', [rect(SLIVER, -5, 10, 5)]),
                        ],
                        {
                            nodeClickRange: range,
                            tooltip: { range },
                            listeners: {
                                seriesNodeClick: ({ datum }: { datum: { name: string } }) => clicks.push(datum.name),
                            },
                        }
                    )
                );
                expect(datumOf(chart!, 'Sliver', 0).drawnGeometry, 'the sliver collapsed').toEqual({
                    type: 'Polygon',
                    coordinates: [],
                });
                // 2px past the top of the sliver: 2px from it, but 2.8px from the corner of West and of East.
                const [x, y] = [canvasPoint(chart!, middle).x, canvasPoint(chart!, [middle[0], 5]).y - 2];

                await hoverAction(x, y)(chart!);
                await waitForChartStability(chart!, MIN_TOOLTIP_HIDE_DELAY);
                expect(hoveredName(chart!), 'hover').toBe('Sliver');
                expect(isTooltipVisible(deproxy(chart!)), 'tooltip').toBe(true);

                await clickAction(x, y)(chart!);
                await waitForChartStability(chart!);
                expect(clicks, 'click').toEqual(['Sliver']);
            }
        );

        it('keeps the tooltip anchor and tooltip content on the undrawn region, without throwing (D-15, D-16)', async () => {
            await create(collapsedOptions({ gap: 0 }));
            const base = datumOf(chart!, 'Sliver', 0);
            const midPoint = mapSeries(chart!, 0).datumMidPoint(base);
            chart!.destroy();

            await create(collapsedOptions());
            const series = mapSeries(chart!, 0);
            const sliver = datumOf(chart!, 'Sliver', 0);
            expect(() => series.datumMidPoint(sliver)).not.toThrow();
            expect(series.datumMidPoint(sliver)).toEqual(midPoint);
            expect(Number.isFinite(midPoint!.x)).toBe(true);
            expect(series.getTooltipContent(sliver.datumIndex)).toBeDefined();
        });

        it('has the bounds of its undrawn outline as its focus box, and a drawn region its drawn outline (D-19, V12)', async () => {
            await create(collapsedOptions());
            const series = mapSeries(chart!, 0);
            const focus = (name: string) =>
                series.pickFocus({
                    datumIndex: datumOf(chart!, name, 0).datumIndex,
                    datumIndexDelta: 0,
                    otherIndex: 0,
                    otherIndexDelta: 0,
                });

            const collapsed = focus('Sliver')!.bounds as BBox;
            expect(collapsed).toBeInstanceOf(BBox);
            const [topLeft, bottomRight] = [canvasPoint(chart!, [0, 10]), canvasPoint(chart!, [SLIVER, -10])];
            expect(collapsed.x).toBeCloseTo(topLeft.x, 3);
            expect(collapsed.y).toBeCloseTo(topLeft.y, 3);
            expect(collapsed.width).toBeCloseTo(bottomRight.x - topLeft.x, 3);
            expect(collapsed.height).toBeCloseTo(bottomRight.y - topLeft.y, 3);

            const west = focus('West')!.bounds;
            expect(west).toBe(nodeOf(chart!, 'West', 0));
            expect((west as GeoGeometry).projectedGeometry).toBe(datumOf(chart!, 'West', 0).drawnGeometry);
        });

        it('has the focus box of Texas trace its drawn outline (V12)', async () => {
            await create(timeZoneOptions({ gaps: allGaps(4) }));
            const texas = datumOf(chart!, 'Texas');
            const { bounds } = mapSeries(chart!, seriesOf('Texas')).pickFocus({
                datumIndex: texas.datumIndex,
                datumIndexDelta: 0,
                otherIndex: 0,
                otherIndexDelta: 0,
            })!;
            expect(bounds).toBe(nodeOf(chart!, 'Texas'));
            const drawn = (bounds as GeoGeometry).projectedGeometry;
            expect(drawn).toBe(texas.drawnGeometry);
            expect(drawn).not.toBe(texas.projectedGeometry);
            expect(extent(drawn).x0).toBeGreaterThan(extent(texas.projectedGeometry).x0);
        });

        it('is as drawn without a neighbour, however small, and still picks (V7)', async () => {
            await create(southernAfricaItaly());
            for (const name of ['Vatican City', 'San Marino']) {
                const datum = datumOf(chart!, name, 0);
                const node = nodeOf(chart!, name, 0);
                const mid = mapSeries(chart!, 0).datumMidPoint(datum)!;
                const { canvasX, canvasY } = Transformable.toCanvasPoint(
                    mapSeries(chart!, 0).contentGroup,
                    mid.x,
                    mid.y
                );

                await hoverAction(canvasX, canvasY)(chart!);
                await waitForChartStability(chart!);
                expect(hoveredName(chart!), `${name} picks at its mid point`).toBe(name);
                // A region either drawn small or, when narrower than its share, not drawn: never a broken one.
                expect(node.isDrawnEmpty() || extent(datum.drawnGeometry).x1 > extent(datum.drawnGeometry).x0).toBe(
                    true
                );
            }
        });
    });

    // -----------------------------------------------------------------------------------------------------------------
    // A region that is a GeometryCollection: user GeoJSON may hold one, and its polygons sit inside nested members.
    // -----------------------------------------------------------------------------------------------------------------

    /** `Coll` is a `Polygon` sliver then a `MultiPolygon` of a second sliver and a big part: three polygons, one drawn. */
    const collectionOptions = (series: Record<string, unknown> = {}) =>
        syntheticOptions(
            [
                feature('West', [rect(-10, -10, 0, 10)]),
                feature('Middle', [rect(SLIVER, -10, 20, 10)]),
                feature('East', [rect(20 + SLIVER, -10, 30, 10)]),
                collectionFeature(
                    'Coll',
                    polygonOf(rect(0, -10, SLIVER, 10)),
                    multiPolygonOf([rect(20, -10, 20 + SLIVER, 10)], [rect(30, -10, 40, 10)])
                ),
            ],
            series
        );

    /** `Gone` is a `Polygon` and a `MultiPolygon` of three slivers, each between two neighbours: nothing of it is drawn. */
    const goneOptions = (series: Record<string, unknown> = {}) =>
        syntheticOptions(
            [
                feature('A', [rect(-10, -10, 0, 10)]),
                feature('B', [rect(SLIVER, -10, 10, 10)]),
                feature('C', [rect(10 + SLIVER, -10, 20, 10)]),
                feature('D', [rect(20 + SLIVER, -10, 30, 10)]),
                collectionFeature(
                    'Gone',
                    polygonOf(rect(0, -10, SLIVER, 10)),
                    multiPolygonOf([rect(10, -10, 10 + SLIVER, 10)], [rect(20, -10, 20 + SLIVER, 10)])
                ),
            ],
            series
        );
    const GONE_MIDDLES: Position[] = [
        [SLIVER / 2, 0],
        [10 + SLIVER / 2, 0],
        [20 + SLIVER / 2, 0],
    ];

    describe('a region that is a GeometryCollection (DR2-7, D-15, D-17, D-19, D-20)', () => {
        it('keeps each collapsed part as no rings at its index, and insets the part that survives (D-15)', async () => {
            await create(collectionOptions());
            const coll = datumOf(chart!, 'Coll', 0);
            const drawn = coll.drawnGeometry!;
            const projected = coll.projectedGeometry!;

            expect(drawn.type).toBe('GeometryCollection');
            expect(collectPolygons(projected)).toHaveLength(3);
            const [first, second, big] = collectPolygons(drawn);
            expect(first, 'the Polygon sliver').toEqual([]);
            expect(second, 'the sliver inside the MultiPolygon').toEqual([]);
            expect(big.length, 'the big part is drawn').toBeGreaterThan(0);

            // The big part borders East along x = 30 only: that edge moved in by half the gap and stroke, the rest did not.
            const [undrawnBig] = collectPolygons(projected).slice(2);
            expect(extent(polygonOf(...big)).x0 - extent(polygonOf(...undrawnBig)).x0).toBeCloseTo(2.5, 1);
            expect(extent(polygonOf(...big)).x1).toBeCloseTo(extent(polygonOf(...undrawnBig)).x1, 6);
        });

        it('finds the drawn copy of each polygon, nested or not, and nothing for a polygon that is not part of it', async () => {
            await create(collectionOptions());
            const { drawnGeometry, projectedGeometry } = datumOf(chart!, 'Coll', 0);
            const drawn = collectPolygons(drawnGeometry!);

            for (const [i, polygon] of collectPolygons(projectedGeometry!).entries()) {
                expect(findDrawnPolygon(projectedGeometry!, drawnGeometry!, polygon), `polygon ${i}`).toBe(drawn[i]);
            }
            const foreign = collectPolygons(datumOf(chart!, 'Middle', 0).projectedGeometry!)[0];
            expect(findDrawnPolygon(projectedGeometry!, drawnGeometry!, foreign)).toBeUndefined();
        });

        it('fits the label inside the drawn copy of the largest part (D-20)', async () => {
            await create(collectionOptions({ labelKey: 'name', label: { enabled: true, fontSize: 12 } }));
            const texts = Selection.selectByClass(getSeriesGroup(chart!, 'contentGroup', 0), Text).filter(
                (text) => (text.datum as { idValue?: string } | undefined)?.idValue === 'Coll'
            );
            expect(texts, "Coll's label is drawn").toHaveLength(1);

            const box = Transformable.toCanvas(texts[0], texts[0].getBBox());
            const big = collectPolygons(datumOf(chart!, 'Coll', 0).drawnGeometry!)[2];
            const contentGroup = mapSeries(chart!, 0).contentGroup;
            const onCanvas = big.map((ring) =>
                ring.map(([px, py]): Position => {
                    const { canvasX, canvasY } = Transformable.toCanvasPoint(contentGroup, px, py);
                    return [canvasX, canvasY];
                })
            );
            for (const [x, y] of [
                [box.x, box.y],
                [box.x + box.width, box.y],
                [box.x, box.y + box.height],
                [box.x + box.width, box.y + box.height],
            ]) {
                expect(polygonDistance(onCanvas, x, y), `label corner (${x.toFixed(1)}, ${y.toFixed(1)})`).toBeLessThan(
                    0
                );
            }
            // And it is the big part, to the right of East, not either sliver.
            expect(box.x).toBeGreaterThan(canvasPoint(chart!, [30, 0]).x);
        });

        it('draws no ink and no label for a collection that collapsed entirely, and still picks it (D-17, D-20)', async () => {
            await create(
                goneOptions({
                    nodeClickRange: 'exact',
                    tooltip: { range: 'exact' },
                    labelKey: 'name',
                    label: { enabled: true, fontSize: 12 },
                })
            );
            const gone = datumOf(chart!, 'Gone', 0);
            expect(collectPolygons(gone.drawnGeometry!)).toEqual([[], [], []]);
            expect(collectPolygons(gone.projectedGeometry!).every((polygon) => polygon.length > 0)).toBe(true);
            expect(nodeOf(chart!, 'Gone', 0).isDrawnEmpty()).toBe(true);

            const names = Selection.selectByClass(getSeriesGroup(chart!, 'contentGroup', 0), Text).map(
                (text) => (text.datum as { idValue?: string } | undefined)?.idValue
            );
            expect(names).not.toContain('Gone');

            for (const at of GONE_MIDDLES) {
                const { x, y } = canvasPoint(chart!, at);
                await hoverAction(x, y)(chart!);
                await waitForChartStability(chart!);
                expect(hoveredName(chart!), `hover at ${at}`).toBe('Gone');
            }
        });

        it('has the bounds of its undrawn parts as the focus box of a collection that collapsed entirely (D-19)', async () => {
            await create(goneOptions());
            const series = mapSeries(chart!, 0);
            const { bounds } = series.pickFocus({
                datumIndex: datumOf(chart!, 'Gone', 0).datumIndex,
                datumIndexDelta: 0,
                otherIndex: 0,
                otherIndexDelta: 0,
            })!;

            expect(bounds).toBeInstanceOf(BBox);
            const [topLeft, bottomRight] = [canvasPoint(chart!, [0, 10]), canvasPoint(chart!, [20 + SLIVER, -10])];
            const box = bounds as BBox;
            expect(box.x).toBeCloseTo(topLeft.x, 3);
            expect(box.y).toBeCloseTo(topLeft.y, 3);
            expect(box.width).toBeCloseTo(bottomRight.x - topLeft.x, 3);
            expect(box.height).toBeCloseTo(bottomRight.y - topLeft.y, 3);
        });

        it('has the focus box of a collection with a drawn part trace what is drawn (D-19)', async () => {
            await create(collectionOptions());
            const { bounds } = mapSeries(chart!, 0).pickFocus({
                datumIndex: datumOf(chart!, 'Coll', 0).datumIndex,
                datumIndexDelta: 0,
                otherIndex: 0,
                otherIndexDelta: 0,
            })!;
            expect(bounds).toBe(nodeOf(chart!, 'Coll', 0));
            expect(nodeOf(chart!, 'Coll', 0).isDrawnEmpty()).toBe(false);
        });
    });

    describe('picking each half of a gap (D-17, V2)', () => {
        const PAIRS = [
            ['Utah', 'Colorado'],
            ['Wyoming', 'Nebraska'],
        ] as const;

        describe.each(['exact', 'nearest'] as const)('with a %s range', (range) => {
            const seen = { clicks: [] as string[], doubleClicks: [] as string[], menus: [] as string[] };
            beforeEach(() => {
                seen.clicks.length = seen.doubleClicks.length = seen.menus.length = 0;
            });

            const open = () =>
                create(
                    timeZoneOptions({
                        gaps: allGaps(4),
                        series: {
                            nodeClickRange: range,
                            tooltip: { range },
                            listeners: {
                                seriesNodeClick: ({ datum }: { datum: { name: string } }) =>
                                    seen.clicks.push(datum.name),
                                seriesNodeDoubleClick: ({ datum }: { datum: { name: string } }) =>
                                    seen.doubleClicks.push(datum.name),
                            },
                        },
                        chart: {
                            contextMenu: {
                                enabled: true,
                                getItems: ({
                                    allShowOnParams,
                                }: {
                                    allShowOnParams: { showOn: string; datum?: { name: string } }[];
                                }) => {
                                    for (const params of allShowOnParams) {
                                        if (params.showOn === 'series-node') seen.menus.push(params.datum!.name);
                                    }
                                    return [{ label: 'item' }];
                                },
                            },
                        },
                    })
                );

            const CASES = PAIRS.flatMap(([first, second]) => [
                { first, second, side: 'first' as const },
                { first, second, side: 'second' as const },
            ]);

            // 1px either side of the border is inside the 4px strip of background, so it is in neither drawn region. A
            // context menu stays open once it is shown, so each side gets its own chart.
            it.each(CASES)(
                'gives $side of $first and $second the half of the gap on its own side',
                async ({ first, second, side }) => {
                    await open();
                    const border = sharedBorder(usTopology, first, second);
                    const centre = canvasPoint(chart!, border.at, seriesOf(first));
                    const step = side === 'first' ? -1 : 1;
                    const x = centre.x + (border.axis === 'x' ? step : 0);
                    const y = centre.y + (border.axis === 'y' ? step : 0);
                    const name = side === 'first' ? first : second;
                    expect(pixelAt(readPixels(chart!), x, y), `${name}'s half is in the gap`).toEqual([255, 255, 255]);

                    await hoverAction(x, y)(chart!);
                    await waitForChartStability(chart!, MIN_TOOLTIP_HIDE_DELAY);
                    expect(hoveredName(chart!), 'hover').toBe(name);
                    expect(isTooltipVisible(deproxy(chart!)), 'tooltip').toBe(true);

                    await clickAction(x, y)(chart!);
                    await waitForChartStability(chart!);
                    expect(seen.clicks, 'click').toEqual([name]);

                    await doubleClickAction(x, y)(chart!);
                    await waitForChartStability(chart!);
                    expect(seen.doubleClicks, 'double-click').toEqual([name]);

                    await contextMenuAction(x, y)(chart!);
                    await waitForChartStability(chart!);
                    expect(seen.menus, 'context menu').toEqual([name]);
                }
            );
        });

        // `Left` has `gap: 8` and `Right` has `gap: 0`, so Left's corner at the coast is drawn 4.5px in from the border and
        // Right's 0.5px. A point 1px to Left's side of the border and 4px past the coast is 4px from Left and 4.1px from
        // Right by the undrawn geometry, but 5.3px from Left's drawn corner and 4.3px from Right's.
        describe.each(['nearest', 10] as const)(
            'beyond the coast where the halves of a gap differ, with a %s range',
            (range) => {
                it('picks the region it is nearest as undrawn, not as drawn (D-17)', async () => {
                    const clicks: string[] = [];
                    await create({
                        topology: {
                            type: 'FeatureCollection',
                            features: [feature('Left', [rect(-10, -5, 0, 5)]), feature('Right', [rect(0, -5, 10, 5)])],
                        },
                        legend: { enabled: false },
                        series: [
                            ['Left', 8],
                            ['Right', 0],
                        ].map(([name, gap]) => ({
                            type: 'map-shape',
                            data: [{ name }],
                            idKey: 'name',
                            fill: name === 'Left' ? '#ff0000' : '#0000ff',
                            stroke: '#222222',
                            strokeWidth: 1,
                            gap,
                            nodeClickRange: range,
                            tooltip: { range },
                            listeners: {
                                seriesNodeClick: ({ datum }: { datum: { name: string } }) => clicks.push(datum.name),
                            },
                        })),
                    } as AgChartOptions);
                    const [left, right] = [datumOf(chart!, 'Left', 0), datumOf(chart!, 'Right', 1)];
                    expect(extent(left.projectedGeometry).x1 - extent(left.drawnGeometry).x1).toBeCloseTo(4.5, 1);
                    expect(extent(right.drawnGeometry).x0 - extent(right.projectedGeometry).x0).toBeCloseTo(0.5, 1);

                    const border = canvasPoint(chart!, [0, 5]);
                    const [x, y] = [border.x - 1, border.y - 4];
                    await hoverAction(x, y)(chart!);
                    await waitForChartStability(chart!, MIN_TOOLTIP_HIDE_DELAY);
                    expect(hoveredName(chart!), 'hover').toBe('Left');
                    expect(isTooltipVisible(deproxy(chart!)), 'tooltip').toBe(true);

                    await clickAction(x, y)(chart!);
                    await waitForChartStability(chart!);
                    expect(clicks, 'click').toEqual(['Left']);
                });
            }
        );

        it('picks no region beyond the coast it has, as without a gap (exact)', async () => {
            await create(
                timeZoneOptions({ gaps: allGaps(4), series: { nodeClickRange: 'exact', tooltip: { range: 'exact' } } })
            );
            const offshore = canvasPoint(chart!, [-125.5, 40]);
            await hoverAction(offshore.x, offshore.y)(chart!);
            await waitForChartStability(chart!, MIN_TOOLTIP_HIDE_DELAY);
            expect(hoveredName(chart!)).toBeUndefined();
        });
    });

    // -----------------------------------------------------------------------------------------------------------------
    // Labels
    // -----------------------------------------------------------------------------------------------------------------

    describe('labels stay inside the drawn region (AC6, D-20, D-21, V11)', () => {
        /** The label nodes a series drew: map-shape keeps them in its content group, next to the shapes. */
        const labelled = (seriesIndex: number) =>
            Selection.selectByClass(getSeriesGroup(chart!, 'contentGroup', seriesIndex), Text);

        /** Whether a canvas point is inside one of the region's drawn polygons, its holes left out. */
        const insideDrawn = (name: string, seriesIndex: number, x: number, y: number) => {
            const contentGroup = mapSeries(chart!, seriesIndex).contentGroup;
            return collectPolygons(datumOf(chart!, name, seriesIndex).drawnGeometry!)
                .filter(({ length }) => length > 0)
                .some((polygon) => {
                    const onCanvas = polygon.map((ring) =>
                        ring.map(([px, py]): Position => {
                            const { canvasX, canvasY } = Transformable.toCanvasPoint(contentGroup, px, py);
                            return [canvasX, canvasY];
                        })
                    );
                    return polygonDistance(onCanvas, x, y) < 0;
                });
        };

        /** Checks every label box, or only those on the canvas: labels of regions panned out of view are fitted loosely. */
        const expectLabelsInside = (seriesIndexes: number[], onCanvasOnly = false) => {
            const { width, height } = deproxy(chart!).ctx.scene.canvas;
            let checked = 0;
            for (const seriesIndex of seriesIndexes) {
                for (const text of labelled(seriesIndex)) {
                    const name = (text.datum as { idValue?: string } | undefined)?.idValue;
                    if (name == null) continue;
                    const box = Transformable.toCanvas(text, text.getBBox());
                    if (
                        onCanvasOnly &&
                        (box.x < 0 || box.y < 0 || box.x + box.width > width || box.y + box.height > height)
                    )
                        continue;
                    const corners = [
                        [box.x, box.y],
                        [box.x + box.width, box.y],
                        [box.x, box.y + box.height],
                        [box.x + box.width, box.y + box.height],
                    ];
                    for (const [x, y] of corners) {
                        expect(
                            insideDrawn(name, seriesIndex, x, y),
                            `${name}'s label box corner (${x.toFixed(1)}, ${y.toFixed(1)})`
                        ).toBe(true);
                    }
                    checked += 1;
                }
            }
            return checked;
        };

        it('puts every label box of the time-zone map inside its drawn state', async () => {
            await create(
                timeZoneOptions({
                    gaps: allGaps(4),
                    series: { labelKey: 'name', label: { enabled: true, fontSize: 9 } },
                })
            );
            // Most of the states are big enough for their name at this size.
            expect(expectLabelsInside([0, 1, 2, 3])).toBeGreaterThan(15);
        });

        it('keeps the labels fitted inside after the map is zoomed in', async () => {
            await create(
                timeZoneOptions({
                    gaps: allGaps(4),
                    series: { labelKey: 'name', label: { enabled: true, fontSize: 9 } },
                    chart: { zoom: { enabled: true } },
                })
            );
            const view = deproxy(chart!).ctx.zoomManager!.panToBBoxZoomRect!;
            const { x, y } = canvasPoint(chart!, [-105, 40]);
            const [cx, cy] = [(x - view.x) / view.width, 1 - (y - view.y) / view.height];
            deproxy(chart!).ctx.zoomManager!.updateZoom(
                { source: 'state-change', sourceDetail: 'unspecified' },
                { x: { min: cx - 0.15, max: cx + 0.15 }, y: { min: cy - 0.15, max: cy + 0.15 } }
            );
            await waitForChartStability(chart!);
            expect(expectLabelsInside([0, 1, 2, 3], true)).toBeGreaterThan(3);
        });

        it('fits a label to the same part of a multi-part region when an earlier part collapsed (D-15, D-20)', async () => {
            await create(
                syntheticOptions(
                    [
                        feature('West', [rect(-10, -10, 0, 10)]),
                        feature('Middle', [rect(SLIVER, -10, 20, 10)]),
                        // The first part is a sliver between West and Middle; the second is the big part Middle borders.
                        feature('Two', [rect(0, -10, SLIVER, 10)], [rect(20, -10, 40, 10)]),
                        feature('East', [rect(40, -10, 45, 10)]),
                    ],
                    { labelKey: 'name', label: { enabled: true, fontSize: 12 } }
                )
            );
            const two = datumOf(chart!, 'Two', 0);
            const [first, second] = collectPolygons(two.drawnGeometry!);
            expect(first, 'the first part collapsed').toEqual([]);
            expect(second.length, 'the second part is drawn').toBeGreaterThan(0);

            const texts = labelled(0).filter((text) => (text.datum as { idValue?: string })?.idValue === 'Two');
            expect(texts, "Two's label is drawn").toHaveLength(1);
            expect(expectLabelsInside([0])).toBeGreaterThan(1);
        });

        it('draws no label for a region whose labelled part collapsed, though another part survives (D-20)', async () => {
            await create(
                syntheticOptions(
                    [
                        feature('West', [rect(-10, -10, 0, 10)]),
                        // The sliver is the larger part, so it is the one the label is fitted to.
                        feature('Thin', [rect(0, -10, SLIVER, 10)], [rect(30, 30, 30.5, 30.5)]),
                        feature('East', [rect(SLIVER, -10, 10, 10)]),
                    ],
                    { labelKey: 'name', label: { enabled: true, fontSize: 12 } }
                )
            );
            const thin = datumOf(chart!, 'Thin', 0);
            const [sliver, island] = collectPolygons(thin.drawnGeometry!);
            expect(sliver).toEqual([]);
            // The island has no neighbour: the very array as projected (D-15).
            expect(island).toBe(collectPolygons(thin.projectedGeometry!)[1]);

            const names = labelled(0).map((text) => (text.datum as { idValue?: string })?.idValue);
            expect(names).not.toContain('Thin');
            expect(names).toEqual(expect.arrayContaining(['West', 'East']));
        });

        describe('a polygon that is still drawn but whose centroid falls in a grown hole (D-20)', () => {
            // `Host` is a square with `Enclave` set into its left side. The centroid of the host's exterior ring is the
            // middle of the square, 1px right of the enclave's edge, so inside the host. Gapped, the hole grows by 2.5px
            // and covers it. A fit there would be measured from inside the hole and put the label over the enclave.
            const hostOptions = () =>
                syntheticOptions(
                    [
                        feature('Host', [rect(-10, -10, 10, 10), reverseRing(rect(-9, -9, -0.03, 9))]),
                        feature('Enclave', [rect(-9, -9, -0.03, 9)]),
                    ],
                    { labelKey: 'name', label: { enabled: true, fontSize: 12 } }
                );

            it('has a centroid inside the host undrawn, and inside the grown hole drawn (the fixture holds)', async () => {
                await create(hostOptions());
                const host = datumOf(chart!, 'Host', 0);
                const [exterior, hole] = collectPolygons(host.drawnGeometry!)[0];
                expect(exterior.length).toBeGreaterThan(0);
                expect(hole.length).toBeGreaterThan(0);

                const centre = canvasPoint(chart!, [0, 0]);
                const holeEdge = canvasPoint(chart!, [-0.03, 0]).x;
                expect(centre.x - holeEdge, 'the centroid is just beyond the hole').toBeGreaterThan(0);
                expect(centre.x - holeEdge).toBeLessThan(2.5);
            });

            it('fits the label of the host in its drawn body, clear of the grown hole', async () => {
                await create(hostOptions());
                const hostLabel = labelled(0).filter(
                    (text) => (text.datum as { idValue?: string })?.idValue === 'Host'
                );
                expect(hostLabel, "Host's label is drawn").toHaveLength(1);

                const box = Transformable.toCanvas(hostLabel[0], hostLabel[0].getBBox());
                expect(box.x, 'right of the enclave').toBeGreaterThan(canvasPoint(chart!, [-0.03, 0]).x + 2.5);
                expect(expectLabelsInside([0])).toBe(2);
            });
        });
    });

    // -----------------------------------------------------------------------------------------------------------------
    // Other fixtures and snapshots
    // -----------------------------------------------------------------------------------------------------------------

    describe('Indonesia, Timor-Leste and Papua New Guinea (V10)', () => {
        const topology = indonesiaTimorTopology as unknown as { features: TopologyFeature[] };
        const options = () =>
            ({
                topology: indonesiaTimorTopology,
                legend: { enabled: false },
                series: [
                    {
                        type: 'map-shape',
                        data: topology.features.map(({ properties }) => ({ name: properties!.name })),
                        idKey: 'name',
                        fill: '#7fb3d5',
                        stroke: '#222222',
                        strokeWidth: 1,
                        gap: 4,
                    },
                ],
            }) as AgChartOptions;

        it('insets shared borders only, and leaves every other vertex where projection put it (D-10, AC2)', async () => {
            await create(options());

            const isShared = sharedEdgeTest(topology);

            let moved = 0;
            let untouched = 0;
            let unmovedPolygons = 0;
            for (const f of topology.features) {
                const name = f.properties!.name!;
                const datum = datumOf(chart!, name, 0);
                const projected = collectPolygons(datum.projectedGeometry!);
                const drawn = collectPolygons(datum.drawnGeometry!);
                for (const [p, polygon] of featurePolygons(f).entries()) {
                    if ([...ringEdges(polygon)].every(([a, b]) => !isShared(a, b))) {
                        // No moved edge: the same array, however small.
                        expect(drawn[p], `${name} polygon ${p}`).toBe(projected[p]);
                        unmovedPolygons += 1;
                    } else {
                        moved += 1;
                        if (drawn[p].length > 0) {
                            untouched += expectUnmovedVertices(
                                polygon,
                                projected[p],
                                drawn[p],
                                isShared,
                                `${name} polygon ${p}`
                            );
                        }
                    }
                }
            }
            expect(moved).toBeGreaterThan(0);
            expect(unmovedPolygons).toBeGreaterThan(0);
            expect(untouched).toBeGreaterThan(20);
        });

        it('separates Indonesia from Timor-Leste and from Papua New Guinea', async () => {
            await create(options());
            for (const name of ['Timor-Leste', 'Papua New Guinea']) {
                const datum = datumOf(chart!, name, 0);
                expect(datum.drawnGeometry, name).not.toBe(datum.projectedGeometry);
            }
            expect(datumOf(chart!, 'Indonesia', 0).drawnGeometry).not.toBe(
                datumOf(chart!, 'Indonesia', 0).projectedGeometry
            );
        });

        it('matches the image snapshot', async () => {
            await create(options());
            await compare();
        });
    });

    describe('image snapshots (V2, V7)', () => {
        it('draws TC1: gap 4 on all four time-zone series (V2)', async () => {
            await create(timeZoneOptions({ gaps: allGaps(4) }));
            await compare();
        });

        it('draws Lesotho, the microstates and the lakes of southern Africa and Italy with a gap (V7)', async () => {
            await create(southernAfricaItaly());
            await compare();
        });
    });
});
