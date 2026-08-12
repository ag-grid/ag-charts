import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import { expectPixelIdenticalAcrossUpdate } from '../../test/bigintExamples';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    PATTERN_SNAPSHOT_DEFAULTS,
    type PlacedLabelGeometry,
    compareImageSnapshot,
    createChart,
    deproxy,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    topLabelAnchorGap,
    waitForChartStability,
} from '../../test/utils';

// `label.placement` is documented for point-like series; `label.collision` is documented too, but
// `collideWith` within it is an undocumented opt-in model (see chartDefaults.ts), so the option
// objects below are built untyped and cast at the AgCharts.create boundary.
type LabelCollisionConfig = {
    placement?: string[];
    collision?: {
        threshold?: number;
        alwaysShow?: boolean;
        collideWith?: object;
    };
    spacing?: number;
};

// Line and area route labels through the collision-placement engine, which honours the configured
// placements: each candidate-placement set resolves colliding labels into different final positions,
// so the rendered output diverges per placement. Collision resolution always runs now, so the axis of
// variation is the placement candidate list and, for the first case, whether a colliding label is kept
// (at its least-overflow candidate) rather than hidden.
const PLACED_LABEL_STRATEGIES: Record<string, LabelCollisionConfig> = {
    'keep overlapping (alwaysShow: true)': {
        placement: ['top', 'bottom'],
        collision: { alwaysShow: true },
    },
    'reposition top-bottom': {
        placement: ['top', 'bottom'],
        collision: { alwaysShow: false },
    },
    'reposition left-right': {
        placement: ['left', 'right'],
        collision: { alwaysShow: false },
    },
    'reposition all directions': {
        placement: ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
        collision: { alwaysShow: false },
    },
    'reposition with min spacing': {
        placement: ['top', 'bottom'],
        collision: { alwaysShow: false, threshold: 3 },
    },
};

// Scatter (and bubble, which it extends) position labels at their own fixed `label.placement` and
// ignore the placement candidates, so collision resolution only ever decides whether an overlapping
// label is hidden or kept — the single meaningful axis for marker series is `alwaysShow`.
const MARKER_LABEL_STRATEGIES: Record<string, LabelCollisionConfig> = {
    'keep overlapping (alwaysShow: true)': { collision: { alwaysShow: true } },
    'hide on collision (alwaysShow: false, default)': { collision: { alwaysShow: false } },
};

type LabelBox = { x: number; y: number; width: number; height: number };

// The visible labels' bounding boxes for a series, used by the cross-series obstacle tests to assert one
// series' labels clear another's.
const seriesVisibleLabelBoxes = (series: {
    labelSelection: { nodes(): { visible: boolean; computeBBox(): LabelBox | undefined }[] };
}) =>
    series.labelSelection
        .nodes()
        .filter((node) => node.visible)
        .map((node) => node.computeBBox())
        .filter((box): box is LabelBox => box != null);

