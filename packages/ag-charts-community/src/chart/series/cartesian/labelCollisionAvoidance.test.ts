import { afterEach, describe, expect, it, vi } from 'vitest';

import { ExtendedPath2D, type RotatableText, Transformable, markerLabelRect } from 'ag-charts-core';
import type {
    AgBarSeriesLabelPlacement,
    AgCartesianChartOptions,
    AgChartInstance,
    AgChartLabelOrientation,
    AgHistogramSeriesLabelPlacement,
    AgMarkerShape,
    AgMarkerShapeFn,
} from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import { Marker } from '../../marker/marker';
import { getAxisLabelNodes } from '../../test/axisAccessors';
import { expectPixelIdenticalAcrossUpdate } from '../../test/bigintExamples';
import {
    getPlacedLabelData,
    getSeriesLabelObstacles,
    getVisibleLabelTextNodes,
    withUndocumentedChartOptions,
} from '../../test/communitySeriesAccessors';
import { markerUnderLabelPlaced, markerUnderOptions, plainRect } from '../../test/markerUnderFixtures';
import { getSeriesAt, getSeriesContextNodeData, getSeriesSelectionNodes } from '../../test/seriesAccessors';
import { shapesOf } from '../../test/shadowFixtures';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    PATTERN_SNAPSHOT_DEFAULTS,
    SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
    clickLegendItem,
    compareImageSnapshot,
    createChart,
    deproxy,
    getVisibleLabelNodes,
    hoverAction,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    topLabelAnchorGap,
    waitForChartStability,
} from '../../test/utils';

// Placements differ per series type, so these option objects are built untyped and passed through to
// `createChart` unchecked.
type LabelCollisionConfig = {
    placement?: string[];
    collision?: {
        threshold?: number;
        alwaysShow?: boolean;
        collideWith?: object;
    };
    spacing?: number;
    truncate?: boolean;
};

// `truncate: false` throughout: an array-valued `placement` defaults it on (see
// `LABEL_OVERFLOW_DEFAULTS`), letting a colliding label give up text instead of taking a placement.
const PLACED_LABEL_STRATEGIES: Record<string, LabelCollisionConfig> = {
    'keep overlapping (alwaysShow: true)': {
        placement: ['top', 'bottom'],
        collision: { alwaysShow: true },
        truncate: false,
    },
    'reposition top-bottom': {
        placement: ['top', 'bottom'],
        collision: { alwaysShow: false },
        truncate: false,
    },
    'reposition left-right': {
        placement: ['left', 'right'],
        collision: { alwaysShow: false },
        truncate: false,
    },
    'reposition all directions': {
        placement: ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
        collision: { alwaysShow: false },
        truncate: false,
    },
    'reposition with min spacing': {
        placement: ['top', 'bottom'],
        collision: { alwaysShow: false, threshold: 3 },
        truncate: false,
    },
};

// Scatter and bubble label at their own fixed `label.placement` and ignore the candidates, so
// `alwaysShow` is the only meaningful axis for marker series.
const MARKER_LABEL_STRATEGIES: Record<string, LabelCollisionConfig> = {
    'keep overlapping (alwaysShow: true)': { collision: { alwaysShow: true } },
    'hide on collision (alwaysShow: false, default)': { collision: { alwaysShow: false } },
};

type LabelBox = { x: number; y: number; width: number; height: number };

// The visible labels' bounding boxes for a series, used by the cross-series obstacle tests to assert one
// series' labels clear another's.
const seriesVisibleLabelBoxes = (chart: AgChartInstance, seriesIndex: number) =>
    getVisibleLabelTextNodes(chart, seriesIndex).map((node): LabelBox => node.getBBox());

