import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import { expectPixelIdenticalAcrossUpdate } from '../../test/bigintExamples';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    PATTERN_SNAPSHOT_DEFAULTS,
    createChart,
    deproxy,
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../../test/utils';

// `label.placement` is documented for point-like series; `label.collision` is documented too, but
// `collideWith` within it is an undocumented opt-in model (see chartDefaults.ts), so the option
// objects below are built untyped and cast at the AgCharts.create boundary.
type LabelCollisionConfig = {
    placement?: string[];
    collision?: {
        minSpacing?: number;
        suppressHide?: boolean;
        collideWith?: object;
    };
};

// Line and area route labels through the collision-placement engine, which honours the configured
// placements: each candidate-placement set resolves colliding labels into different final positions,
// so the rendered output diverges per placement. Collision resolution always runs now, so the axis of
// variation is the placement candidate list and, for the first case, whether a colliding label is kept
// (at its least-overflow candidate) rather than hidden.
const PLACED_LABEL_STRATEGIES: Record<string, LabelCollisionConfig> = {
    'keep overlapping (suppressHide: true)': {
        placement: ['top', 'bottom'],
        collision: { suppressHide: true },
    },
    'reposition top-bottom': {
        placement: ['top', 'bottom'],
        collision: { suppressHide: false },
    },
    'reposition left-right': {
        placement: ['left', 'right'],
        collision: { suppressHide: false },
    },
    'reposition all directions': {
        placement: ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
        collision: { suppressHide: false },
    },
    'reposition with min spacing': {
        placement: ['top', 'bottom'],
        collision: { suppressHide: false, minSpacing: 8 },
    },
};