describe('label collision avoidance', () => {
    setupMockConsole();

    let chart: AgChartInstance;
    const ctx = setupMockCanvas();

    afterEach(() => {
        chart?.destroy();
    });

    const renderAndSnapshot = async (options: object, defaults = IMAGE_SNAPSHOT_DEFAULTS) => {
        prepareTestOptions(options as any);
        chart = AgCharts.create(options as any);
        await compareImageSnapshot(chart, ctx, defaults);
    };

    const placedLabelPlacements = () => {
        const series = deproxy(chart as any).series[0] as unknown as {
            placedLabelData: { placement?: string }[];
        };
        return series.placedLabelData;
    };

    const renderedLabelTexts = () => {
        const series = deproxy(chart as any).series[0] as unknown as {
            labelSelection: { nodes(): { visible: boolean; text?: string | object[] }[] };
        };
        return series.labelSelection
            .nodes()
            .filter((node) => node.visible)
            .map((node) => (typeof node.text === 'string' ? node.text : ''));
    };

    const expectAllEllipsised = (fullText: string) => {
        const texts = renderedLabelTexts();
        expect(texts.length).toBeGreaterThan(0);
        for (const rendered of texts) {
            expect(rendered).not.toBe(fullText);
            expect(rendered.endsWith('…')).toBe(true);
        }
    };

    const cartesianAxes = {
        x: { position: 'bottom', type: 'number' },
        y: { position: 'left', type: 'number' },
    };

    // Dense series so adjacent labels overlap at the default canvas size and exercise the engine.
    const lineData = Array.from({ length: 90 }, (_, i) => ({ x: i, y: 50 + 30 * Math.sin(i / 2.5) }));
    const markerData = Array.from({ length: 60 }, (_, i) => ({
        x: i % 6,
        y: i % 9,
        size: 4 + (i % 4),
        label: `Point ${i}`,
    }));

    // Three points close enough that their padded label boxes overlap; used by the alwaysShow and
    // threshold acceptance suites to force a collision at a known, tight spacing.
    const closeData = [
        { x: 10, y: 50 },
        { x: 11, y: 50 },
        { x: 12, y: 50 },
    ];
    const tightAxes = {
        x: { position: 'bottom', type: 'number', min: 0, max: 24 },
        y: { position: 'left', type: 'number' },
    };

    const renderPlaced = async (label: object) => {
        const options: any = {
            data: closeData,
            legend: { enabled: false },
            axes: tightAxes,
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                    marker: { enabled: true, size: 6 },
                    label: {
                        enabled: true,
                        formatter: ({ value }: any) => String(value),
                        placement: 'top',
                        // A padded, filled box forces the labels to collide at this tight spacing (as in
                        // the box-footprint suite above), independent of `collision.alwaysShow`.
                        fill: 'white',
                        padding: 20,
                        ...label,
                    },
                },
            ],
        };
        prepareTestOptions(options);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        const series = deproxy(chart as any).series[0] as unknown as {
            placedLabelData: { text?: unknown; placement?: string }[];
        };
        return series.placedLabelData;
    };

    describe('line series', () => {
        const data = lineData;

        for (const [name, config] of Object.entries(PLACED_LABEL_STRATEGIES)) {
            it(`renders with ${name}`, async () => {
                await renderAndSnapshot({
                    data,
                    legend: { enabled: false },
                    axes: cartesianAxes,
                    series: [
                        {
                            type: 'line',
                            xKey: 'x',
                            yKey: 'y',
                            marker: { enabled: true, size: 6 },
                            label: {
                                enabled: true,
                                formatter: ({ value }: any) => value.toFixed(1),
                                ...config,
                            },
                        },
                    ],
                });
            });
        }
    });

    describe('area series', () => {
        const data = lineData;

        for (const [name, config] of Object.entries(PLACED_LABEL_STRATEGIES)) {
            it(`renders with ${name}`, async () => {
                await renderAndSnapshot({
                    data,
                    legend: { enabled: false },
                    axes: cartesianAxes,
                    series: [
                        {
                            type: 'area',
                            xKey: 'x',
                            yKey: 'y',
                            marker: { enabled: true, size: 6 },
                            label: {
                                enabled: true,
                                formatter: ({ value }: any) => value.toFixed(1),
                                ...config,
                            },
                        },
                    ],
                });
            });
        }
    });

    // Line and area default collision avoidance off; the theme default placement `'top'` is a scalar
    // that seats every label above its point, and a user value must override the theme default.
    describe('placement without collision avoidance (opt-out default)', () => {
        const sparseData = Array.from({ length: 5 }, (_, i) => ({ x: i, y: 50 }));

        const placedLabels = () => {
            const series = deproxy(chart as any).series[0] as unknown as {
                placedLabelData: {
                    x: number;
                    y: number;
                    placement?: string;
                    datum: { point: { x: number; y: number } };
                }[];
            };
            return series.placedLabelData;
        };

        const render = async (type: 'line' | 'area', placement?: string | string[]) => {
            const options: any = {
                data: sparseData,
                legend: { enabled: false },
                axes: cartesianAxes,
                series: [
                    {
                        type,
                        xKey: 'x',
                        yKey: 'y',
                        marker: { enabled: true, size: 6 },
                        label: {
                            enabled: true,
                            formatter: ({ value }: any) => String(value),
                            ...(placement == null ? {} : { placement }),
                        },
                    },
                ],
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            return placedLabels();
        };

        for (const type of ['line', 'area'] as const) {
            // The scalar default placement `'top'` seats every label above its point with avoidance
            // off, regardless of whether 'top' fits the bounds.
            it(`${type}: seats labels above the point by default`, async () => {
                const placed = await render(type);
                expect(placed.length).toBe(sparseData.length);
                for (const label of placed) {
                    expect(label.placement).toBe('top');
                    expect(Math.sign(label.y - label.datum.point.y)).toBe(-1);
                }
            });

            it(`${type}: honours a scalar placement over the theme default`, async () => {
                const placed = await render(type, 'bottom');
                expect(placed.length).toBe(sparseData.length);
                for (const label of placed) {
                    expect(label.placement).toBe('bottom');
                    expect(label.y).toBeGreaterThan(label.datum.point.y);
                }
            });

            it(`${type}: honours a directional scalar placement`, async () => {
                const placed = await render(type, 'right');
                expect(placed.length).toBe(sparseData.length);
                for (const label of placed) {
                    expect(label.placement).toBe('right');
                    expect(label.x).toBeGreaterThan(label.datum.point.x);
                }
            });
        }
    });

    // `inside` centres the label on the marker and fits its text to the marker, hiding text that
    // cannot fit — distinct from the directional placements, which offset the label off the marker.
    describe('inside placement (centre in marker, fit to marker)', () => {
        const sparseData = Array.from({ length: 5 }, (_, i) => ({ x: i, y: 50 }));

        const placedLabels = () => {
            const series = deproxy(chart as any).series[0] as unknown as {
                placedLabelData: {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                    placement?: string;
                    datum: { point: { x: number; y: number } };
                }[];
            };
            return series.placedLabelData;
        };

        const render = async (
            type: 'line' | 'area',
            opts: {
                markerSize?: number;
                markerEnabled?: boolean;
                placement?: string | string[];
                alwaysShow?: boolean;
                truncate?: boolean;
                text?: string;
            } = {}
        ) => {
            const { markerSize = 40, markerEnabled = true, placement = 'inside', alwaysShow, truncate, text } = opts;
            const options: any = {
                data: sparseData,
                legend: { enabled: false },
                axes: cartesianAxes,
                series: [
                    {
                        type,
                        xKey: 'x',
                        yKey: 'y',
                        marker: { enabled: markerEnabled, size: markerSize },
                        label: {
                            enabled: true,
                            placement,
                            truncate,
                            formatter: ({ value }: any) => text ?? String(value),
                            ...(alwaysShow == null ? {} : { collision: { alwaysShow } }),
                        },
                    },
                ],
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            return placedLabels();
        };

        for (const type of ['line', 'area'] as const) {
            it(`${type}: centres each label on its point when it fits the marker`, async () => {
                const placed = await render(type, { markerSize: 40 });
                expect(placed.length).toBe(sparseData.length);
                for (const label of placed) {
                    expect(label.placement).toBe('inside');
                    expect(label.x + label.width / 2).toBeCloseTo(label.datum.point.x, 0);
                    expect(label.y + label.height / 2).toBeCloseTo(label.datum.point.y, 0);
                }
            });

            it(`${type}: overflows a small marker at full text rather than hiding`, async () => {
                const placed = await render(type, { markerSize: 4 });
                expect(placed.length).toBe(sparseData.length);
                for (const label of placed) {
                    expect(label.placement).toBe('inside');
                    expect(label.x + label.width / 2).toBeCloseTo(label.datum.point.x, 0);
                    expect(label.y + label.height / 2).toBeCloseTo(label.datum.point.y, 0);
                }
                expect(renderedLabelTexts()).toEqual(sparseData.map(() => '50'));
            });

            it(`${type}: centres inside labels on the point when the marker is disabled`, async () => {
                const placed = await render(type, { markerEnabled: false, markerSize: 40 });
                expect(placed.length).toBe(sparseData.length);
                for (const label of placed) {
                    expect(label.x + label.width / 2).toBeCloseTo(label.datum.point.x, 0);
                    expect(label.y + label.height / 2).toBeCloseTo(label.datum.point.y, 0);
                }
                expect(renderedLabelTexts()).toEqual(sparseData.map(() => '50'));
            });

            it(`${type}: hides labels whose text overflows a small marker when alwaysShow is off`, async () => {
                const placed = await render(type, { markerSize: 4, alwaysShow: false });
                expect(placed.length).toBe(0);
            });

            it(`${type}: ellipsises an overflowing label to the marker when truncate is set`, async () => {
                const text = 'Category value';
                const placed = await render(type, { markerSize: 60, truncate: true, text });
                expect(placed.length).toBe(sparseData.length);
                expectAllEllipsised(text);
            });

            it(`${type}: cascades an oversized inside label to a directional fallback`, async () => {
                // A small marker can't contain the full-size text, so a mixed list must reject the `inside`
                // candidate and cascade to a directional placement rather than leaving it overflowing inside.
                const placed = await render(type, {
                    markerSize: 4,
                    placement: ['inside', 'top', 'bottom'],
                });
                expect(placed.length).toBe(sparseData.length);
                for (const label of placed) {
                    expect(['top', 'bottom']).toContain(label.placement);
                }
            });

            it(`${type}: keeps a fitting inside label inside for a mixed list`, async () => {
                // The text fits the large marker, so the first (`inside`) candidate is chosen and the
                // directional fallback is never reached.
                const placed = await render(type, { markerSize: 40, placement: ['inside', 'top'] });
                expect(placed.length).toBe(sparseData.length);
                for (const label of placed) {
                    expect(label.placement).toBe('inside');
                }
            });
        }

        it('renders inside labels overflowing markers too small to contain them', async () => {
            await renderAndSnapshot({
                data: sparseData,
                legend: { enabled: false },
                axes: cartesianAxes,
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        marker: { enabled: true, size: 4 },
                        // Labels overflow onto the background, where the inside default is invisible.
                        label: {
                            enabled: true,
                            placement: 'inside',
                            insideStyle: { color: { ref: 'textColor' } },
                            formatter: ({ value }: any) => String(value),
                        },
                    },
                ],
            });
        });
    });

    // The engine reserves the larger of the two placement styles' box extents, so a boxed label's drawn
    // box has to be re-centred within that reservation instead of sitting flush to its top-left.
    describe('inside placement centres the drawn box on the marker', () => {
        const sparseData = [
            { x: 10, y: 50 },
            { x: 50, y: 50 },
            { x: 90, y: 50 },
        ];

        const drawnBoxesOnMarkers = () => {
            const series = deproxy(chart as any).series[0] as unknown as {
                placedLabelData: { datum: { point: { x: number; y: number } } }[];
                labelSelection: { nodes(): { computeBBox(): LabelBox | undefined }[] };
            };
            const nodes = series.labelSelection.nodes();
            return series.placedLabelData
                .map((placed, index) => ({ box: nodes[index]?.computeBBox(), marker: placed.datum.point }))
                .filter((entry): entry is { box: LabelBox; marker: { x: number; y: number } } => entry.box != null);
        };

        const render = async (type: 'line' | 'area' | 'scatter', labelStyle: object) => {
            const options: any = {
                data: sparseData,
                legend: { enabled: false },
                axes: cartesianAxes,
                series: [
                    {
                        type,
                        xKey: 'x',
                        yKey: 'y',
                        ...(type === 'scatter' ? { size: 100 } : { marker: { enabled: true, size: 100 } }),
                        label: {
                            enabled: true,
                            placement: 'inside',
                            formatter: () => 'Ab',
                            ...labelStyle,
                        },
                    },
                ],
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            return drawnBoxesOnMarkers();
        };

        for (const type of ['line', 'area', 'scatter'] as const) {
            it(`${type}: centres a bordered box on the marker`, async () => {
                const placed = await render(type, {
                    fill: 'white',
                    padding: 4,
                    border: { stroke: 'black', strokeWidth: 6 },
                });
                expect(placed.length).toBe(sparseData.length);
                for (const { box, marker } of placed) {
                    expect(box.x + box.width / 2).toBeCloseTo(marker.x, 0);
                    expect(box.y + box.height / 2).toBeCloseTo(marker.y, 0);
                }
            });

            it(`${type}: centres the box when the placement styles' padding diverges`, async () => {
                const placed = await render(type, {
                    fill: 'white',
                    insideStyle: { padding: 2 },
                    outsideStyle: { padding: 20 },
                });
                expect(placed.length).toBe(sparseData.length);
                for (const { box, marker } of placed) {
                    expect(box.x + box.width / 2).toBeCloseTo(marker.x, 0);
                    expect(box.y + box.height / 2).toBeCloseTo(marker.y, 0);
                }
            });
        }

        it('renders bordered inside labels centred on their markers', async () => {
            await renderAndSnapshot({
                data: sparseData,
                legend: { enabled: false },
                axes: cartesianAxes,
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        marker: { enabled: true, size: 100, fill: 'lightsteelblue' },
                        label: {
                            enabled: true,
                            placement: 'inside',
                            formatter: () => 'Ab',
                            fill: 'white',
                            padding: 10,
                            border: { stroke: 'crimson', strokeWidth: 6 },
                            // The inside default resolves to the chart background, which is invisible on this white box.
                            insideStyle: { color: { ref: 'textColor' } },
                        },
                    },
                ],
            });
        });
    });

    // Reproduces the reported scenario: three close, parallel lines with a `['top','bottom','inside']`
    // list. The top line resolves up and the bottom line down; the middle line collides on both sides
    // and falls through to `inside`, where its label fits the 23px marker rather than being dropped.
    describe('mixed directional/inside cascade (three parallel lines)', () => {
        const parallelLineData = [
            { x: 0, top: 58, mid: 50, bottom: 42 },
            { x: 1, top: 59, mid: 51, bottom: 43 },
            { x: 2, top: 60, mid: 52, bottom: 44 },
            { x: 3, top: 61, mid: 53, bottom: 45 },
            { x: 4, top: 62, mid: 54, bottom: 46 },
            { x: 5, top: 63, mid: 55, bottom: 47 },
            { x: 6, top: 64, mid: 56, bottom: 48 },
            { x: 7, top: 65, mid: 57, bottom: 49 },
        ];

        const lineSeries = (yKey: string, color: string) => ({
            type: 'line',
            xKey: 'x',
            yKey,
            stroke: color,
            marker: { enabled: true, size: 23, fill: color },
            label: {
                enabled: true,
                placement: ['top', 'bottom', 'inside'],
            },
        });

        it('cascades overlapping labels off their markers', async () => {
            await renderAndSnapshot({
                data: parallelLineData,
                legend: { enabled: false },
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    // Wide fixed range compresses the pixel gap between the lines so their labels overlap.
                    y: { type: 'number', position: 'left', min: 0, max: 150 },
                },
                series: [
                    lineSeries('top', 'seagreen'),
                    lineSeries('mid', 'dodgerblue'),
                    lineSeries('bottom', 'tomato'),
                ],
            });
        });
    });

    // Marker series enable collision avoidance, so a mixed `inside`+directional list cascades: the
    // label fits inside the marker when it can, else falls back to a directional placement with full
    // text rather than vanishing. Scatter shares BubbleSeries' label pipeline, so both are covered.
    describe('inside placement fallback cascade (marker series)', () => {
        // Three well-separated mid-height points: no inter-marker or inter-label collisions, so an
        // inside failure is isolated to the marker-fit test and directional fallbacks stay clear.
        const sparseData = [
            { x: 10, y: 50, size: 1, label: 'A' },
            { x: 50, y: 50, size: 1, label: 'B' },
            { x: 90, y: 50, size: 1, label: 'C' },
        ];

        const render = async (
            type: 'scatter' | 'bubble',
            opts: {
                markerSize: number;
                placement: string | string[];
                alwaysShow?: boolean;
                truncate?: boolean;
                text?: string;
            }
        ) => {
            const { markerSize, placement, alwaysShow, truncate, text } = opts;
            const options: any = {
                data: sparseData,
                legend: { enabled: false },
                axes: cartesianAxes,
                series: [
                    {
                        type,
                        xKey: 'x',
                        yKey: 'y',
                        labelKey: 'label',
                        ...(type === 'bubble'
                            ? { sizeKey: 'size', minSize: markerSize, maxSize: markerSize }
                            : { size: markerSize }),
                        label: {
                            enabled: true,
                            placement,
                            truncate,
                            ...(text == null ? {} : { formatter: () => text }),
                            ...(alwaysShow == null ? {} : { collision: { alwaysShow } }),
                        },
                    },
                ],
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            return placedLabelPlacements();
        };

        it('scatter: keeps the label inside when it fits the marker', async () => {
            const placed = await render('scatter', { markerSize: 100, placement: ['inside', 'top', 'bottom'] });
            expect(placed.length).toBe(sparseData.length);
            for (const label of placed) {
                expect(label.placement).toBe('inside');
            }
        });

        it('scatter: cascades to a directional fallback when the marker is too small', async () => {
            const placed = await render('scatter', { markerSize: 6, placement: ['inside', 'top', 'bottom'] });
            // No vanishing: every label still renders, now at the directional fallback with full text.
            expect(placed.length).toBe(sparseData.length);
            for (const label of placed) {
                expect(label.placement).toBe('top');
            }
        });

        it('scatter: a lone inside placement still hides on a too-small marker (no fallback)', async () => {
            const placed = await render('scatter', { markerSize: 6, placement: 'inside' });
            expect(placed.length).toBe(0);
        });

        for (const type of ['scatter', 'bubble'] as const) {
            it(`${type}: a lone inside placement overflows a too-small marker when alwaysShow is on`, async () => {
                const placed = await render(type, { markerSize: 6, placement: 'inside', alwaysShow: true });
                expect(placed.length).toBe(sparseData.length);
                for (const label of placed) {
                    expect(label.placement).toBe('inside');
                }
                expect(renderedLabelTexts()).toEqual(sparseData.map(({ label }) => label));
            });

            it(`${type}: alwaysShow with truncate still ellipsises to the marker`, async () => {
                const text = 'Category value';
                const placed = await render(type, {
                    markerSize: 40,
                    placement: 'inside',
                    alwaysShow: true,
                    truncate: true,
                    text,
                });
                expect(placed.length).toBe(sparseData.length);
                expectAllEllipsised(text);
            });
        }

        it('bubble: cascades to a directional fallback when the marker is too small', async () => {
            const placed = await render('bubble', { markerSize: 6, placement: ['inside', 'top', 'bottom'] });
            expect(placed.length).toBe(sparseData.length);
            for (const label of placed) {
                expect(label.placement).toBe('top');
            }
        });

        // Visual regression guard: with a size range, small bubbles cascade their labels to
        // top/bottom while large bubbles keep them inside — none vanish.
        it('bubble: renders a mixed inside/top/bottom cascade across a size range', async () => {
            await renderAndSnapshot(
                {
                    data: [
                        { x: 1, y: 3, size: 1, label: 'Alpha' },
                        { x: 2, y: 5, size: 4, label: 'Bravo' },
                        { x: 3, y: 2, size: 8, label: 'Charlie' },
                        { x: 4, y: 6, size: 10, label: 'Delta' },
                        { x: 5, y: 4, size: 2, label: 'Echo' },
                        { x: 6, y: 7, size: 6, label: 'Foxtrot' },
                    ],
                    legend: { enabled: false },
                    axes: cartesianAxes,
                    series: [
                        {
                            type: 'bubble',
                            xKey: 'x',
                            yKey: 'y',
                            sizeKey: 'size',
                            labelKey: 'label',
                            minSize: 6,
                            maxSize: 60,
                            label: { enabled: true, placement: ['inside', 'top', 'bottom'] },
                        },
                    ],
                },
                PATTERN_SNAPSHOT_DEFAULTS
            );
        });
    });

    describe('series-area overflow (marker series)', () => {
        // A single point pinned to the top edge of the plot; a `top` label sits above the series area
        // but within the chart's outer padding band. Series-area containment is opt-in via
        // `collideWith.seriesArea`: off by default the label is kept (spilling into the padding band is
        // allowed); enabling it treats the overflow as a collision so a hideable label is dropped.
        const topEdgeData = [{ x: 5, y: 10, size: 4, label: 'Edge' }];
        const edgeAxes = {
            x: { position: 'bottom', type: 'number', min: 0, max: 10 },
            y: { position: 'left', type: 'number', min: 0, max: 10 },
        };

        const render = async (
            type: 'scatter' | 'bubble',
            opts: {
                seriesAreaPaddingTop?: number;
                placement?: string;
                markerSize?: number;
                seriesArea?: boolean;
            } = {}
        ) => {
            const { seriesAreaPaddingTop, placement = 'top', markerSize = 6, seriesArea } = opts;
            const options: any = {
                data: topEdgeData,
                legend: { enabled: false },
                padding: { top: 80, right: 10, bottom: 10, left: 10 },
                ...(seriesAreaPaddingTop == null ? {} : { seriesArea: { padding: { top: seriesAreaPaddingTop } } }),
                axes: edgeAxes,
                series: [
                    {
                        type,
                        xKey: 'x',
                        yKey: 'y',
                        labelKey: 'label',
                        ...(type === 'bubble'
                            ? { sizeKey: 'size', minSize: markerSize, maxSize: markerSize }
                            : { size: markerSize }),
                        label: {
                            enabled: true,
                            placement,
                            collision: {
                                alwaysShow: false,
                                ...(seriesArea == null ? {} : { collideWith: { seriesArea } }),
                            },
                        },
                    },
                ],
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            return placedLabelPlacements();
        };

        for (const type of ['scatter', 'bubble'] as const) {
            it(`${type}: keeps a label overflowing the series area by default (seriesArea off)`, async () => {
                const placed = await render(type);
                expect(placed.length).toBe(1);
            });

            it(`${type}: drops a label overflowing the series area when collideWith.seriesArea is on`, async () => {
                const placed = await render(type, { seriesArea: true });
                expect(placed.length).toBe(0);
            });

            it(`${type}: keeps the label when seriesArea padding grows the region to contain it`, async () => {
                const placed = await render(type, { seriesArea: true, seriesAreaPaddingTop: 80 });
                expect(placed.length).toBe(1);
            });

            // An `inside` label is fitted to and centred on its marker, so an edge marker's label
            // rides with the point; it is exempt from the series-area containment that hides
            // directional labels spilling into the padding zone.
            it(`${type}: keeps an inside label centred on an edge marker even with seriesArea on`, async () => {
                const placed = await render(type, { seriesArea: true, placement: 'inside', markerSize: 60 });
                expect(placed.length).toBe(1);
            });
        }
    });

    describe('bar collideWith overrides', () => {
        // Bars resolve collideWith from their theme (seriesItem/seriesArea on; marker/label inherit the
        // global on) merged with the user's, so a user override must reach the bar label placement path.
        const barAxes = {
            x: { position: 'bottom', type: 'category' },
            y: { position: 'left', type: 'number', min: 0, max: 10 },
        };

        const visibleBarLabelCount = (seriesIndex = 0) => {
            const series = deproxy(chart as any).series[seriesIndex] as unknown as {
                labelSelection: { nodes(): { visible: boolean }[] };
            };
            return series.labelSelection.nodes().filter((node) => node.visible).length;
        };

        describe('seriesArea', () => {
            // A single bar filling the value axis; its `outside-end` label sits above the bar top,
            // overflowing the series area into the chart padding band.
            const topBarData = [{ x: 'A', y: 10 }];

            const render = async (collision: object) => {
                const options: any = {
                    data: topBarData,
                    legend: { enabled: false },
                    padding: { top: 100, right: 10, bottom: 10, left: 10 },
                    axes: barAxes,
                    series: [
                        {
                            type: 'bar',
                            xKey: 'x',
                            yKey: 'y',
                            label: { enabled: true, placement: 'outside-end', collision },
                        },
                    ],
                };
                prepareTestOptions(options);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                return visibleBarLabelCount();
            };

            it('drops an outside label overflowing the series area by default (seriesArea on)', async () => {
                expect(await render({ alwaysShow: false })).toBe(0);
            });

            it('keeps the outside label when collideWith.seriesArea is disabled', async () => {
                expect(await render({ alwaysShow: false, collideWith: { seriesArea: false } })).toBe(1);
            });
        });

        describe('labels', () => {
            // A line and a bar sharing the same category and top value, so the bar's `outside-end` label
            // and the line's `top` label stack above the same point; padded, filled boxes force them to
            // overlap. The line is declared first so its kept label seeds the obstacle before the
            // hideable bar label resolves and either avoids it (default) or ignores it (labels off).
            const comboData = [{ x: 'A', line: 10, bar: 10 }];
            const boxedLabel = { fill: 'white', padding: 20 };

            const render = async (barCollision: object) => {
                const options: any = {
                    data: comboData,
                    legend: { enabled: false },
                    padding: { top: 100, right: 40, bottom: 10, left: 40 },
                    axes: barAxes,
                    series: [
                        {
                            type: 'line',
                            xKey: 'x',
                            yKey: 'line',
                            marker: { enabled: true, size: 6 },
                            label: { enabled: true, placement: 'top', ...boxedLabel },
                        },
                        {
                            type: 'bar',
                            xKey: 'x',
                            yKey: 'bar',
                            label: { enabled: true, placement: 'outside-end', ...boxedLabel, collision: barCollision },
                        },
                    ],
                };
                prepareTestOptions(options);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                return visibleBarLabelCount(1);
            };

            it('drops the bar label colliding with the line label by default (labels on)', async () => {
                // seriesArea off so the label is not dropped for overflowing the plot area instead.
                expect(await render({ alwaysShow: false, collideWith: { seriesArea: false } })).toBe(0);
            });

            it('keeps the bar label when collideWith.labels is disabled', async () => {
                expect(await render({ alwaysShow: false, collideWith: { seriesArea: false, labels: false } })).toBe(1);
            });
        });
    });

    describe('scatter series', () => {
        const data = markerData;

        for (const [name, config] of Object.entries(MARKER_LABEL_STRATEGIES)) {
            it(`renders with ${name}`, async () => {
                await renderAndSnapshot(
                    {
                        data,
                        legend: { enabled: false },
                        axes: cartesianAxes,
                        series: [
                            {
                                type: 'scatter',
                                xKey: 'x',
                                yKey: 'y',
                                labelKey: 'label',
                                label: { enabled: true, ...config },
                            },
                        ],
                    },
                    PATTERN_SNAPSHOT_DEFAULTS
                );
            });
        }
    });

    describe('bubble series', () => {
        const data = markerData;

        for (const [name, config] of Object.entries(MARKER_LABEL_STRATEGIES)) {
            it(`renders with ${name}`, async () => {
                await renderAndSnapshot(
                    {
                        data,
                        legend: { enabled: false },
                        axes: cartesianAxes,
                        series: [
                            {
                                type: 'bubble',
                                xKey: 'x',
                                yKey: 'y',
                                sizeKey: 'size',
                                labelKey: 'label',
                                label: { enabled: true, ...config },
                            },
                        ],
                    },
                    PATTERN_SNAPSHOT_DEFAULTS
                );
            });
        }
    });

    // Label box dimensions and marker size feed the collision engine, so placement must stay correct as
    // font size, padding and marker size vary the geometry it resolves against.
    describe('with varied label options and stylers', () => {
        const repositionAllDirections: LabelCollisionConfig = {
            placement: ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
            collision: { alwaysShow: false },
        };

        it('line: large labels with padding repositioned around dense markers', async () => {
            await renderAndSnapshot({
                data: lineData,
                legend: { enabled: false },
                axes: cartesianAxes,
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        marker: { enabled: true, size: 6 },
                        label: {
                            enabled: true,
                            fontSize: 18,
                            fontWeight: 'bold',
                            padding: 6,
                            formatter: ({ value }: any) => value.toFixed(1),
                            ...repositionAllDirections,
                        },
                    },
                ],
            });
        });

        it('line: large markers widen the placement gap', async () => {
            await renderAndSnapshot({
                data: lineData,
                legend: { enabled: false },
                axes: cartesianAxes,
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        // Marker size (the marker option, not an itemStyler result) is what the collision
                        // engine reserves, so a large marker widens the placement gap and shifts labels clear.
                        marker: { enabled: true, size: 20 },
                        label: {
                            enabled: true,
                            formatter: ({ value }: any) => value.toFixed(1),
                            placement: ['top', 'bottom'],
                            collision: { alwaysShow: false },
                        },
                    },
                ],
            });
        });

        it('bubble: itemStyler varies marker style with collision avoidance', async () => {
            await renderAndSnapshot(
                {
                    data: markerData,
                    legend: { enabled: false },
                    axes: cartesianAxes,
                    series: [
                        {
                            type: 'bubble',
                            xKey: 'x',
                            yKey: 'y',
                            sizeKey: 'size',
                            labelKey: 'label',
                            itemStyler: ({ datum }: any) => ({ fillOpacity: datum.y % 2 === 0 ? 0.4 : 0.9 }),
                            label: { enabled: true, fontSize: 16 },
                        },
                    ],
                },
                PATTERN_SNAPSHOT_DEFAULTS
            );
        });
    });

    // The collision footprint must be the label's drawn box (text + padding), not the bare text, or
    // a padded/boxed label can visually overlap a neighbour while the engine reports no collision.
    describe('label box footprint (padding reserved, not just text)', () => {
        type Box = { x: number; y: number; width: number; height: number };
        const overlaps = (a: Box, b: Box) =>
            a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

        const visibleLabelBoxes = async (padding: number) => {
            const options: any = {
                data: closeData,
                legend: { enabled: false },
                axes: tightAxes,
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        marker: { enabled: true, size: 6 },
                        label: {
                            enabled: true,
                            formatter: ({ value }: any) => String(value),
                            placement: 'top',
                            fill: 'white',
                            padding,
                            collision: { alwaysShow: false },
                        },
                    },
                ],
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            const series = deproxy(chart as any).series[0] as unknown as {
                labelSelection: { nodes(): { visible: boolean; computeBBox(): Box | undefined }[] };
            };
            return series.labelSelection
                .nodes()
                .filter((node) => node.visible)
                .map((node) => node.computeBBox()!);
        };

        it('drops a colliding label whose padded box overlaps a neighbour though the bare text would not', async () => {
            const boxes = await visibleLabelBoxes(20);
            // Anti-vacuous guard: some labels must actually be dropped for the box footprint to matter.
            expect(boxes.length).toBeLessThan(closeData.length);
            for (let i = 0; i < boxes.length; i++) {
                for (let j = i + 1; j < boxes.length; j++) {
                    expect(overlaps(boxes[i], boxes[j])).toBe(false);
                }
            }
        });

        // A bordered outside label's drawn box (padding + half the border stroke reserved outward) must
        // sit exactly `spacing` from the bar, not `spacing - strokeWidth/2` — i.e. the anchor offset must
        // include the border extent, not padding alone.
        it('reserves padding and border in a bordered histogram outside-label offset', async () => {
            const SPACING = 20;
            const PADDING = 12;
            const STROKE = 8;
            const options: any = {
                data: Array.from({ length: 5 }, () => ({ x: 0.5 })),
                legend: { enabled: false },
                padding: { top: 100, right: 10, bottom: 10, left: 10 },
                axes: { x: { type: 'number', min: 0, max: 1 }, y: { type: 'number', min: 0, max: 200 } },
                series: [
                    {
                        type: 'histogram',
                        xKey: 'x',
                        bins: [[0, 1]],
                        label: {
                            enabled: true,
                            placement: 'outside-end',
                            spacing: SPACING,
                            color: 'black',
                            fill: '#ffe08a',
                            padding: PADDING,
                            border: { enabled: true, stroke: 'red', strokeWidth: STROKE },
                            collision: { threshold: 0, alwaysShow: false },
                        },
                    },
                ],
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            const series = deproxy(chart as any).series[0] as unknown as {
                contextNodeData?: { nodeData?: { y: number }[]; labelData?: { label?: { y: number } }[] };
            };
            const barTop = series.contextNodeData!.nodeData![0].y;
            const labelY = series.contextNodeData!.labelData![0].label!.y;
            // outside-end sits above the bar with baseline 'bottom'; the box extends down toward the bar by
            // padding + half the stroke, so that edge must clear the bar by exactly `spacing`.
            expect(barTop - (labelY + PADDING + STROKE / 2)).toBeCloseTo(SPACING);
        });
    });

    // Bar/histogram contribute their rects as `seriesItem` obstacles; a placing series only routes
    // its labels around them when its label opts into that category via collideWith.seriesItems.
    describe('cross-series obstacles (bar + line)', () => {
        const comboData = Array.from({ length: 16 }, (_, i) => ({
            x: `C${i}`,
            bar: 40 + 20 * Math.sin(i / 2),
            line: 52 + 22 * Math.sin(i / 2 + 1),
        }));
        const comboAxes = {
            x: { position: 'bottom', type: 'category' },
            y: { position: 'left', type: 'number' },
        };
        const lineLabel = (config: LabelCollisionConfig) => ({
            type: 'line',
            xKey: 'x',
            yKey: 'line',
            marker: { enabled: true, size: 6 },
            label: { enabled: true, formatter: ({ value }: any) => value.toFixed(0), ...config },
        });
        const series = (config: LabelCollisionConfig) => [{ type: 'bar', xKey: 'x', yKey: 'bar' }, lineLabel(config)];

        it('routes line labels around bars when seriesItems is enabled', async () => {
            await renderAndSnapshot({
                data: comboData,
                legend: { enabled: false },
                axes: comboAxes,
                series: series({
                    placement: ['top', 'bottom'],
                    collision: {
                        alwaysShow: false,
                        collideWith: { seriesItems: true },
                    },
                }),
            });
        });

        it('leaves line labels over the bars by default (seriesItems off)', async () => {
            await renderAndSnapshot({
                data: comboData,
                legend: { enabled: false },
                axes: comboAxes,
                series: series({
                    placement: ['top', 'bottom'],
                }),
            });
        });
    });

    // A bar's inside label with the default `alwaysShow: true` and a single placement is baked
    // directly rather than routed through the placement engine, so it never enters the obstacle index
    // via placement. It must still act as a `label` obstacle so another series' labels avoid it —
    // otherwise a scatter label sitting over a bar's inside label goes undetected.
    describe('cross-series obstacles (baked bar inside label vs scatter label)', () => {
        type Box = { x: number; y: number; width: number; height: number };
        const overlaps = (a: Box, b: Box) =>
            a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

        // The B1 scatter point sits inside the first bar (yB 2.4 within the 0..5 bar), so its label
        // collides with the bar's baked inside label; the rest are clear.
        const data = [
            { x: 1, yA: 5, yB: 2.4, nameB: 'B1' },
            { x: 2, yA: 5.2, yB: 6.6, nameB: 'B2' },
            { x: 3, yA: 5.1, yB: 5.5, nameB: 'B3' },
            { x: 4, yA: 8, yB: 8.4, nameB: 'B4' },
            { x: 5, yA: 8.2, yB: 8.6, nameB: 'B5' },
            { x: 6, yA: 8.1, yB: 8.5, nameB: 'B6' },
            { x: 7, yA: 3, yB: 3.4, nameB: 'B7' },
            { x: 8, yA: 3.2, yB: 3.6, nameB: 'B8' },
        ];

        const options = (): any => ({
            data,
            legend: { enabled: false },
            axes: { x: { type: 'number' }, y: { type: 'number' } },
            series: [
                {
                    type: 'bar',
                    xKey: 'x',
                    yKey: 'yA',
                    label: { enabled: true, collision: { alwaysShow: true } },
                },
                {
                    type: 'scatter',
                    xKey: 'x',
                    yKey: 'yB',
                    labelKey: 'nameB',
                    label: {
                        enabled: true,
                        placement: ['top', 'bottom'],
                        collision: { alwaysShow: false },
                    },
                },
            ],
        });

        it('renders with the scatter label cleared off the bar inside label', async () => {
            await renderAndSnapshot(options());
        });

        it('drops a hideable scatter label overlapping a bar inside label', async () => {
            const opts = options();
            prepareTestOptions(opts);
            chart = AgCharts.create(opts);
            await waitForChartStability(chart);
            const [bar, scatter] = deproxy(chart as any).series as unknown as Parameters<
                typeof seriesVisibleLabelBoxes
            >[0][];
            const barBoxes = seriesVisibleLabelBoxes(bar);
            const scatterBoxes = seriesVisibleLabelBoxes(scatter);
            // Anti-vacuous guards: both series must render labels for the invariant to mean anything.
            expect(barBoxes.length).toBeGreaterThan(0);
            expect(scatterBoxes.length).toBeGreaterThan(0);
            // A hideable scatter label must never remain visible on top of a bar's inside label.
            for (const barBox of barBoxes) {
                for (const scatterBox of scatterBoxes) {
                    expect(overlaps(barBox, scatterBox)).toBe(false);
                }
            }
        });
    });

    describe('cross-series obstacles (baked histogram inside label vs scatter label)', () => {
        type Box = { x: number; y: number; width: number; height: number };
        const overlaps = (a: Box, b: Box) =>
            a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

        // Six points fall in the first bin [0, 4), so its frequency is 6 and its inside-centre label
        // sits at y ≈ 3. The HIT scatter point sits just below that centre so its `top` candidate lands
        // on the baked label (`bottom` clears it); the rest are clear.
        const histogramData = [{ x: 1 }, { x: 1 }, { x: 2 }, { x: 2 }, { x: 3 }, { x: 3 }, { x: 5 }, { x: 9 }];
        const scatterData = [
            { x: 2, y: 2.8, name: 'HIT' },
            { x: 6, y: 1, name: 'S1' },
            { x: 10, y: 1, name: 'S2' },
        ];

        const options = (): any => ({
            legend: { enabled: false },
            axes: { x: { type: 'number' }, y: { type: 'number' } },
            series: [
                {
                    type: 'histogram',
                    xKey: 'x',
                    data: histogramData,
                    bins: [
                        [0, 4],
                        [4, 8],
                        [8, 12],
                    ],
                    label: { enabled: true, collision: { alwaysShow: true } },
                },
                {
                    type: 'scatter',
                    xKey: 'x',
                    yKey: 'y',
                    labelKey: 'name',
                    data: scatterData,
                    label: {
                        enabled: true,
                        placement: ['top', 'bottom'],
                        collision: { alwaysShow: false },
                    },
                },
            ],
        });

        it('renders with the scatter label cleared off the histogram inside label', async () => {
            await renderAndSnapshot(options());
        });

        it('drops a hideable scatter label overlapping a histogram inside label', async () => {
            const opts = options();
            prepareTestOptions(opts);
            chart = AgCharts.create(opts);
            await waitForChartStability(chart);
            const [histogram, scatter] = deproxy(chart as any).series as unknown as Parameters<
                typeof seriesVisibleLabelBoxes
            >[0][];
            const histogramBoxes = seriesVisibleLabelBoxes(histogram);
            const scatterBoxes = seriesVisibleLabelBoxes(scatter);
            // Anti-vacuous guards: both series must render labels for the invariant to mean anything.
            expect(histogramBoxes.length).toBeGreaterThan(0);
            expect(scatterBoxes.length).toBeGreaterThan(0);
            // A hideable scatter label must never remain visible on top of a histogram's inside label.
            for (const histogramBox of histogramBoxes) {
                for (const scatterBox of scatterBoxes) {
                    expect(overlaps(histogramBox, scatterBox)).toBe(false);
                }
            }
        });
    });

    describe('histogram placement cascade and own-label hiding', () => {
        // A single bin filling the value axis; its `outside-end` label overflows the series area into the
        // padding band, so a hideable single-placement label is dropped when series-area avoidance is on,
        // while a placement array cascades to an inside candidate that fits.
        const data = Array.from({ length: 10 }, () => ({ x: 0.5 }));
        const options = (collision: object, placement: string | string[] = 'outside-end'): any => ({
            data,
            legend: { enabled: false },
            padding: { top: 100, right: 10, bottom: 10, left: 10 },
            axes: { x: { type: 'number' }, y: { type: 'number', min: 0, max: 10 } },
            series: [
                {
                    type: 'histogram',
                    xKey: 'x',
                    bins: [[0, 1]],
                    label: { enabled: true, placement, collision },
                },
            ],
        });
        const visibleLabelCount = () => {
            const series = deproxy(chart as any).series[0] as unknown as {
                labelSelection: { nodes(): { visible: boolean }[] };
            };
            return series.labelSelection.nodes().filter((node) => node.visible).length;
        };
        const render = async (collision: object, placement?: string | string[]) => {
            const opts = options(collision, placement);
            prepareTestOptions(opts);
            chart = AgCharts.create(opts);
            await waitForChartStability(chart);
            return visibleLabelCount();
        };

        it('drops a hideable outside label overflowing the series area', async () => {
            expect(await render({ alwaysShow: false, collideWith: { seriesArea: true } })).toBe(0);
        });

        it('keeps the same label when it is not hideable (alwaysShow: true)', async () => {
            expect(await render({ alwaysShow: true, collideWith: { seriesArea: true } })).toBe(1);
        });

        it('cascades a hideable outside label to an inside placement that fits', async () => {
            // The single `outside-end` label above hides (0); the array falls through to `inside-center`,
            // which fits inside the tall bin, so the label is kept even though `alwaysShow` is false.
            expect(
                await render({ alwaysShow: false, collideWith: { seriesArea: true } }, ['outside-end', 'inside-center'])
            ).toBe(1);
        });

        // With an `['inside-center', ...]` cascade that has a non-inside fallback, a label too large to fit
        // inside the bin must NOT be truncated to the bin and pinned inside; it keeps its full text and
        // cascades to the outside fallback. (Only an inside-only placement binds the text to the bar.)
        it('keeps full text and cascades an oversized inside-first label to the outside fallback', async () => {
            // A narrow, centred bin whose long label cannot fit inside. Without the fix the label is fitted
            // to the tiny inside container and dropped; with it, full text cascades to the outside fallback.
            const opts: any = {
                data: Array.from({ length: 5 }, () => ({ x: 2 })),
                legend: { enabled: false },
                padding: { top: 100, right: 100, bottom: 10, left: 100 },
                axes: { x: { type: 'number', min: 0, max: 4 }, y: { type: 'number', min: 0, max: 100 } },
                series: [
                    {
                        type: 'histogram',
                        xKey: 'x',
                        bins: [[1.9, 2.1]],
                        label: {
                            enabled: true,
                            formatter: () => 'WWWWWWWWWWWWWWWWWWWW',
                            placement: ['inside-center', 'outside-end'],
                            collision: { alwaysShow: false },
                        },
                    },
                ],
            };
            prepareTestOptions(opts);
            chart = AgCharts.create(opts);
            await waitForChartStability(chart);
            const series = deproxy(chart as any).series[0] as unknown as {
                labelSelection: { nodes(): { visible: boolean; datum: { label?: { placement?: string } } }[] };
            };
            const labels = series.labelSelection.nodes().filter((node) => node.visible);
            expect(labels).toHaveLength(1);
            expect(labels[0].datum.label?.placement).toBe('outside-end');
        });

        // The short bins keep the `outside-end` label above the bar; the full-height bin whose
        // `outside-end` overflows the top series area cascades to `inside-center`; the full-height bin
        // with a label too wide to fit inside exercises the overflow policy, which the two cases below
        // resolve differently.
        const multiBinCascade = (label: object) => {
            const binData = [
                ...Array.from({ length: 3 }, () => ({ x: 0.5 })),
                ...Array.from({ length: 6 }, () => ({ x: 1.5 })),
                ...Array.from({ length: 10 }, () => ({ x: 2.5 })),
                ...Array.from({ length: 10 }, () => ({ x: 3.5 })),
            ];
            return {
                data: binData,
                legend: { enabled: false },
                padding: { top: 60, right: 10, bottom: 10, left: 10 },
                axes: { x: { type: 'number' }, y: { type: 'number', min: 0, max: 10 } },
                series: [
                    {
                        type: 'histogram',
                        xKey: 'x',
                        bins: [
                            [0, 1],
                            [1, 2],
                            [2, 3],
                            [3, 4],
                        ],
                        label: {
                            enabled: true,
                            formatter: ({ binIndex, frequency }: any) =>
                                binIndex === 3 ? 'WWWWWWWWWWWWWWWWWWWW' : String(frequency),
                            placement: ['outside-end', 'inside-center'],
                            collision: { alwaysShow: false, collideWith: { seriesArea: true } },
                            ...label,
                        },
                    },
                ],
            };
        };

        // A placement array turns truncation on, so the oversized label is ellipsised into the candidate
        // that keeps the most of it rather than dropped.
        it('renders outside, cascaded-inside and dropped labels across a multi-bin chart', async () => {
            await renderAndSnapshot(multiBinCascade({}));
        });

        // Opting out of truncation leaves nothing to fall back on: every candidate for the oversized
        // label overflows at full text, so it is dropped instead.
        it('drops rather than truncates the oversized label when truncate is off', async () => {
            await renderAndSnapshot(multiBinCascade({ truncate: false }));
        });
    });

    // A `placement` array is an ordered fallback list: the first candidate that clears its obstacles wins,
    // so an array whose first candidate already fits renders identically to that single placement.
    describe('bar-family placement cascade (first fitting candidate wins)', () => {
        const barData = Array.from({ length: 8 }, (_, i) => ({ x: `C${i}`, y: 20 + 10 * Math.sin(i) }));
        const barOptions = (placement: string | string[]) => ({
            data: barData,
            legend: { enabled: false },
            axes: { x: { type: 'category', position: 'bottom' }, y: { type: 'number', position: 'left' } },
            series: [{ type: 'bar', xKey: 'x', yKey: 'y', label: { enabled: true, placement } }],
        });

        it('bar renders an array placement identically to its fitting first candidate', async () => {
            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createChart,
                barOptions('inside-end') as any,
                barOptions(['inside-end', 'outside-end']) as any
            );
        });

        const histData = Array.from({ length: 8 }, (_, i) => ({ x: 20 + 10 * Math.sin(i) }));
        const histOptions = (placement: string | string[]) => ({
            data: histData,
            legend: { enabled: false },
            axes: { x: { type: 'number', position: 'bottom' }, y: { type: 'number', position: 'left' } },
            series: [{ type: 'histogram', xKey: 'x', label: { enabled: true, placement } }],
        });

        it('histogram renders an array placement identically to its fitting first candidate', async () => {
            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createChart,
                histOptions('inside-center') as any,
                histOptions(['inside-center', 'outside-end']) as any
            );
        });
    });

    // `label.orientation` rotates bar-family labels: `horizontal` reads upright, the two `vertical`
    // variants a quarter-turn in either direction. Both a column and a horizontal bar are exercised
    // per orientation.
    describe('bar label orientation', () => {
        const barData = Array.from({ length: 6 }, (_, i) => ({ cat: `Category ${i}`, value: 30 + 10 * Math.sin(i) }));
        const orientations = ['horizontal', 'vertical', 'vertical-reversed'];
        const barOrientationOptions = (orientation: string, direction: 'vertical' | 'horizontal') => ({
            data: barData,
            legend: { enabled: false },
            axes:
                direction === 'vertical'
                    ? { x: { type: 'category', position: 'bottom' }, y: { type: 'number', position: 'left' } }
                    : { x: { type: 'number', position: 'bottom' }, y: { type: 'category', position: 'left' } },
            series: [{ type: 'bar', xKey: 'cat', yKey: 'value', direction, label: { enabled: true, orientation } }],
        });

        for (const orientation of orientations) {
            it(`renders a column with orientation '${orientation}'`, async () => {
                await renderAndSnapshot(barOrientationOptions(orientation, 'vertical'));
            });

            it(`renders a horizontal bar with orientation '${orientation}'`, async () => {
                await renderAndSnapshot(barOrientationOptions(orientation, 'horizontal'));
            });
        }

        // `horizontal` maps to 0deg (upright), so it must render identically to an unrotated label —
        // pinning the mapping and the unset default.
        it('renders a horizontal label identically to no orientation', async () => {
            const unset = barOrientationOptions('horizontal', 'vertical');
            delete (unset.series[0].label as { orientation?: string }).orientation;
            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createChart,
                unset as any,
                barOrientationOptions('horizontal', 'vertical') as any
            );
        });

        // Orientation array fall-through: many thin columns whose long upright (horizontal) label
        // overflows the bar width, forcing every label through to vertical.
        const thinColumns = (orientation: string | string[]) => ({
            data: Array.from({ length: 12 }, (_, i) => ({ cat: `Category ${i}`, value: 50 })),
            legend: { enabled: false },
            axes: { x: { type: 'category', position: 'bottom' }, y: { type: 'number', position: 'left' } },
            series: [
                {
                    type: 'bar',
                    xKey: 'cat',
                    yKey: 'value',
                    direction: 'vertical',
                    label: { enabled: true, orientation, formatter: () => 'WWWWWWWWWW' },
                },
            ],
        });

        // Every horizontal label overflows its thin bar, so the array resolves to vertical for all
        // of them — matching a fixed `vertical` orientation exactly.
        it('falls through to vertical when the horizontal label overflows a thin bar', async () => {
            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createChart,
                thinColumns(['horizontal', 'vertical']) as any,
                thinColumns('vertical') as any
            );
        });

        // A single-element array has nothing to resolve, so it must render identically to the scalar
        // (the byte-identical fast path that keeps existing charts out of the placement engine).
        it('renders a single-element orientation array identically to the scalar', async () => {
            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createChart,
                barOrientationOptions(['vertical'] as any, 'vertical') as any,
                barOrientationOptions('vertical', 'vertical') as any
            );
        });

        // Shrinking the chart width must not make a resolved vertical label snap back to the wider
        // horizontal bake. Once a bar is too narrow for horizontal the engine picks vertical; a bar too
        // narrow for even vertical hides its label (an orientation array opts into overflow management),
        // which must not be reached by reverting to the first (horizontal) orientation baked at
        // node-data time, since that would overflow the bar rect.
        it('keeps a narrowing bar label vertical instead of reverting to horizontal', async () => {
            const optionsAt = (width: number) => {
                const options = {
                    data: Array.from({ length: 8 }, (_, i) => ({ cat: `Category ${i}`, value: 100 })),
                    legend: { enabled: false },
                    axes: {
                        x: { type: 'category', position: 'bottom' },
                        y: { type: 'number', position: 'left', max: 100 },
                    },
                    series: [
                        {
                            type: 'bar',
                            xKey: 'cat',
                            yKey: 'value',
                            label: {
                                enabled: true,
                                placement: 'inside-center',
                                orientation: ['horizontal', 'vertical'],
                                formatter: () => 'WWWWWWWWWW',
                            },
                        },
                    ],
                };
                prepareTestOptions(options as any);
                (options as any).width = width;
                return options as any;
            };

            // Rotation of the first rendered label, or `undefined` once the bars are too narrow to show
            // any label at all.
            const firstLabelRotation = () => {
                const series = deproxy(chart as any).series[0] as unknown as {
                    contextNodeData?: {
                        labelData?: { label?: { text?: unknown; rotation?: number; hidden?: boolean } }[];
                    };
                };
                const labelData = series.contextNodeData?.labelData ?? [];
                const labelled = labelData.find(
                    (d) => d.label != null && d.label.text !== '' && d.label.hidden !== true
                );
                return labelled == null ? undefined : (labelled.label?.rotation ?? 0);
            };

            chart = AgCharts.create(optionsAt(1000));
            await waitForChartStability(chart);

            const rotations: (number | undefined)[] = [];
            for (const width of [1000, 700, 500, 350, 240, 160, 110, 70]) {
                await chart.update(optionsAt(width));
                await waitForChartStability(chart);
                rotations.push(firstLabelRotation());
            }

            // The scenario must actually reach vertical at some width, after which every label that is
            // still rendered stays vertical rather than reverting to the horizontal (0) bake.
            const firstVertical = rotations.findIndex((rotation) => rotation != null && rotation !== 0);
            expect(firstVertical).toBeGreaterThanOrEqual(0);
            for (let i = firstVertical; i < rotations.length; i++) {
                expect(rotations[i]).not.toBe(0);
            }
        });

        // A vertical label is rendered by rotating its Text node about the untransformed glyph-box
        // centre. If the pivot is re-derived each render from a box that already folds in the previous
        // rotation, it walks a little every resize step — the label orbits the rect centre and drifts
        // out of the bar. Resizing away and back must leave the node's pivot exactly where it started
        // (AG-17782).
        it('keeps a vertical label pivot stable across resizes (no drift)', async () => {
            const optionsAt = (width: number) => {
                const options = {
                    data: Array.from({ length: 12 }, (_, i) => ({ cat: `Category ${i}`, value: 50 })),
                    legend: { enabled: false },
                    axes: { x: { type: 'category', position: 'bottom' }, y: { type: 'number', position: 'left' } },
                    series: [
                        {
                            type: 'bar',
                            xKey: 'cat',
                            yKey: 'value',
                            label: {
                                enabled: true,
                                placement: 'inside-center',
                                orientation: ['horizontal', 'vertical'],
                                formatter: () => 'WWWWWWWWWW',
                            },
                        },
                    ],
                };
                prepareTestOptions(options as any);
                (options as any).width = width;
                return options as any;
            };

            const firstRotatedLabelPivot = () => {
                const series = deproxy(chart as any).series[0] as unknown as {
                    labelSelection: {
                        nodes(): {
                            visible: boolean;
                            rotation: number;
                            rotationCenterX: number;
                            rotationCenterY: number;
                        }[];
                    };
                };
                return series.labelSelection.nodes().find((node) => node.visible && node.rotation !== 0);
            };

            chart = AgCharts.create(optionsAt(900));
            await waitForChartStability(chart);

            const initial = firstRotatedLabelPivot();
            // Anti-vacuous guard: the scenario must actually produce a rotated (vertical) label.
            expect(initial).toBeDefined();
            const { rotationCenterX, rotationCenterY } = initial!;

            for (const width of [900, 700, 500, 700, 900, 500, 900]) {
                await chart.update(optionsAt(width));
                await waitForChartStability(chart);
            }

            const settled = firstRotatedLabelPivot();
            expect(settled).toBeDefined();
            expect(settled!.rotationCenterX).toBeCloseTo(rotationCenterX);
            expect(settled!.rotationCenterY).toBeCloseTo(rotationCenterY);
        });

        // An inside-start/inside-end label is anchored at the bar's start/end edge. When the array
        // resolves to the along-bar (vertical) orientation, the label is rotated about its glyph
        // centre — which sits at that edge — so without a correction it straddles the end and half of
        // it pokes out of the bar. The placement engine must slide it flush inside the rect (AG-17782).
        const thinTallColumns = (placement: string) => ({
            data: Array.from({ length: 10 }, (_, i) => ({ cat: `Category ${i}`, value: 100 })),
            legend: { enabled: false },
            axes: { x: { type: 'category', position: 'bottom' }, y: { type: 'number', position: 'left', max: 100 } },
            series: [
                {
                    type: 'bar',
                    xKey: 'cat',
                    yKey: 'value',
                    label: {
                        enabled: true,
                        placement,
                        orientation: ['horizontal', 'vertical'],
                        formatter: () => 'WWWWWWWWWW',
                    },
                },
            ],
        });

        for (const placement of ['inside-start', 'inside-end']) {
            it(`keeps a resolved '${placement}' label inside the bar rect`, async () => {
                await renderAndSnapshot(thinTallColumns(placement));
            });

            it(`slides a resolved '${placement}' label flush within the bar rect`, async () => {
                const options = thinTallColumns(placement);
                prepareTestOptions(options as any);
                chart = AgCharts.create(options as any);
                await waitForChartStability(chart);

                const series = deproxy(chart as any).series[0] as unknown as {
                    contextNodeData?: { nodeData?: { x: number; y: number; width: number; height: number }[] };
                    labelSelection: {
                        nodes(): {
                            visible: boolean;
                            rotation: number;
                            computeBBox(): { x: number; y: number; width: number; height: number } | undefined;
                        }[];
                    };
                };
                const bars = series.contextNodeData?.nodeData ?? [];
                const rotatedLabels = series.labelSelection
                    .nodes()
                    .filter((node) => node.visible && node.rotation !== 0);

                // Anti-vacuous guard: the scenario must actually resolve to a rotated label per bar.
                expect(rotatedLabels.length).toBe(bars.length);

                for (const node of rotatedLabels) {
                    const bbox = node.computeBBox();
                    expect(bbox).toBeDefined();
                    const bar = bars.find(
                        (b) => bbox!.x + bbox!.width / 2 >= b.x && bbox!.x + bbox!.width / 2 <= b.x + b.width
                    );
                    expect(bar).toBeDefined();
                    expect(bbox!.y).toBeGreaterThanOrEqual(bar!.y - 0.5);
                    expect(bbox!.y + bbox!.height).toBeLessThanOrEqual(bar!.y + bar!.height + 0.5);
                }
            });
        }
    });

    // A bar-family label with an orientation array but only a single `placement` and default
    // `alwaysShow` is baked (not routed through positioned candidates), yet still `usesPlacedLabels`
    // because the engine must resolve its orientation. It must never see its own baked footprint as a
    // `label` obstacle — neither during its own resolution nor as a cross-series obstacle other series'
    // labels are asked to avoid.
    describe('orientation-array bar label is not its own obstacle', () => {
        const barData = Array.from({ length: 8 }, (_, i) => ({ cat: `Category ${i}`, bar: 30 + 10 * Math.sin(i) }));
        const comboData = barData.map((d, i) => ({ ...d, line: 20 + 8 * Math.cos(i) }));
        const plainAxes = {
            x: { type: 'category', position: 'bottom' },
            y: { type: 'number', position: 'left' },
        };

        // `alwaysShow` pins the baked path this case covers: an orientation array alone would opt the
        // label into overflow management, routing it through positioned candidates and hiding the ones
        // that cannot be placed — a different mechanism from the self-obstacle behaviour pinned here.
        const barLabel = {
            enabled: true,
            orientation: ['horizontal', 'vertical'] as const,
            placement: 'outside-end',
            collision: { alwaysShow: true },
        };

        const barRotations = () => {
            const series = deproxy(chart as any).series[0] as unknown as {
                labelSelection: { nodes(): { visible: boolean }[] };
                contextNodeData?: { labelData?: { label?: { rotation?: number } }[] };
            };
            const visible = series.labelSelection.nodes().filter((node) => node.visible).length;
            const rotations = (series.contextNodeData?.labelData ?? []).map((d) => d.label?.rotation ?? 0);
            return { visible, rotations };
        };

        it('places every bar label at its single-series orientation alongside a second collision series', async () => {
            const barOnlyOptions: any = {
                data: barData,
                legend: { enabled: false },
                axes: plainAxes,
                series: [{ type: 'bar', xKey: 'cat', yKey: 'bar', label: barLabel }],
            };
            prepareTestOptions(barOnlyOptions);
            chart = AgCharts.create(barOnlyOptions);
            await waitForChartStability(chart);
            const baseline = barRotations();
            // Anti-vacuous guard: every bar must actually render a label in the baseline.
            expect(baseline.visible).toBe(barData.length);

            chart.destroy();
            const comboOptions: any = {
                data: comboData,
                legend: { enabled: false },
                axes: plainAxes,
                series: [
                    { type: 'bar', xKey: 'cat', yKey: 'bar', label: barLabel },
                    {
                        type: 'line',
                        xKey: 'cat',
                        yKey: 'line',
                        marker: { enabled: true, size: 6 },
                        label: { enabled: true, placement: 'bottom' },
                    },
                ],
            };
            prepareTestOptions(comboOptions);
            chart = AgCharts.create(comboOptions);
            await waitForChartStability(chart);
            const combo = barRotations();

            // A self-obstacle would make the bar wrongly perceive a collision with its own label,
            // potentially hiding it or flipping its orientation once a second series is present.
            expect(combo.visible).toBe(barData.length);
            expect(combo.rotations).toEqual(baseline.rotations);
        });

        it('does not contribute its own routed label as a `label` obstacle for other series to avoid', async () => {
            const options: any = {
                data: comboData,
                legend: { enabled: false },
                axes: { x: { type: 'category', position: 'bottom' }, y: { type: 'number', position: 'left' } },
                series: [
                    { type: 'bar', xKey: 'cat', yKey: 'bar', label: barLabel },
                    {
                        type: 'line',
                        xKey: 'cat',
                        yKey: 'line',
                        marker: { enabled: true, size: 6 },
                        label: { enabled: true, placement: 'bottom' },
                    },
                ],
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const bar = deproxy(chart as any).series[0] as unknown as {
                getLabelObstacles(): { kind: string; category?: string }[] | undefined;
            };
            const obstacles = bar.getLabelObstacles() ?? [];
            // Anti-vacuous guard: the bar still contributes its rects as `seriesItem` obstacles.
            expect(obstacles.length).toBe(barData.length);
            expect(obstacles.every((o) => o.category === 'seriesItem')).toBe(true);
        });
    });

    // An inside label's spacing is a gap from the bar's value end, so it applies only along the bar's
    // length axis. On the cross axis the label may span the full bar width/height and must not be
    // rejected as a collision, letting a candidate that overflows the old all-sides inset be kept.
    describe('inside-label spacing applies only along the bar-length axis', () => {
        const labelNodes = () => {
            const series = deproxy(chart as any).series[0] as unknown as {
                contextNodeData?: { nodeData?: { x: number; y: number; width: number; height: number }[] };
                labelSelection: {
                    nodes(): {
                        visible: boolean;
                        rotation: number;
                        computeBBox(): { x: number; y: number; width: number; height: number } | undefined;
                    }[];
                };
            };
            const bars = series.contextNodeData?.nodeData ?? [];
            const labels = series.labelSelection.nodes().filter((node) => node.visible);
            return { bars, labels };
        };

        it('vertical bar: keeps the horizontal label spanning the bar width instead of rotating it', async () => {
            const spacing = 35;
            const options = {
                data: Array.from({ length: 8 }, (_, i) => ({ cat: `Category ${i}`, value: 100 })),
                legend: { enabled: false },
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left', max: 100 },
                },
                series: [
                    {
                        type: 'bar',
                        xKey: 'cat',
                        yKey: 'value',
                        label: {
                            enabled: true,
                            placement: 'inside-center',
                            orientation: ['horizontal', 'vertical'],
                            spacing,
                            formatter: () => 'Hello',
                        },
                    },
                ],
            };
            prepareTestOptions(options as any);
            // Thin columns (each narrower than twice the spacing) so the old all-sides inset region
            // would reject the horizontal label, while it still fits the bar's full width.
            (options as any).width = 500;
            (options as any).height = 400;
            chart = AgCharts.create(options as any);
            await waitForChartStability(chart);

            const { bars, labels } = labelNodes();
            expect(labels.length).toBe(bars.length);
            for (const node of labels) {
                const bbox = node.computeBBox();
                expect(bbox).toBeDefined();
                const bar = bars.find(
                    (b) => bbox!.x + bbox!.width / 2 >= b.x && bbox!.x + bbox!.width / 2 <= b.x + b.width
                );
                expect(bar).toBeDefined();
                // The label stayed horizontal: it fits the bar's full width with no cross-axis spacing.
                expect(node.rotation).toBe(0);
                expect(bbox!.width).toBeLessThanOrEqual(bar!.width + 0.5);
                // Anti-vacuous: the label is wider than the old all-sides inset region, so the previous
                // behaviour would have rejected the horizontal candidate and rotated it to vertical.
                expect(bbox!.width).toBeGreaterThan(bar!.width - 2 * spacing);
            }
        });

        it('horizontal bar: keeps the vertical label spanning the bar height instead of rotating it', async () => {
            const spacing = 35;
            const options = {
                data: Array.from({ length: 8 }, (_, i) => ({ cat: `Category ${i}`, value: 100 })),
                legend: { enabled: false },
                axes: {
                    x: { type: 'number', position: 'bottom', max: 100 },
                    y: { type: 'category', position: 'left' },
                },
                series: [
                    {
                        type: 'bar',
                        direction: 'horizontal',
                        xKey: 'cat',
                        yKey: 'value',
                        label: {
                            enabled: true,
                            placement: 'inside-center',
                            orientation: ['vertical', 'horizontal'],
                            spacing,
                            formatter: () => 'Hello',
                        },
                    },
                ],
            };
            prepareTestOptions(options as any);
            // Thin bars (each shorter than twice the spacing) so the old all-sides inset region would
            // reject the vertical label, while it still fits the bar's full height.
            (options as any).width = 400;
            (options as any).height = 500;
            chart = AgCharts.create(options as any);
            await waitForChartStability(chart);

            const { bars, labels } = labelNodes();
            expect(labels.length).toBe(bars.length);
            for (const node of labels) {
                const bbox = node.computeBBox();
                expect(bbox).toBeDefined();
                const bar = bars.find(
                    (b) => bbox!.y + bbox!.height / 2 >= b.y && bbox!.y + bbox!.height / 2 <= b.y + b.height
                );
                expect(bar).toBeDefined();
                // The label stayed vertical: it fits the bar's full height with no cross-axis spacing.
                expect(node.rotation).not.toBe(0);
                expect(bbox!.height).toBeLessThanOrEqual(bar!.height + 0.5);
                // Anti-vacuous: the label is taller than the old all-sides inset region.
                expect(bbox!.height).toBeGreaterThan(bar!.height - 2 * spacing);
            }
        });
    });

    // `alwaysShow` gates only the terminal hide-vs-keep decision once collision resolution has run;
    // it is orthogonal to fit (wrapping/truncation) and placement cascade, which always apply
    // regardless of its value.
    describe('collision.alwaysShow (acceptance criteria)', () => {
        it('alwaysShow: false hides a label that cannot avoid a collision', async () => {
            // Anti-vacuous guard: some labels must actually collide for the assertion to be meaningful.
            const placed = await renderPlaced({ collision: { alwaysShow: false } });
            expect(placed.length).toBeLessThan(closeData.length);
        });

        it('alwaysShow: true keeps every label visible at its least-overflow candidate', async () => {
            const placed = await renderPlaced({ collision: { alwaysShow: true } });
            expect(placed.length).toBe(closeData.length);
        });

        it('still cascades a placement fallback for a kept label when alwaysShow is true', async () => {
            const placed = await renderPlaced({
                collision: { alwaysShow: true },
                placement: ['top', 'bottom'],
            });
            expect(placed.length).toBe(closeData.length);
            // Anti-vacuous guard: at least one label must have been pushed off the default 'top' candidate.
            expect(placed.some((label) => label.placement === 'bottom')).toBe(true);
        });

        it('still wraps and truncates a kept label when alwaysShow is true', async () => {
            const placed = await renderPlaced({
                collision: { alwaysShow: true },
                maxWidth: 20,
                wrapping: 'on-space',
                truncate: true,
                formatter: () => 'A very long label that must wrap and truncate',
            });
            expect(placed.length).toBe(closeData.length);
            const texts = placed.map((label) => String(label.text ?? ''));
            expect(texts.some((text) => text.includes('\n'))).toBe(true);
            expect(texts.some((text) => text.includes('…'))).toBe(true);
        });
    });

    // `collision.threshold` is the collision-detection threshold applied to the label's own box: 0 is a
    // no-op, a negative value tolerates overlap up to `|threshold|` px. A negative value must also pass
    // validation (setupMockConsole fails the test on any validation warning).
    describe('collision.threshold (acceptance criteria)', () => {
        it('threshold: 0 keeps the label box unchanged, hiding a colliding label', async () => {
            const placed = await renderPlaced({ collision: { alwaysShow: false, threshold: 0 } });
            // Anti-vacuous guard: labels must actually collide for the tolerance assertions to be meaningful.
            expect(placed.length).toBeLessThan(closeData.length);
        });

        it('a negative threshold tolerates overlap and keeps every label', async () => {
            const placed = await renderPlaced({ collision: { alwaysShow: false, threshold: -1000 } });
            expect(placed.length).toBe(closeData.length);
        });
    });

    // The threshold is a property of the label's own box, so it acts identically on both axes, against
    // obstacles and against the shape the label sits on alike.
    describe('collision.threshold applies on both axes', () => {
        // The top segment is short in the first category and tall in the rest, so only the first
        // label is bound by the value axis — isolating the axis a negative threshold has to relax.
        const stackedOptions = (threshold: number) => ({
            data: [
                { cat: 'A', base: 14, top: 6 },
                { cat: 'B', base: 124, top: 20 },
                { cat: 'C', base: 112, top: 20 },
            ],
            legend: { enabled: false },
            series: [
                { type: 'bar', xKey: 'cat', yKey: 'base', stacked: true },
                {
                    type: 'bar',
                    xKey: 'cat',
                    yKey: 'top',
                    stacked: true,
                    label: {
                        enabled: true,
                        placement: 'inside-center',
                        // Binds the label's fit to the segment rect, so the value-axis extent decides
                        // how many lines survive rather than the fit policy alone.
                        truncate: true,
                        formatter: () => 'wwwwwwww w wwwwww wwwwwww wwwwwwwww wwwwwwwwww wwww ww',
                        collision: { alwaysShow: false, threshold },
                    },
                },
            ],
        });

        const shortSegmentLabelBox = async (threshold: number) => {
            chart?.destroy();
            const options = stackedOptions(threshold);
            prepareTestOptions(options as any);
            chart = AgCharts.create(options as any);
            await waitForChartStability(chart);
            const series = deproxy(chart as any).series[1] as unknown as {
                labelSelection: { nodes(): { visible: boolean; computeBBox(): LabelBox | undefined }[] };
            };
            const [node] = series.labelSelection.nodes();
            expect(node).toBeDefined();
            expect(node.visible).toBe(true);
            const box = node.computeBBox();
            expect(box).toBeDefined();
            return box!;
        };

        it('a negative threshold relaxes the value axis, not just the cross axis', async () => {
            const at0 = await shortSegmentLabelBox(0);
            const relaxed = await shortSegmentLabelBox(-50);
            // Cross axis: the label is already allowed to bleed past the bar's sides.
            expect(relaxed.width).toBeGreaterThan(at0.width);
            // Value axis: it must gain the same tolerance and wrap to more lines, rather than staying
            // pinned to the single line the short segment's height allows.
            expect(relaxed.height).toBeGreaterThan(at0.height);
        });

        // Narrow bars of varied height, so a label too big for its bar spills past the sides (cross axis)
        // and past a short bar's ends (value axis) rather than being truncated back inside it.
        const spillOptions = (threshold: number) => ({
            data: [
                { cat: 'A', value: 8 },
                { cat: 'B', value: 60 },
                { cat: 'C', value: 14 },
                { cat: 'D', value: 90 },
                { cat: 'E', value: 22 },
            ],
            legend: { enabled: false },
            series: [
                {
                    type: 'bar',
                    xKey: 'cat',
                    yKey: 'value',
                    label: {
                        enabled: true,
                        placement: 'inside-center',
                        truncate: true,
                        color: 'black',
                        formatter: () => 'Inside label that overflows its bar',
                        collision: { alwaysShow: false, threshold },
                    },
                },
            ],
        });

        it('renders inside labels spilling past their bar on both axes', async () => {
            await renderAndSnapshot(spillOptions(-40));
        });
    });

    // `label.spacing` is the gap in px between a marker-based label and its anchor point; a larger value
    // pushes the label further from the marker along its placement direction.
    describe('label.spacing (acceptance criteria)', () => {
        // A single isolated point, so the label always takes its 'top' candidate with no collision.
        const spacingData = [{ x: 12, y: 50 }];

        const anchorGap = async (spacing: number) => {
            chart?.destroy();
            const options: any = {
                data: spacingData,
                legend: { enabled: false },
                axes: tightAxes,
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        marker: { enabled: true, size: 6 },
                        label: {
                            enabled: true,
                            formatter: ({ value }: any) => String(value),
                            placement: 'top',
                            spacing,
                        },
                    },
                ],
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            return topLabelAnchorGap(deproxy(chart as any).series[0] as unknown as PlacedLabelGeometry);
        };

        it('measures spacing from the marker edge, so the anchor gap is marker radius + spacing', async () => {
            // marker size 6 => radius 3; the label box edge sits radius + spacing from the marker centre.
            const near = await anchorGap(5);
            const far = await anchorGap(40);
            expect(near).toBeCloseTo(3 + 5, 0);
            expect(far).toBeCloseTo(3 + 40, 0);
        });
    });

    // Placement runs on every SERIES_UPDATE but is only recomputed when its inputs change; an option
    // that affects placement must still take effect across an update on the same chart.
    describe('placement invalidation across updates', () => {
        const denseData = Array.from({ length: 20 }, (_, i) => ({ x: i, y: 50 }));

        const lineOptions = (placement: string): any => ({
            data: denseData,
            legend: { enabled: false },
            axes: cartesianAxes,
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                    marker: { enabled: true, size: 6 },
                    label: {
                        enabled: true,
                        formatter: ({ value }: any) => `label-${value}`,
                        placement,
                        collision: { alwaysShow: true },
                    },
                },
            ],
        });

        const visibleLabelYs = () => {
            const series = deproxy(chart as any).series[0] as unknown as {
                labelSelection: { nodes(): { visible: boolean; computeBBox(): { y: number } | undefined }[] };
            };
            return series.labelSelection
                .nodes()
                .filter((node) => node.visible)
                .map((node) => node.computeBBox()!.y);
        };

        it('re-places labels when label.placement changes on an existing chart', async () => {
            const top = lineOptions('top');
            prepareTestOptions(top);
            chart = AgCharts.create(top);
            await waitForChartStability(chart);
            const topYs = visibleLabelYs();
            // Anti-vacuous guard: placement is only observable when labels actually render.
            expect(topYs.length).toBeGreaterThan(0);

            await chart.update(prepareTestOptions(lineOptions('bottom')));
            await waitForChartStability(chart);
            const bottomYs = visibleLabelYs();

            expect(bottomYs.length).toBe(topYs.length);
            // A 'bottom' placement sits the label below each vertex, a 'top' one above it; if the option
            // change had not re-run placement the label positions would be identical.
            expect(bottomYs).not.toEqual(topYs);
        });
    });
});