describe('label collision avoidance', () => {
    setupMockConsole();

    let chart: AgChartInstance;
    const ctx = setupMockCanvas();

    afterEach(() => {
        chart?.destroy();
    });

    const renderAndSnapshot = async (options: object, defaults = IMAGE_SNAPSHOT_DEFAULTS) => {
        chart = await createChart(options);
        await compareImageSnapshot(chart, ctx, defaults);
    };

    const placedLabelPlacements = () => getPlacedLabelData(chart);

    const renderedLabelTexts = () => getVisibleLabelNodes(chart).map((node) => node.text);

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
        chart = await createChart(options);
        return getPlacedLabelData(chart);
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

        const placedLabels = () => getPlacedLabelData(chart);

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
            chart = await createChart(options);
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

        const placedLabels = () => getPlacedLabelData(chart);

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
            chart = await createChart(options);
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
            const nodes = getSeriesSelectionNodes<RotatableText>(chart, 'labelSelection');
            return getPlacedLabelData(chart).flatMap((placed, index) =>
                nodes[index] == null ? [] : [{ box: nodes[index].getBBox(), marker: placed.datum.point }]
            );
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
                        ...(type === 'scatter'
                            ? { labelKey: 'y', size: 100 }
                            : { marker: { enabled: true, size: 100 } }),
                        label: {
                            enabled: true,
                            placement: 'inside',
                            formatter: () => 'Ab',
                            ...labelStyle,
                        },
                    },
                ],
            };
            chart = await createChart(options);
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

    // Three close parallel lines: the middle label collides top and bottom and falls through to `inside`,
    // where it fits the 23px marker rather than being dropped.
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

    // Marker series cascade a mixed `inside`+directional list: the label fits inside the marker when it can,
    // else falls back to a directional placement with full text. Scatter shares BubbleSeries' pipeline.
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
            chart = await createChart(options);
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
            // No vanishing: every label renders at the directional fallback with full text.
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

        // With a size range, small bubbles cascade their labels to top/bottom while large bubbles
        // keep them inside — none vanish.
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
        // Marker series labels may spill into the chart's outer padding band by default; with
        // `collideWith.seriesArea: false` the overflow counts as a collision and hides it.
        const topEdgeData = [{ x: 5, y: 10, size: 4, label: 'Edge' }];
        const edgeAxes = {
            x: { position: 'bottom', type: 'number', min: 0, max: 10 },
            y: { position: 'left', type: 'number', min: 0, max: 10 },
        };

        const seriesOptions = (markerSize: number) => ({
            scatter: { labelKey: 'label', size: markerSize },
            bubble: { labelKey: 'label', sizeKey: 'size', minSize: markerSize, maxSize: markerSize },
            line: { marker: { enabled: true, size: markerSize } },
            area: { marker: { enabled: true, size: markerSize } },
        });

        const render = async (
            type: 'scatter' | 'bubble' | 'line' | 'area',
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
                        ...seriesOptions(markerSize)[type],
                        label: {
                            enabled: true,
                            formatter: () => 'Edge',
                            placement,
                            collision: {
                                alwaysShow: false,
                                ...(seriesArea == null ? {} : { collideWith: { seriesArea } }),
                            },
                        },
                    },
                ],
            };
            chart = await createChart(options);
            return placedLabelPlacements();
        };

        // Over the animatable-node limit, so the update reuses the line's existing node data in place.
        it('line: drops a label overflowing the series area after seriesArea is updated to false', async () => {
            const data = Array.from({ length: 1001 }, (_, x) => ({ x, y: x === 500 ? 10 : 0 }));
            const options = (seriesArea: boolean): AgCartesianChartOptions => ({
                data,
                legend: { enabled: false },
                padding: { top: 80, right: 10, bottom: 10, left: 10 },
                axes: { x: { type: 'number' }, y: { type: 'number', min: 0, max: 10 } },
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        label: {
                            enabled: true,
                            formatter: ({ value }) => (value === 10 ? 'Edge' : ''),
                            collision: { alwaysShow: false, collideWith: { seriesArea } },
                        },
                    },
                ],
            });
            const edgeLabels = () => renderedLabelTexts().filter((text) => text === 'Edge');

            chart = await createChart(options(true));
            expect(edgeLabels()).toHaveLength(1);

            await chart.update(options(false));
            await waitForChartStability(chart);
            expect(edgeLabels()).toHaveLength(0);
        });

        for (const type of ['scatter', 'bubble', 'line', 'area'] as const) {
            it(`${type}: keeps a label overflowing the series area by default`, async () => {
                const placed = await render(type);
                expect(placed.length).toBe(1);
            });

            it(`${type}: drops a label overflowing the series area when collideWith.seriesArea is false`, async () => {
                const placed = await render(type, { seriesArea: false });
                expect(placed.length).toBe(0);
            });

            it(`${type}: keeps the label when seriesArea padding grows the region to contain it`, async () => {
                const placed = await render(type, { seriesArea: false, seriesAreaPaddingTop: 80 });
                expect(placed.length).toBe(1);
            });

            // An `inside` label is fitted to and centred on its marker, so it is exempt from the series-area
            // containment that hides directional labels spilling into the padding band.
            it(`${type}: keeps an inside label centred on an edge marker even with seriesArea false`, async () => {
                const placed = await render(type, { seriesArea: false, placement: 'inside', markerSize: 60 });
                expect(placed.length).toBe(1);
            });
        }
    });

    describe('bar collideWith overrides', () => {
        // Bars resolve collideWith from their theme (shapes and the series area avoided, markers and labels
        // by default) merged with the user's, so a user override must reach the bar label placement path.
        const barAxes = {
            x: { position: 'bottom', type: 'category' },
            y: { position: 'left', type: 'number', min: 0, max: 10 },
        };

        const visibleBarLabelCount = (seriesIndex = 0) => {
            return getVisibleLabelNodes(chart, seriesIndex).length;
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
                chart = await createChart(options);
                return visibleBarLabelCount();
            };

            it('drops an outside label overflowing the series area by default', async () => {
                expect(await render({ alwaysShow: false })).toBe(0);
            });

            it('keeps the outside label when collideWith.seriesArea is true', async () => {
                expect(await render({ alwaysShow: false, collideWith: { seriesArea: true } })).toBe(1);
            });

            // The tallest bar's `outside-end` label fits the 40px series-area padding but not the narrower
            // chart padding, so allowing overflow must not leave it less room than containment does.
            it.each([true, false])(
                'keeps an outside label within a wide series-area padding when seriesArea is %s',
                async (seriesArea) => {
                    chart = await createChart({
                        data: [
                            { x: 'A', y: 10 },
                            { x: 'B', y: 40 },
                        ],
                        legend: { enabled: false },
                        padding: { top: 10 },
                        seriesArea: { padding: { top: 40 } },
                        axes: { x: { position: 'bottom', type: 'category' }, y: { ...barAxes.y, max: 40 } },
                        series: [
                            {
                                type: 'bar',
                                xKey: 'x',
                                yKey: 'y',
                                label: {
                                    enabled: true,
                                    placement: ['outside-end', 'inside-end'],
                                    collision: { collideWith: { seriesArea } },
                                },
                            },
                        ],
                    } as AgCartesianChartOptions);
                    const placements = getVisibleLabelNodes<{ label?: { placement?: string } }>(chart).map(
                        (node) => node.datum?.label?.placement
                    );
                    expect(placements).toEqual(['outside-end', 'outside-end']);
                }
            );
        });

        describe('shapes', () => {
            // Closely spaced bars, so each beside-after-center label lands on its neighbouring bar.
            const besideData = Array.from({ length: 10 }, (_, i) => ({ x: `c${i}`, y: 10 }));

            const render = async (collideWith: object) => {
                chart = await createChart({
                    data: besideData,
                    legend: { enabled: false },
                    axes: barAxes,
                    series: [
                        {
                            type: 'bar',
                            xKey: 'x',
                            yKey: 'y',
                            label: {
                                placement: 'beside-after-center',
                                formatter: () => 'WWWW',
                                collision: { alwaysShow: false, collideWith },
                            },
                        },
                    ],
                } as AgCartesianChartOptions);
                return visibleBarLabelCount();
            };

            it('keeps avoiding neighbouring bars when another collideWith key is set', async () => {
                const avoiding = await render({ seriesArea: true });
                const overlapping = await render({ seriesArea: true, shapes: true });
                expect(avoiding).toBeLessThan(overlapping);
            });
        });

        describe('labels', () => {
            // A line and a bar share a category and top value so their padded label boxes overlap; the line is
            // declared first, so its kept label seeds the obstacle before the hideable bar label resolves.
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
                chart = await createChart(options);
                return visibleBarLabelCount(1);
            };

            it('drops the bar label colliding with the line label by default', async () => {
                // seriesArea allowed so the label is not dropped for overflowing the series area instead.
                expect(await render({ alwaysShow: false, collideWith: { seriesArea: true } })).toBe(0);
            });

            it('keeps the bar label when collideWith.labels is true', async () => {
                expect(await render({ alwaysShow: false, collideWith: { seriesArea: true, labels: true } })).toBe(1);
            });
        });
    });

    // A label that opted into overflow control has a third answer to an obstacle, beyond moving to another
    // placement and giving up: shrinking its bound to the room the obstacle leaves and re-fitting the text
    // into it. A shrunk candidate is still a compromise, so it only ever wins when nothing clears outright.
    describe('shrinking a colliding label into the room its obstacles leave', () => {
        const LABEL_TEXT = 'Annual revenue growth';

        // Eight bars, each label wider than its band, so every `outside-end` label collides with both of its
        // neighbours. Its candidate offers no container of its own — an outside label floats clear of the bar
        // rect — so the obstacles are the only thing that can bound it.
        const renderCrowdedBarLabels = async (label: object) => {
            const options: any = {
                data: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((x, i) => ({ x, y: 5 + (i % 3) })),
                legend: { enabled: false },
                padding: { top: 60, right: 20, bottom: 10, left: 20 },
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number', min: 0, max: 10 },
                },
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        label: {
                            enabled: true,
                            placement: 'outside-end',
                            formatter: () => LABEL_TEXT,
                            // seriesArea allowed so a dropped label can only be the neighbouring-label collision.
                            collision: { alwaysShow: false, collideWith: { seriesArea: true } },
                            ...label,
                        },
                    },
                ],
            };
            chart = await createChart(options);
            return renderedLabelTexts();
        };

        it('wraps floating bar labels into the room their neighbours leave rather than dropping them', async () => {
            const texts = await renderCrowdedBarLabels({ truncate: true });
            expect(texts.length).toBe(8);
            expect(texts.some((text) => text.includes('\n'))).toBe(true);
            // Shrinking to clear a neighbour costs width, which wrapping pays for in height: no text is lost.
            expect(texts.some((text) => text.includes('…'))).toBe(false);
        });

        it('shrinks bar labels that may not be hidden instead of overlapping them', async () => {
            const texts = await renderCrowdedBarLabels({
                truncate: true,
                collision: { alwaysShow: true, collideWith: { seriesArea: true } },
            });
            expect(texts.length).toBe(8);
            // Kept-forever labels still adapt: they wrap into the room their neighbours leave.
            expect(texts.filter((text) => text.includes('\n')).length).toBeGreaterThan(4);
        });

        // Two bars in a plot narrower than either label, so each `outside-end` box overflows the plot on one
        // side as well as colliding with its neighbour.
        it('shrinks bar labels wider than the plot area they overflow', async () => {
            const options: any = {
                data: [
                    { x: 'Alpha Widget', y: 9.6 },
                    { x: 'Beta Widget', y: 9.4 },
                ],
                legend: { enabled: false },
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number', min: 0, max: 12 },
                },
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        label: {
                            enabled: true,
                            placement: 'outside-end',
                            formatter: () => LABEL_TEXT,
                            truncate: true,
                            wrapping: 'on-space',
                            collision: { alwaysShow: true },
                        },
                    },
                ],
            };
            prepareTestOptions(options);
            // Bespoke: the size under test is applied after preparation, which the shared factory would overwrite.
            // This applies to every bare create in this suite.
            options.width = 260;
            options.height = 500;
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            const texts = renderedLabelTexts();
            expect(texts.length).toBe(2);
            expect(texts).not.toContain(LABEL_TEXT);
            await compareImageSnapshot(chart, ctx);
        });

        it('drops the same bar labels when nothing about them can adapt', async () => {
            const texts = await renderCrowdedBarLabels({ wrapping: 'never', truncate: false });
            expect(texts.length).toBeLessThan(8);
        });

        // Two points close enough that their boxed labels overlap at the shared `top` placement, with no
        // second placement to fall through to.
        const renderTwoCrowdedPoints = async (label: object) => {
            const options: any = {
                data: [
                    { x: 10, y: 50 },
                    { x: 13, y: 50 },
                ],
                legend: { enabled: false },
                axes: tightAxes,
                series: [
                    {
                        type: 'bubble',
                        xKey: 'x',
                        yKey: 'y',
                        sizeKey: 'y',
                        labelKey: 'y',
                        minSize: 6,
                        maxSize: 6,
                        label: {
                            enabled: true,
                            placement: 'top',
                            formatter: () => LABEL_TEXT,
                            fill: 'white',
                            padding: 10,
                            collision: { alwaysShow: false },
                            ...label,
                        },
                    },
                ],
            };
            chart = await createChart(options);
            return renderedLabelTexts();
        };

        it('shrinks a crowded point label rather than hiding it', async () => {
            const texts = await renderTwoCrowdedPoints({ truncate: true });
            expect(texts.length).toBe(2);
            // One label keeps its place and its text; the other is re-fitted into what is left beside it.
            expect(texts).toContain(LABEL_TEXT);
            expect(texts.some((text) => text !== LABEL_TEXT)).toBe(true);
        });

        // A marker whose label overhangs it only slightly on the vertical: the cheapest retreat off the
        // colliding box is a couple of pixels of height, which a single-line label cannot spend.
        it('truncates a point label whose cheapest retreat is height it cannot give up', async () => {
            const options: any = {
                data: [
                    { x: 7, y: 7, size: 6, label: 'Tiny Bubble Descriptive Label' },
                    { x: 2, y: 8, size: 30, label: 'Roomy' },
                    { x: 8, y: 2, size: 30, label: 'Spacious' },
                    { x: 8.5, y: 8.5, size: 25, label: 'Wide Open' },
                ],
                padding: { top: 100, right: 10, bottom: 10, left: 10 },
                axes: {
                    x: { type: 'number', min: 0, max: 10 },
                    y: { type: 'number', min: 0, max: 10 },
                },
                series: [
                    {
                        type: 'bubble',
                        xKey: 'x',
                        yKey: 'y',
                        sizeKey: 'size',
                        labelKey: 'label',
                        label: {
                            enabled: true,
                            placement: ['inside', 'top'],
                            truncate: true,
                            wrapping: 'never',
                            collision: { alwaysShow: false },
                        },
                    },
                ],
            };
            prepareTestOptions(options);
            options.width = 350;
            options.height = 350;
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            const texts = renderedLabelTexts();
            expect(texts.length).toBe(4);
            expect(texts).not.toContain('Tiny Bubble Descriptive Label');
            expect(texts.some((text) => text.startsWith('Tiny Bubble') && text.endsWith('\u2026'))).toBe(true);
            await compareImageSnapshot(chart, ctx);
        });

        it('drops the same point label when nothing about it can adapt', async () => {
            expect(await renderTwoCrowdedPoints({ wrapping: 'never', truncate: false })).toHaveLength(1);
        });

        // Both charts carry the same two markers, so the size domain — and with it the roomy marker's own
        // room — is fixed and only the neighbour's distance differs.
        it('shrinks an inside label a neighbouring marker encroaches on, its own marker unchanged', async () => {
            const bubbles = (data: object[], label: object = {}) => {
                const options: any = {
                    data,
                    legend: { enabled: false },
                    axes: {
                        x: { type: 'number', min: 0, max: 10 },
                        y: { type: 'number', min: 0, max: 10 },
                    },
                    series: [
                        {
                            type: 'bubble',
                            xKey: 'x',
                            yKey: 'y',
                            sizeKey: 'size',
                            labelKey: 'label',
                            minSize: 26,
                            maxSize: 190,
                            label: {
                                enabled: true,
                                placement: 'inside',
                                ...label,
                            },
                        },
                    ],
                };
                prepareTestOptions(options);
                options.width = 500;
                options.height = 400;
                return options;
            };
            const roomy = { x: 4, y: 5, size: 10, label: 'Roomy' };
            const near = { x: 4.55, y: 5, size: 1, label: 'N' };
            const far = { x: 9, y: 1, size: 1, label: 'N' };

            const shrinkable = { wrapping: 'never', truncate: true, collision: { alwaysShow: false } };
            chart = AgCharts.create(bubbles([roomy, far], shrinkable));
            await waitForChartStability(chart);
            expect(renderedLabelTexts()).toContain('Roomy');

            chart.destroy();
            chart = AgCharts.create(bubbles([roomy, near], shrinkable));
            await waitForChartStability(chart);
            const crowded = renderedLabelTexts();
            expect(crowded).not.toContain('Roomy');
            expect(crowded.some((text) => text.endsWith('\u2026') && 'Roomy'.startsWith(text.slice(0, -1)))).toBe(true);
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
                            truncate: false,
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
            chart = await createChart(options);
            return getVisibleLabelTextNodes(chart).map((node) => node.getBBox());
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

        // A bordered outside label reserves padding plus half the border stroke outward, so the anchor offset
        // must include the border extent for the drawn box to sit exactly `spacing` from the bar.
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
            chart = await createChart(options);
            const { nodeData, labelData } = getSeriesContextNodeData<{ y: number }, { label?: { y: number } }>(chart);
            const barTop = nodeData[0].y;
            const labelY = labelData[0].label!.y;
            // outside-end sits above the bar with baseline 'bottom'; the box extends down toward the bar by
            // padding + half the stroke, so that edge must clear the bar by exactly `spacing`.
            expect(barTop - (labelY + PADDING + STROKE / 2)).toBeCloseTo(SPACING);
        });
    });

    // Bar/histogram contribute their rects as `shape` obstacles; a placing series only routes its labels
    // around them when its label sets collideWith.shapes to false.
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

        it('routes line labels around bars when shapes is false', async () => {
            await renderAndSnapshot({
                data: comboData,
                legend: { enabled: false },
                axes: comboAxes,
                series: series({
                    placement: ['top', 'bottom'],
                    collision: {
                        alwaysShow: false,
                        collideWith: { shapes: false },
                    },
                }),
            });
        });

        it('leaves line labels over the bars by default', async () => {
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

    // A bar's inside label with default `alwaysShow` and a single placement is baked rather than routed
    // through the placement engine, but must still act as a `label` obstacle for other series.
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
            chart = await createChart(opts);
            const barBoxes = seriesVisibleLabelBoxes(chart, 0);
            const scatterBoxes = seriesVisibleLabelBoxes(chart, 1);
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

        // Six points fall in bin [0, 4), so its inside-centre label sits at y = 3; the HIT scatter point sits
        // just below that centre, so its `top` candidate lands on the baked label.
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
            chart = await createChart(opts);
            const histogramBoxes = seriesVisibleLabelBoxes(chart, 0);
            const scatterBoxes = seriesVisibleLabelBoxes(chart, 1);
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
        // The single bin's `outside-end` label overflows the series area, so a hideable single-placement label
        // is dropped while a placement array cascades to an inside candidate that fits.
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
            return getVisibleLabelNodes(chart).length;
        };
        const render = async (collision: object, placement?: string | string[]) => {
            const opts = options(collision, placement);
            chart = await createChart(opts);
            return visibleLabelCount();
        };

        it('drops a hideable outside label overflowing the series area', async () => {
            expect(await render({ alwaysShow: false, collideWith: { seriesArea: false } })).toBe(0);
        });

        it('keeps the same label when it is not hideable (alwaysShow: true)', async () => {
            expect(await render({ alwaysShow: true, collideWith: { seriesArea: false } })).toBe(1);
        });

        it('cascades a hideable outside label to an inside placement that fits', async () => {
            // The single `outside-end` label above hides (0); the array falls through to `inside-center`,
            // which fits inside the tall bin, so the label is kept even though `alwaysShow` is false.
            expect(
                await render({ alwaysShow: false, collideWith: { seriesArea: false } }, [
                    'outside-end',
                    'inside-center',
                ])
            ).toBe(1);
        });

        // With a cascade that has a non-inside fallback, a label too large for the bin keeps its full text and
        // cascades outside; only an inside-only placement binds the text to the bar.
        it('keeps full text and cascades an oversized inside-first label to the outside fallback', async () => {
            // A narrow, centred bin whose long label cannot fit inside, so the full text must cascade to the
            // outside fallback rather than being fitted to the tiny inside container.
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
            chart = await createChart(opts);
            const labels = getVisibleLabelNodes<{ label?: { placement?: string } }>(chart);
            expect(labels).toHaveLength(1);
            expect(labels[0].datum?.label?.placement).toBe('outside-end');
        });

        // Three bins: one keeping `outside-end` above the bar, one overflowing the top and cascading to
        // `inside-center`, and one whose label is too wide inside, exercising the overflow policy.
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
                            collision: { alwaysShow: false, collideWith: { seriesArea: false } },
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
        const barOptions = (
            placement: AgBarSeriesLabelPlacement | AgBarSeriesLabelPlacement[]
        ): AgCartesianChartOptions => ({
            data: barData,
            legend: { enabled: false },
            axes: { x: { type: 'category', position: 'bottom' }, y: { type: 'number', position: 'left' } },
            series: [{ type: 'bar', xKey: 'x', yKey: 'y', label: { enabled: true, placement } }],
        });

        it('bar renders an array placement identically to its fitting first candidate', async () => {
            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createChart,
                barOptions('inside-end'),
                barOptions(['inside-end', 'outside-end'])
            );
        });

        const histData = Array.from({ length: 8 }, (_, i) => ({ x: 20 + 10 * Math.sin(i) }));
        const histOptions = (
            placement: AgHistogramSeriesLabelPlacement | AgHistogramSeriesLabelPlacement[]
        ): AgCartesianChartOptions => ({
            data: histData,
            legend: { enabled: false },
            axes: { x: { type: 'number', position: 'bottom' }, y: { type: 'number', position: 'left' } },
            series: [{ type: 'histogram', xKey: 'x', label: { enabled: true, placement } }],
        });

        it('histogram renders an array placement identically to its fitting first candidate', async () => {
            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createChart,
                histOptions('inside-center'),
                histOptions(['inside-center', 'outside-end'])
            );
        });
    });

    // `label.orientation` rotates bar-family labels: `horizontal` upright, the two `vertical` variants a
    // quarter-turn either way. Both a column and a horizontal bar are exercised per orientation.
    describe('bar label orientation', () => {
        const barData = Array.from({ length: 6 }, (_, i) => ({ cat: `Category ${i}`, value: 30 + 10 * Math.sin(i) }));
        const orientations: AgChartLabelOrientation[] = ['horizontal', 'vertical', 'vertical-reversed'];
        const barOrientationOptions = (
            orientation: AgChartLabelOrientation | AgChartLabelOrientation[] | undefined,
            direction: 'vertical' | 'horizontal'
        ): AgCartesianChartOptions => ({
            data: barData,
            legend: { enabled: false },
            axes:
                direction === 'vertical'
                    ? { x: { type: 'category', position: 'bottom' }, y: { type: 'number', position: 'left' } }
                    : { x: { type: 'number', position: 'bottom' }, y: { type: 'category', position: 'left' } },
            series: [
                {
                    type: 'bar',
                    xKey: 'cat',
                    yKey: 'value',
                    direction,
                    label: { enabled: true, ...(orientation != null && { orientation }) },
                },
            ],
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
            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createChart,
                barOrientationOptions(undefined, 'vertical'),
                barOrientationOptions('horizontal', 'vertical')
            );
        });

        // Orientation array fall-through: many thin columns whose long upright (horizontal) label
        // overflows the bar width, forcing every label through to vertical.
        const thinColumns = (
            orientation: AgChartLabelOrientation | AgChartLabelOrientation[]
        ): AgCartesianChartOptions => ({
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
                thinColumns(['horizontal', 'vertical']),
                thinColumns('vertical')
            );
        });

        // A single-element array has nothing to resolve, so it must render identically to the scalar
        // (the byte-identical fast path that keeps existing charts out of the placement engine).
        it('renders a single-element orientation array identically to the scalar', async () => {
            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createChart,
                barOrientationOptions(['vertical'], 'vertical'),
                barOrientationOptions('vertical', 'vertical')
            );
        });

        // Once a bar is too narrow for horizontal the engine picks vertical, and a bar too narrow for even
        // vertical hides its label; neither may revert to the horizontal bake made at node-data time.
        it('keeps a narrowing bar label vertical instead of reverting to horizontal', async () => {
            const optionsAt = (width: number) => {
                const chartOptions: AgCartesianChartOptions = {
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
                prepareTestOptions(chartOptions);
                chartOptions.width = width;
                return chartOptions;
            };

            // Rotation of the first rendered label, or `undefined` once the bars are too narrow to show
            // any label at all.
            const firstLabelRotation = () => {
                const { labelData } = getSeriesContextNodeData<
                    unknown,
                    { label?: { text?: unknown; rotation?: number; hidden?: boolean } }
                >(chart);
                const labelled = labelData.find(
                    (d) => d.label != null && d.label.text !== '' && d.label.hidden !== true
                );
                return labelled == null ? undefined : (labelled.label?.rotation ?? 0);
            };

            // Bespoke: `optionsAt` applies the width under test after preparation, which the shared factory
            // would overwrite. This applies to every bare create in this suite.
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

        // A vertical label pivots on its untransformed glyph-box centre; re-deriving that pivot from an
        // already-rotated box would make it walk on every resize.
        it('keeps a vertical label pivot stable across resizes (no drift)', async () => {
            const optionsAt = (width: number) => {
                const chartOptions: AgCartesianChartOptions = {
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
                prepareTestOptions(chartOptions);
                chartOptions.width = width;
                return chartOptions;
            };

            const firstRotatedLabelPivot = () => {
                return getVisibleLabelTextNodes(chart).find((node) => node.rotation !== 0);
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

        // An inside-start/end label rotated to the along-bar orientation pivots on its glyph centre,
        // which sits on the bar's edge, so the engine must slide it flush back inside the rect.
        const thinTallColumns = (placement: AgBarSeriesLabelPlacement): AgCartesianChartOptions => ({
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

        const insidePlacements: AgBarSeriesLabelPlacement[] = ['inside-start', 'inside-end'];
        for (const placement of insidePlacements) {
            it(`keeps a resolved '${placement}' label inside the bar rect`, async () => {
                await renderAndSnapshot(thinTallColumns(placement));
            });

            it(`slides a resolved '${placement}' label flush within the bar rect`, async () => {
                const options = thinTallColumns(placement);
                chart = await createChart(options);

                const { nodeData: bars } = getSeriesContextNodeData<LabelBox>(chart);
                const rotatedLabels = getVisibleLabelTextNodes(chart).filter((node) => node.rotation !== 0);

                // Anti-vacuous guard: the scenario must actually resolve to a rotated label per bar.
                expect(rotatedLabels.length).toBe(bars.length);

                for (const node of rotatedLabels) {
                    const bbox = node.getBBox();
                    expect(bbox).toBeDefined();
                    const bar = bars.find(
                        (b) => bbox.x + bbox.width / 2 >= b.x && bbox.x + bbox.width / 2 <= b.x + b.width
                    );
                    expect(bar).toBeDefined();
                    expect(bbox.y).toBeGreaterThanOrEqual(bar!.y - 0.5);
                    expect(bbox.y + bbox.height).toBeLessThanOrEqual(bar!.y + bar!.height + 0.5);
                }
            });
        }
    });

    // A baked bar label (orientation array, single placement, default `alwaysShow`) still needs its
    // orientation resolved, but must never see its own footprint as a `label` obstacle.
    describe('orientation-array bar label is not its own obstacle', () => {
        const barData = Array.from({ length: 8 }, (_, i) => ({ cat: `Category ${i}`, bar: 30 + 10 * Math.sin(i) }));
        const comboData = barData.map((d, i) => ({ ...d, line: 20 + 8 * Math.cos(i) }));
        const plainAxes = {
            x: { type: 'category', position: 'bottom' },
            y: { type: 'number', position: 'left' },
        };

        // `alwaysShow` pins the baked path: an orientation array alone would route the label through positioned
        // candidates, a different mechanism from the self-obstacle behaviour pinned here.
        const barLabel = {
            enabled: true,
            orientation: ['horizontal', 'vertical'] as const,
            placement: 'outside-end',
            collision: { alwaysShow: true },
        };

        const barRotations = () => {
            const visible = getVisibleLabelNodes(chart).length;
            const rotations = getSeriesContextNodeData<unknown, { label?: { rotation?: number } }>(chart).labelData.map(
                (d) => d.label?.rotation ?? 0
            );
            return { visible, rotations };
        };

        it('places every bar label at its single-series orientation alongside a second collision series', async () => {
            const barOnlyOptions: any = {
                data: barData,
                legend: { enabled: false },
                axes: plainAxes,
                series: [{ type: 'bar', xKey: 'cat', yKey: 'bar', label: barLabel }],
            };
            chart = await createChart(barOnlyOptions);
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
            chart = await createChart(comboOptions);
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
            chart = await createChart(options);

            const obstacles = getSeriesLabelObstacles(chart);
            // Anti-vacuous guard: the bar still contributes its rects as `shape` obstacles.
            expect(obstacles.length).toBe(barData.length);
            expect(obstacles.every((o) => o.category === 'shape')).toBe(true);
        });
    });

    // Inside-label spacing is a gap from the bar's value end, so it applies along the bar's length axis
    // only; a candidate spanning the bar's full cross-axis width must not be rejected as a collision.
    describe('inside-label spacing applies only along the bar-length axis', () => {
        const labelNodes = () => {
            const { nodeData: bars } = getSeriesContextNodeData<LabelBox>(chart);
            const labels = getVisibleLabelTextNodes(chart);
            return { bars, labels };
        };

        it('vertical bar: keeps the horizontal label spanning the bar width instead of rotating it', async () => {
            const spacing = 35;
            const chartOptions: AgCartesianChartOptions = {
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
            prepareTestOptions(chartOptions);
            // Bespoke: the size under test is applied after preparation, which the shared factory would overwrite.
            // This applies to every bare create in this suite.
            // Thin columns (each narrower than twice the spacing) so an all-sides inset region would reject the
            // horizontal label, while it still fits the bar's full width.
            chartOptions.width = 500;
            chartOptions.height = 400;
            chart = AgCharts.create(chartOptions);
            await waitForChartStability(chart);

            const { bars, labels } = labelNodes();
            expect(labels.length).toBe(bars.length);
            for (const node of labels) {
                const bbox = node.getBBox();
                expect(bbox).toBeDefined();
                const bar = bars.find(
                    (b) => bbox.x + bbox.width / 2 >= b.x && bbox.x + bbox.width / 2 <= b.x + b.width
                );
                expect(bar).toBeDefined();
                // The label stayed horizontal: it fits the bar's full width with no cross-axis spacing.
                expect(node.rotation).toBe(0);
                expect(bbox.width).toBeLessThanOrEqual(bar!.width + 0.5);
                // Anti-vacuous: the label is wider than an all-sides inset region, which would have rejected the
                // horizontal candidate and rotated it to vertical.
                expect(bbox.width).toBeGreaterThan(bar!.width - 2 * spacing);
            }
        });

        it('horizontal bar: keeps the vertical label spanning the bar height instead of rotating it', async () => {
            const spacing = 35;
            const chartOptions: AgCartesianChartOptions = {
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
            prepareTestOptions(chartOptions);
            // Thin bars (each shorter than twice the spacing) so an all-sides inset region would reject the
            // vertical label, while it still fits the bar's full height.
            chartOptions.width = 400;
            chartOptions.height = 500;
            chart = AgCharts.create(chartOptions);
            await waitForChartStability(chart);

            const { bars, labels } = labelNodes();
            expect(labels.length).toBe(bars.length);
            for (const node of labels) {
                const bbox = node.getBBox();
                expect(bbox).toBeDefined();
                const bar = bars.find(
                    (b) => bbox.y + bbox.height / 2 >= b.y && bbox.y + bbox.height / 2 <= b.y + b.height
                );
                expect(bar).toBeDefined();
                // The label stayed vertical: it fits the bar's full height with no cross-axis spacing.
                expect(node.rotation).not.toBe(0);
                expect(bbox.height).toBeLessThanOrEqual(bar!.height + 0.5);
                // Anti-vacuous: the label is taller than an all-sides inset region.
                expect(bbox.height).toBeGreaterThan(bar!.height - 2 * spacing);
            }
        });
    });

    // `alwaysShow` gates only the terminal hide-vs-keep decision; it is orthogonal to fit and placement
    // cascade, which always apply.
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

    // `collision.threshold` applies to the label's own box: 0 is a no-op, a negative value tolerates overlap
    // up to `|threshold|` px and must still pass validation.
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
        const stackedOptions = (threshold: number): AgCartesianChartOptions => ({
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
            chart = await createChart(options);
            const [node] = getSeriesSelectionNodes<RotatableText>(chart, 'labelSelection', 1);
            expect(node).toBeDefined();
            expect(node.visible).toBe(true);
            const box = node.getBBox();
            expect(box).toBeDefined();
            return box;
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
            chart = await createChart(options);
            return topLabelAnchorGap({ placedLabelData: getPlacedLabelData(chart) });
        };

        it('measures spacing from the marker edge, so the anchor gap is marker radius + spacing', async () => {
            // marker size 6 => radius 3; the label box edge sits radius + spacing from the marker centre.
            const near = await anchorGap(5);
            const far = await anchorGap(40);
            expect(near).toBeCloseTo(3 + 5, 0);
            expect(far).toBeCloseTo(3 + 40, 0);
        });
    });

    // A 100 px marker at (5, 5), and a small marker whose right label is moved to just past the big one's nominal circle.
    describe('a marker obstacle by the shape it draws', () => {
        const options = (shape: AgMarkerShape, near: { x: number; y: number }): AgCartesianChartOptions => ({
            legend: { enabled: false },
            axes: {
                x: { position: 'bottom', type: 'number', min: 0, max: 10 },
                y: { position: 'left', type: 'number', min: 0, max: 10 },
            },
            series: [
                {
                    type: 'scatter',
                    data: [{ x: 5, y: 5, label: 'big' }],
                    xKey: 'x',
                    yKey: 'y',
                    yName: 'big',
                    labelKey: 'label',
                    shape,
                    size: 100,
                    label: { enabled: true, placement: 'bottom' },
                },
                {
                    type: 'scatter',
                    data: [{ ...near, label: 'near' }],
                    xKey: 'x',
                    yKey: 'y',
                    yName: 'near',
                    labelKey: 'label',
                    size: 4,
                    label: { enabled: true, placement: 'right', collision: { alwaysShow: false } },
                },
            ],
        });

        it.each([
            { shape: 'square' as const, placed: false },
            { shape: 'circle' as const, placed: true },
        ])('keeps a label over the corner a $shape marker would have: $placed', async ({ shape, placed }) => {
            chart = await createChart(options(shape, { x: 1, y: 1 }));
            const [big] = getPlacedLabelData(chart, 0);
            const [near] = getPlacedLabelData(chart, 1);
            const pxPerX = (big.datum.point.x - near.datum.point.x) / 4;
            const pxPerY = (big.datum.point.y - near.datum.point.y) / 4;
            // The label's lower left corner, off its own point, goes 40 px right of and 36 px above the big centre:
            // 53.8 px out, past its 50 px circle, but inside the square's corner.
            const offsetX = near.x - near.datum.point.x;
            const offsetY = near.y + near.height - near.datum.point.y;
            const target = { x: 5 + (40 - offsetX) / pxPerX, y: 5 + (-36 - offsetY) / pxPerY };
            await chart.update(prepareTestOptions(options(shape, target)));
            await waitForChartStability(chart);
            const moved = getPlacedLabelData(chart, 1);
            expect(moved.length === 1).toBe(placed);
        });
    });

    describe('an inside-only label fitted to the marker drawn', () => {
        type Drawn = { shape?: 'triangle'; size?: number };
        const options = (type: 'line' | 'scatter', drawn: Drawn, styled: boolean): AgCartesianChartOptions => {
            const marker = styled
                ? { shape: 'square' as const, size: 60, itemStyler: () => drawn }
                : { shape: drawn.shape ?? ('square' as const), size: drawn.size ?? 60 };
            const label = { enabled: true, placement: 'inside' as const, formatter: () => 'WWWWWWWWWW' };
            return {
                data: [{ x: 5, y: 5 }],
                axes: {
                    x: { position: 'bottom', type: 'number', min: 0, max: 10 },
                    y: { position: 'left', type: 'number', min: 0, max: 10 },
                },
                series: [
                    type === 'line'
                        ? { type, xKey: 'x', yKey: 'y', marker, label }
                        : { type, xKey: 'x', yKey: 'y', labelKey: 'y', ...marker, label },
                ],
            };
        };

        it.each([
            { type: 'line' as const, what: 'shape', drawn: { shape: 'triangle' as const } },
            { type: 'line' as const, what: 'size', drawn: { size: 30 } },
            { type: 'scatter' as const, what: 'shape', drawn: { shape: 'triangle' as const } },
            { type: 'scatter' as const, what: 'size', drawn: { size: 30 } },
        ])('fits a $type label to the $what a styler draws, not the one configured', async ({ type, drawn }) => {
            const textOf = async (over: Drawn, styled: boolean) => {
                await chart.update(prepareTestOptions(options(type, over, styled)));
                await waitForChartStability(chart);
                return getPlacedLabelData(chart, 0).map(({ text }) => text);
            };
            chart = await createChart(options(type, {}, false));
            const configured = await textOf({}, false);
            const expected = await textOf(drawn, false);
            expect(expected).not.toEqual(configured);
            expect(await textOf(drawn, true)).toEqual(expected);
        });
    });

    // A smaller scatter marker sits under the centre of a larger one, overlapping the larger one's inside label.
    describe('inside label over a marker painted under its own', () => {
        const centreLabelPlaced = () => markerUnderLabelPlaced(getPlacedLabelData(chart, 1));

        type ShapeParams = { path: ExtendedPath2D; x: number; y: number; size: number };
        const squareShape = ({ path, x, y, size }: ShapeParams) => {
            path.rect(x - size / 2, y - size / 2, size, size);
        };

        it.each([
            { case: 'the default fill opacity', over: {}, placed: true },
            { case: 'a zero fill opacity', over: { fillOpacity: 0 }, placed: false },
            { case: 'a fill of zero alpha', over: { fill: 'rgba(0, 0, 0, 0)' }, placed: false },
            { case: 'a custom shape', over: { shape: squareShape }, placed: true },
            { case: 'a styler that keeps the fill', over: { itemStyler: () => ({}) }, placed: true },
            {
                case: 'a styler that clears the fill of that datum',
                over: { itemStyler: ({ datum }: any) => (datum.x === 5 ? { fillOpacity: 0 } : {}) },
                placed: false,
            },
        ])('places the label over $case: $placed', async ({ over, placed }) => {
            chart = await createChart(markerUnderOptions(over));
            expect(getPlacedLabelData(chart, 1).length).toBeGreaterThanOrEqual(2);
            expect(centreLabelPlaced()).toBe(placed);
        });

        it('judges a marker a styler draws as a pin where the pin is drawn, its inside label on the pin', async () => {
            chart = await createChart(
                markerUnderOptions({ itemStyler: ({ datum }: any) => (datum.x === 5 ? { shape: 'pin' } : {}) })
            );
            // The pin rises off the point: the lower marker's label below clears it, and the inside label rides up on
            // the pin's inscribed rectangle, clear of the marker under its tip.
            expect(markerUnderLabelPlaced(getPlacedLabelData(chart, 0))).toBe(true);
            const label = getPlacedLabelData(chart, 1).find((l) => l.datum.label.text === '5');
            expect(label).toBeDefined();
            const { point } = label!.datum;
            const rect = markerLabelRect('pin');
            expect(label!.y + label!.height / 2).toBeCloseTo(point.y - point.size / 2 + rect.cy * point.size, 5);
        });

        it('drops the label once its fill opacity drops to zero', async () => {
            chart = await createChart(markerUnderOptions());
            expect(centreLabelPlaced()).toBe(true);

            await chart.update(prepareTestOptions(markerUnderOptions({ fillOpacity: 0 })));
            await waitForChartStability(chart);

            expect(centreLabelPlaced()).toBe(false);
        });

        it.each([
            { case: 'nothing cast', over: {}, reach: 0.5, strokeReach: 0 },
            { case: 'a glow at rest', over: { glow: { enabled: true } }, reach: Infinity, strokeReach: 0 },
            { case: 'a shadow at rest', over: { shadow: { enabled: true } }, reach: Infinity, strokeReach: 0 },
            {
                case: 'a glow only when highlighted',
                over: { highlight: { highlightedItem: { glow: { enabled: true } } } },
                reach: 0.5,
                strokeReach: 0,
            },
            {
                case: 'a mitred stroke',
                over: { shape: 'square', stroke: 'black', strokeWidth: 6 },
                reach: Math.SQRT1_2,
                strokeReach: 3 * Math.SQRT2,
            },
        ])('reaches as far as the marker draws at rest with $case', async ({ over, reach, strokeReach }) => {
            chart = await createChart(markerUnderOptions({ strokeWidth: 0, ...over }));
            const coverage = getSeriesAt(chart, 1).getLabelMarkerCoverage();
            expect(coverage).toBeDefined();
            expect(coverage?.reach).toBeCloseTo(reach);
            expect(coverage?.strokeReach).toBeCloseTo(strokeReach);
        });

        it.each([
            { type: 'line', case: 'shown', enabled: true, count: 1, covers: true },
            { type: 'line', case: 'hidden', enabled: false, count: 1, covers: false },
            { type: 'line', case: 'too dense to draw', enabled: true, count: 1000, covers: false },
            { type: 'area', case: 'shown', enabled: true, count: 1, covers: true },
            { type: 'area', case: 'too dense to draw', enabled: true, count: 1000, covers: false },
        ])('covers the label with $type markers when they are $case', async ({ type, enabled, count, covers }) => {
            chart = await createChart({
                data: Array.from({ length: count }, (_, x) => ({ x, y: x })),
                legend: { enabled: false },
                axes: cartesianAxes,
                series: [{ type, xKey: 'x', yKey: 'y', marker: { enabled, size: 30 } }],
            } as AgCartesianChartOptions);
            expect((getSeriesAt(chart).getLabelMarkerCoverage()?.cover ?? 0) > 0).toBe(covers);
        });

        it.each([
            { case: 'shown', count: 1, covers: true },
            { case: 'too dense to draw', count: 1000, covers: false },
        ])('covers each label with styled line markers when they are $case', async ({ count, covers }) => {
            chart = await createChart({
                data: Array.from({ length: count }, (_, x) => ({ x, y: x })),
                legend: { enabled: false },
                axes: cartesianAxes,
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        marker: { enabled: true, size: 30, itemStyler: () => ({}) },
                        label: { enabled: true },
                    },
                ],
            } as AgCartesianChartOptions);
            const labelData = getSeriesAt(chart).getLabelData();
            expect(labelData).toHaveLength(count);
            expect(labelData.some((datum) => (datum.markerCover ?? 0) > 0)).toBe(covers);
        });

        describe('custom marker shapes', () => {
            // Draws a 10px square whatever size the marker is given.
            const fixedSquareShape = ({ path, x, y }: ShapeParams) => {
                path.rect(x - 5, y - 5, 10, 10);
            };
            const customShapeOptions = (series: object, placement = 'inside'): AgCartesianChartOptions =>
                ({
                    // Two datums of each size, so a measure per datum would count twice what one per size does.
                    data: [1, 2, 3, 1, 2, 3].map((s, i) => ({ x: i * 2, y: i * 2, s })),
                    legend: { enabled: false },
                    axes: cartesianAxes,
                    series: [{ xKey: 'x', yKey: 'y', label: { enabled: true, placement }, ...series }],
                }) as AgCartesianChartOptions;

            /** Counts the custom paths measured while `create` runs; only that measure flattens to a tolerance. */
            const countMeasuredPaths = async (create: () => Promise<void>) => {
                const flatten = vi.spyOn(ExtendedPath2D.prototype, 'flatten');
                try {
                    await create();
                    return flatten.mock.calls.filter(([, tolerance]) => tolerance != null).length;
                } finally {
                    flatten.mockRestore();
                }
            };

            it.each([
                { type: 'scatter', series: { type: 'scatter', labelKey: 'x', size: 1000, shape: fixedSquareShape } },
                {
                    type: 'bubble',
                    series: {
                        type: 'bubble',
                        labelKey: 'x',
                        sizeKey: 's',
                        minSize: 200,
                        maxSize: 1000,
                        shape: fixedSquareShape,
                    },
                },
                { type: 'line', series: { type: 'line', marker: { size: 1000, shape: fixedSquareShape } } },
                {
                    type: 'area',
                    series: { type: 'area', marker: { enabled: true, size: 1000, shape: fixedSquareShape } },
                },
            ])(
                'covers each $type label with the square its marker draws, not the size it is given',
                async ({ series }) => {
                    chart = await createChart(customShapeOptions(series));
                    const labelData = getSeriesAt(chart).getLabelData();
                    const coverRectOf = getSeriesAt(chart).getLabelMarkerCoverRect();
                    expect(labelData).toHaveLength(6);
                    expect(coverRectOf).toBeDefined();
                    for (const datum of labelData) {
                        const { markerSize = 0, markerCover = 0 } = datum;
                        const markerCoverRect = coverRectOf?.(datum);
                        expect(markerSize).toBeGreaterThanOrEqual(200);
                        expect(markerCover).toBeGreaterThan(4.9);
                        expect(markerCover).toBeLessThanOrEqual(5);
                        expect(markerCoverRect).toBeDefined();
                        expect((markerCoverRect?.width ?? 0) * markerSize).toBeGreaterThan(9.5);
                        expect((markerCoverRect?.width ?? 0) * markerSize).toBeLessThanOrEqual(10);
                    }
                }
            );

            it.each([
                {
                    case: 'a fixed marker size',
                    series: { type: 'scatter', labelKey: 'x', size: 30, shape: squareShape },
                    measured: 1,
                },
                {
                    case: 'three marker sizes',
                    series: {
                        type: 'bubble',
                        labelKey: 'x',
                        sizeKey: 's',
                        minSize: 10,
                        maxSize: 30,
                        shape: squareShape,
                    },
                    measured: 3,
                },
            ])('measures a custom path once for each size drawn, with $case', async ({ series, measured }) => {
                const count = await countMeasuredPaths(async () => {
                    chart = await createChart(customShapeOptions(series));
                });
                expect(count).toBe(measured);
            });

            // Its centre lies on the left edge, so no cover circle settles a marker painted under it.
            const offCentreShape = ({ path, x, y, size }: ShapeParams) => {
                path.rect(x, y - size / 2, size / 2, size);
            };

            it.each([
                { case: 'no marker painted under any of them', under: [], measured: 3 },
                { case: 'a marker painted under one of them', under: [{ x: 4, y: 4 }], measured: 4 },
            ])(
                'measures a cover rectangle only for a label that needs one, with $case',
                async ({ under, measured }) => {
                    const options = customShapeOptions({
                        type: 'bubble',
                        labelKey: 'x',
                        sizeKey: 's',
                        minSize: 10,
                        maxSize: 30,
                        shape: offCentreShape,
                    });
                    const lower = {
                        type: 'scatter',
                        data: under,
                        xKey: 'x',
                        yKey: 'y',
                        labelKey: 'x',
                        size: 10,
                        label: { enabled: true, placement: 'bottom' },
                    };
                    const count = await countMeasuredPaths(async () => {
                        chart = await createChart({
                            ...options,
                            series: [lower, ...(options.series ?? [])],
                        } as AgCartesianChartOptions);
                    });
                    // One path measure for each of the three sizes drawn, and one for each rectangle.
                    expect(count).toBe(measured);
                }
            );

            it.each([
                { placement: 'inside', measured: true },
                { placement: 'top', measured: false },
            ])(
                'measures what a custom marker covers for $placement labels: $measured',
                async ({ placement, measured }) => {
                    chart = await createChart(
                        customShapeOptions({ type: 'scatter', labelKey: 'x', size: 30, shape: squareShape }, placement)
                    );
                    const labelData = getSeriesAt(chart).getLabelData();
                    const coverRectOf = getSeriesAt(chart).getLabelMarkerCoverRect();
                    expect(labelData).toHaveLength(6);
                    for (const datum of labelData) {
                        const { markerCover = 0, markerReach = Infinity } = datum;
                        expect(markerReach).toBeLessThan(Infinity);
                        expect(markerCover > 0).toBe(measured);
                        expect(coverRectOf?.(datum) != null).toBe(measured);
                    }
                }
            );
        });

        describe('while a marker is highlighted', () => {
            const REST_SIZE = 20;
            const HOVERED_SIZE = 40;
            const hoverOptions = (series: object): AgCartesianChartOptions =>
                ({
                    data: [0, 1, 2].map((i) => ({ x: i * 10, y: i * 10 })),
                    animation: { enabled: false },
                    legend: { enabled: false },
                    axes: cartesianAxes,
                    ...SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
                    series: [
                        {
                            xKey: 'x',
                            yKey: 'y',
                            label: { enabled: true, placement: 'inside' },
                            highlight: {
                                highlightedItem: { size: HOVERED_SIZE, fill: 'transparent' },
                                unhighlightedItem: { size: 10 },
                            },
                            ...series,
                        },
                    ],
                }) as AgCartesianChartOptions;
            // What the solve reads: per-datum stamps, else the drawn size and the series coverage.
            const stamps = () => {
                const series = getSeriesAt(chart);
                const coverage = series.getLabelMarkerCoverage();
                return series
                    .getLabelData()
                    .map(({ point, markerSize, markerCover, markerCoverRect, markerReach }) => ({
                        size: markerSize ?? point.size,
                        markerCover: markerCover ?? coverage?.cover,
                        markerCoverRect: plainRect(markerCoverRect ?? coverage?.coverRect),
                        markerReach: markerReach ?? coverage?.reach,
                    }));
            };
            const stampSizes = () =>
                [0, 1].map((at) =>
                    getSeriesAt(chart, at)
                        .getLabelData()
                        .map(({ point, markerSize }) => markerSize ?? point.size)
                );
            const hoverFirstMarker = async () => {
                const marker = shapesOf(getSeriesAt(chart).contentGroup, Marker)[0];
                const { x, y } = Transformable.toCanvas(marker).computeCenter();
                await hoverAction(x, y)(chart);
                await waitForChartStability(chart);
            };
            const hoveredMarker = () =>
                shapesOf(getSeriesAt(chart).highlightNodeGroup, Marker).find((marker) => marker.visible);

            const markerSeries = (styler?: (params: { highlightState?: string }) => object) => [
                { type: 'scatter', size: REST_SIZE, labelKey: 'y', itemStyler: styler },
                {
                    type: 'bubble',
                    sizeKey: 'y',
                    minSize: REST_SIZE,
                    maxSize: REST_SIZE,
                    labelKey: 'y',
                    itemStyler: styler,
                },
                { type: 'line', marker: { size: REST_SIZE, itemStyler: styler } },
                { type: 'area', marker: { enabled: true, size: REST_SIZE, itemStyler: styler } },
            ];

            it.each([
                ...markerSeries().map((series) => ({ type: series.type, styled: false, series })),
                ...markerSeries(() => ({})).map((series) => ({ type: series.type, styled: true, series })),
            ])('stamps each $type label from the marker at rest (styled: $styled)', async ({ series }) => {
                chart = await createChart(hoverOptions(series));
                const atRest = stamps();
                expect(atRest).toHaveLength(3);
                expect(atRest.map(({ size }) => size)).toEqual([REST_SIZE, REST_SIZE, REST_SIZE]);

                await hoverFirstMarker();
                expect(hoveredMarker()?.size).toBe(HOVERED_SIZE);
                expect(hoveredMarker()?.fill).toBe('transparent');

                expect(stamps()).toEqual(atRest);
            });

            // Neither a styler nor selection: the renderer draws every marker from the series' state styles.
            const customShapeSeries = () => {
                const square: AgMarkerShapeFn = ({ path, x, y, size }) =>
                    path.rect(x - size / 2, y - size / 2, size, size);
                return [
                    { type: 'scatter', size: REST_SIZE, labelKey: 'y', shape: square },
                    {
                        type: 'bubble',
                        sizeKey: 'y',
                        minSize: REST_SIZE,
                        maxSize: REST_SIZE,
                        labelKey: 'y',
                        shape: square,
                    },
                    { type: 'line', marker: { size: REST_SIZE, shape: square } },
                    { type: 'area', marker: { enabled: true, size: REST_SIZE, shape: square } },
                ];
            };

            it.each(customShapeSeries().map((series) => ({ type: series.type, series })))(
                'stamps each $type custom-shape label from the marker at rest while one is hovered',
                async ({ series }) => {
                    chart = await createChart(hoverOptions(series));
                    const atRest = stamps();
                    expect(atRest.map(({ size }) => size)).toEqual([REST_SIZE, REST_SIZE, REST_SIZE]);

                    await hoverFirstMarker();
                    expect(hoveredMarker()?.size).toBe(HOVERED_SIZE);
                    expect(shapesOf(getSeriesAt(chart).contentGroup, Marker).map(({ size }) => size)).toContain(10);

                    expect(stamps()).toEqual(atRest);
                }
            );

            it.each(customShapeSeries().map((series) => ({ type: series.type, series })))(
                'stamps each $type custom-shape label from the marker at rest when a legend click rebuilds it highlighted',
                async ({ series }) => {
                    chart = await createChart({
                        ...hoverOptions(series),
                        legend: { enabled: true },
                        series: [0, 1].map((at) => ({
                            xKey: 'x',
                            yKey: 'y',
                            yName: `${at}`,
                            label: { enabled: true, placement: 'inside' },
                            highlight: { highlightedSeries: { size: HOVERED_SIZE }, unhighlightedSeries: { size: 10 } },
                            ...series,
                        })),
                    } as AgCartesianChartOptions);
                    const atRest = stampSizes();
                    expect(atRest.flat()).toEqual(Array(6).fill(REST_SIZE));

                    await clickLegendItem(chart, 0);
                    await waitForChartStability(chart);
                    await clickLegendItem(chart, 0);
                    await waitForChartStability(chart);
                    const drawnSizes = [0, 1].flatMap((at) =>
                        shapesOf(getSeriesAt(chart, at).contentGroup, Marker).map(({ size }) => size)
                    );
                    expect(drawnSizes.some((size) => size !== REST_SIZE)).toBe(true);

                    expect(stampSizes()).toEqual(atRest);
                }
            );

            it.each([0, 1, 2, 3].map((index) => ({ index, type: markerSeries()[index].type })))(
                'stamps each $type label from the marker at rest when a legend click rebuilds it highlighted',
                async ({ index }) => {
                    const highlightedSize = ({ highlightState }: { highlightState?: string }) =>
                        highlightState == null || highlightState === 'none' ? {} : { size: HOVERED_SIZE };
                    const series = markerSeries(highlightedSize)[index];
                    chart = await createChart({
                        ...hoverOptions(series),
                        legend: { enabled: true },
                        series: [0, 1].map((at) => ({
                            xKey: 'x',
                            yKey: 'y',
                            yName: `${at}`,
                            label: { enabled: true, placement: 'inside' },
                            ...series,
                        })),
                    } as AgCartesianChartOptions);
                    const atRest = stampSizes();
                    expect(atRest).toEqual([
                        [REST_SIZE, REST_SIZE, REST_SIZE],
                        [REST_SIZE, REST_SIZE, REST_SIZE],
                    ]);

                    await clickLegendItem(chart, 0);
                    await waitForChartStability(chart);
                    await clickLegendItem(chart, 0);
                    await waitForChartStability(chart);
                    const drawnSizes = [0, 1].flatMap((at) =>
                        shapesOf(getSeriesAt(chart, at).contentGroup, Marker).map(({ size }) => size)
                    );
                    expect(drawnSizes).toContain(HOVERED_SIZE);

                    expect(stampSizes()).toEqual(atRest);
                }
            );

            it.each([
                { type: 'line', series: { type: 'line', marker: { size: REST_SIZE } } },
                { type: 'area', series: { type: 'area', marker: { enabled: true, size: REST_SIZE } } },
            ])(
                'resolves one $type marker style per state, not per datum, to stamp the labels while hovered',
                async ({ series }) => {
                    const DATUMS = 30;
                    chart = await createChart({
                        ...hoverOptions({ ...series, selection: { enabled: true } }),
                        data: Array.from({ length: DATUMS }, (_, i) => ({ x: i, y: i })),
                        axes: {
                            x: { type: 'number', position: 'bottom', min: -1, max: DATUMS },
                            y: { type: 'number', position: 'left', min: -1, max: DATUMS },
                        },
                    } as AgCartesianChartOptions);
                    await hoverFirstMarker();
                    expect(hoveredMarker()?.size).toBe(HOVERED_SIZE);

                    const labelSeries = getSeriesAt(chart);
                    const resolve = vi.spyOn(labelSeries, 'getMarkerStyle');
                    expect(labelSeries.getLabelData()).toHaveLength(DATUMS);
                    // Nothing is selected, so every datum is in the one state.
                    expect(resolve).toHaveBeenCalledTimes(1);
                }
            );

            it.each([0, 1, 2, 3].map((index) => ({ index, type: markerSeries()[index].type })))(
                'calls no $type itemStyler again to stamp the labels while nothing is highlighted',
                async ({ index }) => {
                    const itemStyler = vi.fn(() => ({}));
                    chart = await createChart(hoverOptions(markerSeries(itemStyler)[index]));
                    expect(itemStyler).toHaveBeenCalled();
                    itemStyler.mockClear();

                    expect(stamps()).toHaveLength(3);
                    expect(itemStyler).not.toHaveBeenCalled();
                }
            );
        });

        describe('at a pixel ratio below 1', () => {
            const squareSeries = (styler?: () => object) => [
                { type: 'scatter', shape: 'square', labelKey: 'y', itemStyler: styler },
                { type: 'bubble', sizeKey: 'y', shape: 'square', labelKey: 'y', itemStyler: styler },
                { type: 'line', marker: { shape: 'square', itemStyler: styler } },
                { type: 'area', marker: { enabled: true, shape: 'square', itemStyler: styler } },
            ];

            it.each([
                ...squareSeries().map((series) => ({ type: series.type, styled: false, series })),
                ...squareSeries(() => ({})).map((series) => ({ type: series.type, styled: true, series })),
            ])(
                'allows each $type square marker edge to snap 0.75 device px, in px (styled: $styled)',
                async ({ series }) => {
                    const options = {
                        data: [0, 1, 2].map((i) => ({ x: i * 10, y: i * 10 })),
                        animation: { enabled: false },
                        legend: { enabled: false },
                        axes: cartesianAxes,
                        series: [{ xKey: 'x', yKey: 'y', label: { enabled: true, placement: 'inside' }, ...series }],
                    } as AgCartesianChartOptions;
                    chart = await createChart(withUndocumentedChartOptions(options, { overrideDevicePixelRatio: 0.5 }));
                    const labelSeries = getSeriesAt(chart);
                    const coverage = labelSeries.getLabelMarkerCoverage();
                    const snaps = labelSeries.getLabelData().map(({ markerSnap }) => markerSnap ?? coverage?.snap);
                    expect(snaps).toEqual([1.5, 1.5, 1.5]);
                }
            );
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
            return getVisibleLabelTextNodes(chart).map((node) => node.getBBox().y);
        };

        it('re-places labels when label.placement changes on an existing chart', async () => {
            chart = await createChart(lineOptions('top'));
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

    // Placement is greedy, so the order series resolve in decides which label claims a contested
    // candidate. That order must follow the chart's series order, not the order they last became visible.
    describe('placement order across a series visibility toggle', () => {
        const gdpData = [
            { year: 2015, usa: 2.9, china: 7, india: 8 },
            { year: 2016, usa: 1.8, china: 6.9, india: 8.3 },
            { year: 2017, usa: 2, china: 5.9, india: 6 },
            { year: 2018, usa: 3, china: 5.7, india: 5.6 },
            { year: 2019, usa: 3.2, china: 6, india: 3.4 },
            { year: 2020, usa: -2.2, china: 2.2, india: -5.8 },
            { year: 2021, usa: 5.8, china: 8.4, india: 9.7 },
            { year: 2022, usa: 1.9, china: 3, india: 7 },
            { year: 2023, usa: 2.5, china: 5.2, india: 8.2 },
            { year: 2024, usa: 2.8, china: 5, india: 6.5 },
        ];
        const emphasised = ({ datum }: any) => datum.year === 2018;

        // Only the 2018 point of each series carries a label, and its marker is enlarged, exactly as a
        // per-point emphasis styler does: three labels competing over one narrow band of the plot.
        const gdpOptions = (hidden?: string): any => ({
            data: gdpData,
            legend: { enabled: false },
            axes: {
                x: { position: 'bottom', type: 'number' },
                y: { position: 'left', type: 'number' },
            },
            series: ['usa', 'china', 'india'].map((yKey) => ({
                type: 'line',
                id: yKey,
                xKey: 'year',
                yKey,
                visible: yKey !== hidden,
                marker: {
                    enabled: true,
                    size: 7,
                    itemStyler: (params: any) => (emphasised(params) ? { size: 14 } : {}),
                },
                label: {
                    enabled: true,
                    formatter: ({ datum }: any) => `${yKey}-${datum.year}`,
                    placement: ['top', 'bottom', 'left', 'right'],
                    collision: { alwaysShow: true },
                    itemStyler: (params: any) => ({ enabled: emphasised(params) }),
                },
            })),
        });

        /** The placement each drawn label landed at, keyed by its text, across every series. */
        const placementsByText = () => {
            const placements: Record<string, string | undefined> = {};
            for (const seriesIndex of deproxy(chart).series.keys()) {
                for (const placed of getPlacedLabelData(chart, seriesIndex)) {
                    placements[String(placed.text)] = placed.placement;
                }
            }
            return placements;
        };

        it('re-places labels the same way after a series is hidden and shown again', async () => {
            chart = await createChart(gdpOptions());
            const before = placementsByText();
            // Anti-vacuous guard: one label per series, each at a resolved placement.
            expect(Object.keys(before)).toHaveLength(3);

            await chart.update(prepareTestOptions(gdpOptions('china')));
            await waitForChartStability(chart);
            await chart.update(prepareTestOptions(gdpOptions()));
            await waitForChartStability(chart);

            expect(placementsByText()).toEqual(before);
        });
    });

    describe('axis label obstacles', () => {
        // The x axis crosses the series area at y = 0, so a label placed below a point on that line sits on
        // the axis' own tick labels.
        const axisLabelOptions = (collideWith?: object): AgCartesianChartOptions => ({
            data: [
                { x: 0, y: 10 },
                { x: 2, y: 0 },
                { x: 4, y: 0 },
                { x: 6, y: 0 },
                { x: 8, y: -10 },
            ],
            legend: { enabled: false },
            axes: {
                x: { position: 'bottom', type: 'number', crossAt: { value: 0 }, interval: { step: 2 } },
                y: { position: 'left', type: 'number' },
            },
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                    marker: { enabled: true, size: 6 },
                    label: {
                        enabled: true,
                        formatter: ({ datum }: any) => `x${datum.x}`,
                        placement: ['bottom', 'top'],
                        collision: { alwaysShow: false, ...(collideWith == null ? {} : { collideWith }) },
                        truncate: false,
                    },
                },
            ],
        });

        const placementsOnAxis = async (collideWith?: object) => {
            chart = await createChart(axisLabelOptions(collideWith));
            return placedLabelPlacements()
                .filter((label: any) => label.datum.datum.y === 0)
                .map((label) => label.placement);
        };

        it('moves labels off the axis labels by default', async () => {
            expect(await placementsOnAxis()).toEqual(['top', 'top', 'top']);
        });

        it('lets labels overlap the axis labels when collideWith.axisLabels is true', async () => {
            expect(await placementsOnAxis({ axisLabels: true })).toEqual(['bottom', 'bottom', 'bottom']);
        });

        type CanvasNode = Parameters<typeof Transformable.toCanvas>[0] & { visible: boolean; text?: unknown };
        const visibleCanvasBoxes = (nodes: Iterable<CanvasNode>) =>
            Array.from(nodes)
                .filter((node) => node.visible && node.text !== '')
                .map((node) => Transformable.toCanvas(node));

        // Renders the chart, then requires every visible series label to clear every axis tick label.
        const expectSeriesLabelsClearAxisLabels = async (options: object) => {
            chart = await createChart(options);

            const { axes, series } = deproxy(chart);
            const axisBoxes = axes.flatMap((axis) =>
                visibleCanvasBoxes(getAxisLabelNodes(chart, axis.id, { visibleOnly: false }))
            );
            const labelBoxes = series.flatMap((_, seriesIndex) =>
                visibleCanvasBoxes(getSeriesSelectionNodes<CanvasNode>(chart, 'labelSelection', seriesIndex))
            );
            expect(axisBoxes.length).toBeGreaterThan(0);
            expect(labelBoxes.length).toBeGreaterThan(0);

            const overlaps = labelBoxes.filter((label) => axisBoxes.some((axis) => boxesOverlap(label, axis)));
            expect(overlaps).toEqual([]);
            await compareImageSnapshot(chart, ctx);
        };

        const boxesOverlap = (a: LabelBox, b: LabelBox) =>
            a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

        const avoidsAxisLabels = { alwaysShow: false, collideWith: { axisLabels: false } };

        it('moves bubble labels off the labels of axes crossing the series area', async () => {
            const bubbleLabel = (placement: string[]) => ({
                enabled: true,
                formatter: ({ datum }: any) => `(${datum.x}, ${datum.y})`,
                placement,
                collision: avoidsAxisLabels,
            });
            // Bubbles at the even ticks label straight onto a tick label; the odd ones fall between them.
            const steps = [-9, -8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9];
            const onX = steps.map((x) => ({ x, y: 0, size: 1 + (Math.abs(x) % 3) }));
            const onY = steps.map((y) => ({ x: 0, y, size: 1 + (Math.abs(y) % 3) }));
            await expectSeriesLabelsClearAxisLabels({
                legend: { enabled: false },
                axes: {
                    x: {
                        position: 'bottom',
                        type: 'number',
                        crossAt: { value: 0 },
                        min: -10,
                        max: 10,
                        interval: { step: 2 },
                    },
                    y: {
                        position: 'left',
                        type: 'number',
                        crossAt: { value: 0 },
                        min: -10,
                        max: 10,
                        interval: { step: 2 },
                    },
                },
                series: [
                    {
                        type: 'bubble',
                        data: onX,
                        xKey: 'x',
                        yKey: 'y',
                        sizeKey: 'size',
                        labelKey: 'size',
                        maxSize: 14,
                        label: bubbleLabel(['bottom', 'top']),
                    },
                    {
                        type: 'bubble',
                        data: onY,
                        xKey: 'x',
                        yKey: 'y',
                        yName: 'onY',
                        sizeKey: 'size',
                        labelKey: 'size',
                        maxSize: 14,
                        label: bubbleLabel(['left', 'right']),
                    },
                ],
            });
        });

        it('moves line labels off the labels of axes crossing the series area', async () => {
            // Every other point sits on the x axis at a tick, so its bottom label would cover the tick label.
            const zigzag = (amplitude: number) =>
                Array.from({ length: 21 }, (_, i) => ({ x: i - 10, y: i % 2 === 0 ? 0 : amplitude }));
            const lineLabel = (prefix: string) => ({
                enabled: true,
                formatter: ({ datum }: any) => `${prefix}${datum.x}`,
                placement: ['bottom', 'top'],
                collision: avoidsAxisLabels,
                truncate: false,
            });
            await expectSeriesLabelsClearAxisLabels({
                legend: { enabled: false },
                axes: {
                    x: { position: 'bottom', type: 'number', crossAt: { value: 0 }, interval: { step: 2 } },
                    y: { position: 'left', type: 'number', crossAt: { value: 0 }, min: -10, max: 10 },
                },
                series: [
                    { type: 'line', data: zigzag(6), xKey: 'x', yKey: 'y', label: lineLabel('A') },
                    { type: 'line', data: zigzag(-6), xKey: 'x', yKey: 'y', yName: 'B', label: lineLabel('B') },
                ],
            });
        });
    });
});
