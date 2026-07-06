import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import { expectPixelIdenticalAcrossUpdate } from '../../test/bigintExamples';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    PATTERN_SNAPSHOT_DEFAULTS,
    createChart,
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
});
