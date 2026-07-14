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

// `label.placement` is documented for point-like series, but `label.collisionAvoidance` is an
// undocumented opt-in model (see chartDefaults.ts), so the option objects below are built untyped
// and cast at the AgCharts.create boundary.
type LabelCollisionConfig = {
    placement?: string[];
    collisionAvoidance?: {
        enabled?: boolean;
        minSpacing?: number;
        collideWith?: object;
    };
};

// Line and area route labels through the collision-placement engine, which honours the configured
// placements: each candidate-placement set resolves colliding labels into different final positions,
// so the rendered output diverges per placement.
const PLACED_LABEL_STRATEGIES: Record<string, LabelCollisionConfig> = {
    'disabled (place all)': { collisionAvoidance: { enabled: false } },
    'reposition top-bottom': {
        placement: ['top', 'bottom'],
        collisionAvoidance: { enabled: true },
    },
    'reposition left-right': {
        placement: ['left', 'right'],
        collisionAvoidance: { enabled: true },
    },
    'reposition all directions': {
        placement: ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
        collisionAvoidance: { enabled: true },
    },
    'reposition with min spacing': {
        placement: ['top', 'bottom'],
        collisionAvoidance: { enabled: true, minSpacing: 8 },
    },
};

// Scatter (and bubble, which it extends) only consume the `enabled` flag — they position labels at
// their own fixed `label.placement` and ignore the placement candidates — so the single meaningful
// axis for marker series is collision avoidance on vs off.
const MARKER_LABEL_STRATEGIES: Record<string, LabelCollisionConfig> = {
    'disabled (place all)': { collisionAvoidance: { enabled: false } },
    'enabled (avoid collisions)': { collisionAvoidance: { enabled: true } },
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

    // Line and area default collision avoidance off; a configured `placement` must still offset each
    // label from its point, and a user value must override the theme default rather than merge into it.
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
            it(`${type}: places labels above the point by default`, async () => {
                const placed = await render(type);
                expect(placed.length).toBe(sparseData.length);
                for (const label of placed) {
                    expect(label.placement).toBe('top');
                    expect(label.y).toBeLessThan(label.datum.point.y);
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

            it(`${type}: a mixed placement list keeps full text for the directional fallback`, async () => {
                // A small marker hides a pure `inside` label, but mixing `inside` with a directional
                // fallback must not constrain the text to the marker, so the labels still render.
                const placed = await render(type, { markerSize: 4, placement: ['inside', 'top'] });
                expect(placed.length).toBe(sparseData.length);
            });
        }
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
            collisionAvoidance: { enabled: true },
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
                            collisionAvoidance: {
                                enabled: true,
                                collideWith: { markers: { enabled: true, minSpacing: 4 } },
                            },
                        },
                    },
                ],
            });
        });

        it('bubble: itemStyler varies marker style with avoidance enabled', async () => {
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
                            label: { enabled: true, fontSize: 16, collisionAvoidance: { enabled: true } },
                        },
                    ],
                },
                PATTERN_SNAPSHOT_DEFAULTS
            );
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
                    collisionAvoidance: {
                        enabled: true,
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
                    collisionAvoidance: { enabled: true },
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
});