// Scatter (and bubble, which it extends) position labels at their own fixed `label.placement` and
// ignore the placement candidates, so collision resolution only ever decides whether an overlapping
// label is hidden or kept — the single meaningful axis for marker series is `suppressHide`.
const MARKER_LABEL_STRATEGIES: Record<string, LabelCollisionConfig> = {
    'keep overlapping (suppressHide: true)': { collision: { suppressHide: true } },
    'hide on collision (suppressHide: false, default)': { collision: { suppressHide: false } },
};

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
        await waitForChartStability(chart);
        expect(extractImageData(ctx)).toMatchImageSnapshot(defaults);
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

    // Line and area default collision avoidance off; the theme default placement `['top', 'bottom']`
    // is a directional fallback list that must still cascade to fit the bounds, and a user value must
    // override the theme default rather than merge into it.
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
            // The default placement `['top', 'bottom']` cascades with avoidance off. Line's degenerate
            // domain centres the point, so 'top' fits and is kept; area's domain includes the zero
            // baseline, seating y:50 at the top edge, so 'top' overflows and the list falls to 'bottom'.
            it(`${type}: resolves the default top→bottom fallback list to fit the bounds`, async () => {
                const expectedPlacement = type === 'area' ? 'bottom' : 'top';
                const offsetSign = expectedPlacement === 'bottom' ? 1 : -1;
                const placed = await render(type);
                expect(placed.length).toBe(sparseData.length);
                for (const label of placed) {
                    expect(label.placement).toBe(expectedPlacement);
                    expect(Math.sign(label.y - label.datum.point.y)).toBe(offsetSign);
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
            opts: { markerSize?: number; markerEnabled?: boolean; placement?: string | string[] } = {}
        ) => {
            const { markerSize = 40, markerEnabled = true, placement = 'inside' } = opts;
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
                            formatter: ({ value }: any) => String(value),
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

            it(`${type}: hides labels whose text overflows a small marker`, async () => {
                const placed = await render(type, { markerSize: 4 });
                expect(placed.length).toBe(0);
            });

            it(`${type}: hides inside labels when the marker is disabled`, async () => {
                const placed = await render(type, { markerEnabled: false, markerSize: 40 });
                expect(placed.length).toBe(0);
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

        const placedLabels = () => {
            const series = deproxy(chart as any).series[0] as unknown as {
                placedLabelData: { placement?: string }[];
            };
            return series.placedLabelData;
        };

        const render = async (
            type: 'scatter' | 'bubble',
            opts: { markerSize: number; placement: string | string[] }
        ) => {
            const { markerSize, placement } = opts;
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
                        label: { enabled: true, placement },
                    },
                ],
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            return placedLabels();
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

    // Label box dimensions and per-datum marker sizes feed the collision engine, so placement must
    // stay correct as font size, padding and stylers vary the geometry it resolves against.
    describe('with varied label options and stylers', () => {
        const repositionAllDirections: LabelCollisionConfig = {
            placement: ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
            collision: { suppressHide: false },
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

        it('line: marker itemStyler varies size with collideWith markers', async () => {
            await renderAndSnapshot({
                data: lineData,
                legend: { enabled: false },
                axes: cartesianAxes,
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        marker: {
                            enabled: true,
                            itemStyler: ({ xValue }: any) => ({ size: 4 + (xValue % 5) * 4 }),
                        },
                        label: {
                            enabled: true,
                            formatter: ({ value }: any) => value.toFixed(1),
                            placement: ['top', 'bottom'],
                            collision: {
                                suppressHide: false,
                                collideWith: { markers: { enabled: true, minSpacing: 4 } },
                            },
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
        const closeData = [
            { x: 10, y: 50 },
            { x: 11, y: 50 },
            { x: 12, y: 50 },
        ];
        const tightAxes = {
            x: { position: 'bottom', type: 'number', min: 0, max: 24 },
            y: { position: 'left', type: 'number' },
        };

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
                            collision: { suppressHide: false },
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
                        suppressHide: false,
                        collideWith: { seriesItems: { enabled: true } },
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

    // Bar-family `placement` was widened to accept an ordered array, but the bar candidate-fallback
    // engine is not yet wired (Ticket C). Until then a supplied array must be inert-safe: the first
    // candidate is used, matching the single-value render, with no error raised.
    describe('bar placement (widened type, fallback not yet wired)', () => {
        const barData = Array.from({ length: 8 }, (_, i) => ({ x: `C${i}`, y: 20 + 10 * Math.sin(i) }));
        const barOptions = (placement: string | string[]) => ({
            data: barData,
            legend: { enabled: false },
            axes: { x: { type: 'category', position: 'bottom' }, y: { type: 'number', position: 'left' } },
            series: [{ type: 'bar', xKey: 'x', yKey: 'y', label: { enabled: true, placement } }],
        });

        it('renders an array placement identically to its first candidate', async () => {
            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createChart,
                barOptions('inside-end') as any,
                barOptions(['inside-end', 'outside-end']) as any
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
        // horizontal bake. Once a bar is too narrow for horizontal the engine picks vertical; when it
        // is too narrow for even vertical the label must keep the least-overflowing orientation
        // rather than being dropped and reverting to the first (horizontal) orientation baked at node-data
        // time, which would overflow the bar rect (AG-17782).
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

            const firstLabelRotation = () => {
                const series = deproxy(chart as any).series[0] as unknown as {
                    contextNodeData?: { labelData?: { label?: { text?: unknown; rotation?: number } }[] };
                };
                const labelData = series.contextNodeData?.labelData ?? [];
                const labelled = labelData.find((d) => d.label != null && d.label.text !== '');
                return labelled?.label?.rotation ?? 0;
            };

            chart = AgCharts.create(optionsAt(1000));
            await waitForChartStability(chart);

            const rotations: number[] = [];
            for (const width of [1000, 700, 500, 350, 240, 160, 110, 70]) {
                await chart.update(optionsAt(width));
                await waitForChartStability(chart);
                rotations.push(firstLabelRotation());
            }

            // The scenario must actually reach vertical at some width, then never revert to the
            // horizontal (0) bake as the bar narrows further.
            const firstVertical = rotations.findIndex((rotation) => rotation !== 0);
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

            chart = AgCharts.create(optionsAt(300));
            await waitForChartStability(chart);

            const initial = firstRotatedLabelPivot();
            // Anti-vacuous guard: the scenario must actually produce a rotated (vertical) label.
            expect(initial).toBeDefined();
            const { rotationCenterX, rotationCenterY } = initial!;

            for (const width of [300, 200, 140, 200, 300, 140, 300]) {
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

    // `suppressHide` gates only the terminal hide-vs-keep decision once collision resolution has run;
    // it is orthogonal to fit (wrapping/truncation) and placement cascade, which always apply
    // regardless of its value.
    describe('collision.suppressHide (acceptance criteria)', () => {
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
                            // the box-footprint suite above), independent of `collision.suppressHide`.
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

        it('suppressHide: false hides a label that cannot avoid a collision', async () => {
            // Anti-vacuous guard: some labels must actually collide for the assertion to be meaningful.
            const placed = await renderPlaced({ collision: { suppressHide: false } });
            expect(placed.length).toBeLessThan(closeData.length);
        });

        it('suppressHide: true keeps every label visible at its least-overflow candidate', async () => {
            const placed = await renderPlaced({ collision: { suppressHide: true } });
            expect(placed.length).toBe(closeData.length);
        });

        it('still cascades a placement fallback for a kept label when suppressHide is true', async () => {
            const placed = await renderPlaced({
                collision: { suppressHide: true },
                placement: ['top', 'bottom'],
            });
            expect(placed.length).toBe(closeData.length);
            // Anti-vacuous guard: at least one label must have been pushed off the default 'top' candidate.
            expect(placed.some((label) => label.placement === 'bottom')).toBe(true);
        });

        it('still wraps and truncates a kept label when suppressHide is true', async () => {
            const placed = await renderPlaced({
                collision: { suppressHide: true },
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
                        collision: { suppressHide: true },
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
