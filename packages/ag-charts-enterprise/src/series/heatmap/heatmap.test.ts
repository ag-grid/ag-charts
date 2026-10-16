import { type Image as SkiaImage, loadImage as skiaLoadImage } from 'skia-canvas';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { type AgChartOptions, AgCharts, type AgHeatmapSeriesItemStylerParams } from 'ag-charts-community';
import {
    BIG,
    type Chart,
    IMAGE_SNAPSHOT_DEFAULTS,
    MIN_TOOLTIP_HIDE_DELAY,
    NEG_BIG,
    type SceneGeometrySample,
    assertTooltipSuppressedForMissing,
    compareImageSnapshot,
    computeLegendBBox,
    createSceneGeometrySampler,
    deproxy,
    expectNoAnimation,
    expectPixelIdenticalAcrossUpdate,
    expectWarningsCalls,
    hoverAction,
    isTooltipVisible,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    waitForChartStability,
} from 'ag-charts-community-test';
import { Group, Rect, Transformable } from 'ag-charts-core';
import type { Node } from 'ag-charts-core';
import { classCast } from 'ag-charts-test';

import {
    DEFAULT_DISABLED_SHADOW,
    SHADOW,
    collectShapes,
    createEnterpriseChart,
    prepareEnterpriseTestOptions,
    renderEnterpriseChartImage,
    shadowedShapes,
} from '../../test/utils';
import { HeatmapSeries } from './heatmapSeries';

// Resolves nodeData fresh on every call so it stays valid across `proxy.update(...)` rebuilds.
async function hoverDatumByIndex(chart: Chart, seriesIndex: number, datumIndex: number, hideDelay?: number) {
    const series = classCast(chart.series[seriesIndex], HeatmapSeries);
    const nodeData = series.getNodeData();
    expect(nodeData).toBeDefined();
    const datum = nodeData!.find((n) => n.datumIndex === datumIndex);
    expect(datum).toBeDefined();
    const { canvasX: x, canvasY: y } = Transformable.toCanvasPoint(series.contentGroup, datum!.point.x, datum!.point.y);
    await hoverAction(x, y)(chart);
    await waitForChartStability(chart, hideDelay);
}

describe('HeatmapSeries', () => {
    setupMockConsole();

    let chart: any;
    const ctx = setupMockCanvas();

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const EXAMPLE_OPTIONS: AgChartOptions = {
        data: [
            { year: '2020', person: 'Florian', spending: 10 },
            { year: '2020', person: 'Julian', spending: 20 },
            { year: '2020', person: 'Martian', spending: 30 },
            { year: '2021', person: 'Florian', spending: 20 },
            { year: '2021', person: 'Julian', spending: 30 },
            { year: '2021', person: 'Martian', spending: 40 },
            { year: '2022', person: 'Florian', spending: 30 },
            { year: '2022', person: 'Julian', spending: 40 },
            { year: '2022', person: 'Martian', spending: 50 },
        ],
        series: [
            {
                type: 'heatmap',
                xKey: 'year',
                yKey: 'person',
                colorKey: 'spending',
                colorScale: {
                    fills: [{ color: 'yellow' }, { color: 'red' }, { color: 'blue' }],
                },
            },
        ],
        legend: {
            enabled: true,
        },
    };

    const compare = async () => {
        await compareImageSnapshot(chart, ctx);
    };

    it(`should render placeholder chart as expected`, async () => {
        chart = await createEnterpriseChart({ ...EXAMPLE_OPTIONS });
        await compare();
    });

    it('AG-8290 label boxing', async () => {
        chart = await createEnterpriseChart({
            data: [
                { year: '2018', month: 'Jan', temperature: 4.4 },
                { year: '2018', month: 'Apr', temperature: 8.8 },
                { year: '2018', month: 'Jul', temperature: 19.5 },
                { year: '2018', month: 'Oct', temperature: 10.3 },
                { year: '2019', month: 'Jan', temperature: 4.4 },
                { year: '2019', month: 'Apr', temperature: 8.9 },
                { year: '2019', month: 'Jul', temperature: 17.8 },
                { year: '2019', month: 'Oct', temperature: 9.2 },
                { year: '2020', month: 'Jan', temperature: 6.4 },
                { year: '2020', month: 'Apr', temperature: 10.3 },
                { year: '2020', month: 'Jul', temperature: 15.6 },
                { year: '2020', month: 'Oct', temperature: 9.8 },
                { year: '2021', month: 'Jan', temperature: 2.8 },
                { year: '2021', month: 'Apr', temperature: 6.5 },
                { year: '2021', month: 'Jul', temperature: 18.4 },
                { year: '2021', month: 'Oct', temperature: 11.6 },
                { year: '2022', month: 'Jan', temperature: 5.2 },
                { year: '2022', month: 'Apr', temperature: 9.2 },
                { year: '2022', month: 'Jul', temperature: 18.5 },
                { year: '2022', month: 'Oct', temperature: 12.1 },
            ],
            series: [
                {
                    type: 'heatmap',
                    xKey: 'month',
                    yKey: 'year',
                    colorKey: 'temperature',
                    label: {
                        padding: 5,
                        border: { strokeWidth: 3, stroke: 'lightblue' },
                        fill: 'lightgrey',
                        fillOpacity: 0.7,
                        cornerRadius: 10,
                    },
                },
            ],
        });
        await compare();
    });

    describe('AG-16306 - clearing data', () => {
        it('should clear heatmap when data is updated to empty array', async () => {
            chart = await createEnterpriseChart({
                title: { text: 'Should render empty chart' },
                data: [
                    { year: '2018', month: 'Jan', temperature: 4.4 },
                    { year: '2018', month: 'Apr', temperature: 8.8 },
                    { year: '2019', month: 'Jan', temperature: 4.4 },
                    { year: '2019', month: 'Apr', temperature: 8.9 },
                ],
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'month',
                        yKey: 'year',
                        colorKey: 'temperature',
                    },
                ],
            });

            await chart.updateDelta({ data: [] });

            await compareImageSnapshot(chart, ctx);
        });
    });

    describe('AG-15645 - colorKey edge cases', () => {
        it('should handle some null color values', async () => {
            chart = await createEnterpriseChart({
                data: [
                    {
                        x: 1753866000000,
                        y: 'ExDest Aquis AoD (AQXA)',
                        z: null,
                    },
                    {
                        x: 1753866000000,
                        y: 'ExDest Bats Dark (BATD)',
                        z: 1200,
                    },
                    {
                        x: 1753866000000,
                        y: 'ExDest Cboe LIS (LISX)',
                        z: null,
                    },
                ],
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'x',
                        yKey: 'y',
                        colorKey: 'z',
                        label: {},
                    },
                ],
                axes: {
                    x: {
                        position: 'bottom',
                        type: 'category',
                        label: {},
                    },
                    y: {
                        position: 'left',
                        type: 'category',
                        label: {},
                    },
                },
            });
            await compare();
        });

        it('should handle all null color values', async () => {
            chart = await createEnterpriseChart({
                data: [
                    {
                        x: 1753866000000,
                        y: 'ExDest Aquis AoD (AQXA)',
                        z: null,
                    },
                    {
                        x: 1753866000000,
                        y: 'ExDest Bats Dark (BATD)',
                        z: null,
                    },
                    {
                        x: 1753866000000,
                        y: 'ExDest Cboe LIS (LISX)',
                        z: null,
                    },
                ],
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'x',
                        yKey: 'y',
                        colorKey: 'z',
                        label: {},
                    },
                ],
                axes: {
                    x: {
                        position: 'bottom',
                        type: 'category',
                        label: {},
                    },
                    y: {
                        position: 'left',
                        type: 'category',
                        label: {},
                    },
                },
            });
            await compare();
        });

        it('should handle no colorKey', async () => {
            chart = await createEnterpriseChart({
                data: [
                    {
                        x: 1753866000000,
                        y: 'ExDest Aquis AoD (AQXA)',
                    },
                    {
                        x: 1753866000000,
                        y: 'ExDest Bats Dark (BATD)',
                    },
                    {
                        x: 1753866000000,
                        y: 'ExDest Cboe LIS (LISX)',
                    },
                ],
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'x',
                        yKey: 'y',
                        label: {},
                    },
                ],
                axes: {
                    x: {
                        position: 'bottom',
                        type: 'category',
                        label: {},
                    },
                    y: {
                        position: 'left',
                        type: 'category',
                        label: {},
                    },
                },
            });
            await compare();
        });

        it('should handle null color values in colorKey', async () => {
            chart = await createEnterpriseChart({
                data: [
                    {
                        x: 1753866000000,
                        y: 'ExDest Aquis AoD (AQXA)',
                        z: 100,
                    },
                    {
                        x: 1753866000000,
                        y: 'ExDest Bats Dark (BATD)',
                        z: null,
                    },
                    {
                        x: 1753866000000,
                        y: 'ExDest Cboe LIS (LISX)',
                        z: 200,
                    },
                ],
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'x',
                        yKey: 'y',
                        colorKey: 'z',
                        label: {},
                    },
                ],
                axes: {
                    x: {
                        position: 'bottom',
                        type: 'category',
                        label: {},
                    },
                    y: {
                        position: 'left',
                        type: 'category',
                        label: {},
                    },
                },
            });
            await compare();
        });
    });

    describe('colorScale', () => {
        it('should render with continuous colorScale', async () => {
            chart = await createEnterpriseChart({
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        ...EXAMPLE_OPTIONS.series![0],
                        colorScale: {
                            fills: [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }],
                        },
                    },
                ],
            });
            await compare();
        });

        it('should render with discrete colorScale', async () => {
            chart = await createEnterpriseChart({
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        ...EXAMPLE_OPTIONS.series![0],
                        colorScale: {
                            fills: [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }],
                            mode: 'discrete' as const,
                        },
                    },
                ],
            });
            await compare();
        });

        it('should render with explicit domain colorScale', async () => {
            chart = await createEnterpriseChart({
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        ...EXAMPLE_OPTIONS.series![0],
                        colorScale: {
                            fills: [{ color: 'green' }, { color: 'white' }, { color: 'purple' }],
                            domain: [0, 100] as [number, number],
                        },
                    },
                ],
            });
            await compare();
        });

        it('should render with discrete named stops colorScale', async () => {
            chart = await createEnterpriseChart({
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        ...EXAMPLE_OPTIONS.series![0],
                        colorScale: {
                            fills: [
                                { color: 'blue', stop: 20, name: 'Low' },
                                { color: 'yellow', stop: 35, name: 'Medium' },
                                { color: 'red', name: 'High' },
                            ],
                            mode: 'discrete' as const,
                        },
                    },
                ],
            });
            await compare();
        });
    });

    describe('legend', () => {
        it('should render gradient legend with continuous colorScale', async () => {
            chart = await createEnterpriseChart({
                data: EXAMPLE_OPTIONS.data,
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'year',
                        yKey: 'person',
                        colorKey: 'spending',
                        colorScale: {
                            fills: [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }],
                        },
                    },
                ],
            });
            await compare();
        });

        it('should render category legend with discrete colorScale', async () => {
            chart = await createEnterpriseChart({
                data: EXAMPLE_OPTIONS.data,
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'year',
                        yKey: 'person',
                        colorKey: 'spending',
                        colorScale: {
                            fills: [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }],
                            mode: 'discrete' as const,
                        },
                    },
                ],
            });
            await compare();
        });

        it('should render category legend with named discrete stops', async () => {
            chart = await createEnterpriseChart({
                data: EXAMPLE_OPTIONS.data,
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'year',
                        yKey: 'person',
                        colorKey: 'spending',
                        colorScale: {
                            fills: [
                                { color: 'blue', stop: 20, name: 'Low' },
                                { color: 'yellow', stop: 35, name: 'Medium' },
                                { color: 'red', name: 'High' },
                            ],
                            mode: 'discrete' as const,
                        },
                    },
                ],
            });
            await compare();
        });

        it('should render gradient legend with continuous named stops', async () => {
            chart = await createEnterpriseChart({
                data: EXAMPLE_OPTIONS.data,
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'year',
                        yKey: 'person',
                        colorKey: 'spending',
                        colorScale: {
                            fills: [
                                { color: 'blue', stop: 10, name: 'Low' },
                                { color: 'yellow', stop: 30, name: 'Medium' },
                                { color: 'red', name: 'High' },
                            ],
                        },
                    },
                ],
            });
            await compare();
        });

        it('should render gradient legend with discrete named stops', async () => {
            chart = await createEnterpriseChart({
                data: EXAMPLE_OPTIONS.data,
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'year',
                        yKey: 'person',
                        colorKey: 'spending',
                        colorScale: {
                            fills: [
                                { color: 'blue', stop: 20, name: 'Low' },
                                { color: 'yellow', stop: 35, name: 'Medium' },
                                { color: 'red', name: 'High' },
                            ],
                            mode: 'discrete' as const,
                        },
                    },
                ],
                legend: { enabled: false },
                gradientLegend: { enabled: true, gradient: { preferredLength: 200 } },
            });
            await compare();
        });

        it('AG-16043: moving from a normal legend item onto a suppressed bin clears the legend-scoped highlight', async () => {
            chart = deproxy(
                await createEnterpriseChart({
                    data: [
                        { x: 1, y: 1, size: 10, v: 10 },
                        { x: 2, y: 2, size: 20, v: 30 },
                        { x: 3, y: 3, size: 30, v: 50 },
                        { x: 4, y: 4, size: 40, v: 70 },
                        { x: 5, y: 5, size: 50, v: 90 },
                    ],
                    series: [
                        {
                            type: 'bubble',
                            xKey: 'x',
                            yKey: 'y',
                            sizeKey: 'size',
                            title: 'Series A',
                        },
                        {
                            type: 'bubble',
                            xKey: 'x',
                            yKey: 'y',
                            sizeKey: 'size',
                            colorKey: 'v',
                            colorScale: {
                                mode: 'discrete' as const,
                                fills: [{ color: 'red' }, { color: 'green' }, { color: 'blue' }],
                            },
                            title: 'Series B',
                        },
                    ],
                })
            );

            // Drive Legend.onHover directly: its markerLabel nodes already carry the datum
            // association, and the MouseEvent is only used for tooltip positioning.
            const legendModule = (chart as Chart).modulesManager.getModule<any>('legend');
            const items: any[] = [];
            legendModule.itemSelection.each((item: any) => items.push(item));
            // 1 toggleable Series A + 3 bin items from Series B.
            expect(items).toHaveLength(4);
            expect(items[0].datum.suppressHighlight).toBeUndefined();
            expect(items[1].datum.suppressHighlight).toBe(true);

            const { highlightManager } = (chart as Chart).ctx;
            const mockEvent = new MouseEvent('mousemove');
            expect(highlightManager.getActiveHighlight()).toBeUndefined();

            // Hover the toggleable Series A item — the legend sets a highlight under its caller id.
            legendModule.onHover(mockEvent, items[0]);
            await waitForChartStability(chart);
            expect(highlightManager.getActiveHighlight()).toBeDefined();

            // Move onto a suppressed bin item — the prior legend-scoped highlight must be cleared.
            legendModule.onHover(mockEvent, items[1]);
            await waitForChartStability(chart);
            expect(highlightManager.getActiveHighlight()).toBeUndefined();
        });

        it('AG-16043: hovering a discrete-bin legend item must not register a highlight', async () => {
            chart = deproxy(
                await createEnterpriseChart({
                    data: EXAMPLE_OPTIONS.data,
                    series: [
                        {
                            type: 'heatmap',
                            xKey: 'year',
                            yKey: 'person',
                            colorKey: 'spending',
                            colorScale: {
                                fills: [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }],
                                mode: 'discrete' as const,
                            },
                        },
                    ],
                })
            );

            const { highlightManager } = (chart as Chart).ctx;
            expect(highlightManager.getActiveHighlight()).toBeUndefined();

            const legendBBox = computeLegendBBox(chart);
            await hoverAction(legendBBox.x + 5, legendBBox.y + legendBBox.height / 2)(chart);
            await waitForChartStability(chart);

            // A bin's itemId is a bin index, not a datum index, so it must never reach the
            // highlight pipeline.
            expect(highlightManager.getActiveHighlight()).toBeUndefined();
        });

        it('AG-16043: discrete-bin legend items render with the default cursor, not pointer', async () => {
            chart = deproxy(
                await createEnterpriseChart({
                    data: EXAMPLE_OPTIONS.data,
                    series: [
                        {
                            type: 'heatmap',
                            xKey: 'year',
                            yKey: 'person',
                            colorKey: 'spending',
                            colorScale: {
                                fills: [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }],
                                mode: 'discrete' as const,
                            },
                        },
                    ],
                })
            );

            // Discrete-bin items don't toggle, so a pointer cursor would imply interactivity.
            const legendButtons = document.querySelectorAll<HTMLElement>('button.ag-charts-proxy-elem[role="switch"]');
            expect(legendButtons.length).toBeGreaterThan(0);
            for (const button of Array.from(legendButtons)) {
                expect(button.style.cursor).toBe('default');
            }
        });

        it('AG-16043: discrete-bin legend labels run through chart-level formatter.color', async () => {
            chart = deproxy(
                await createEnterpriseChart({
                    data: [
                        { year: '2020', person: 'A', spending: 43384 },
                        { year: '2020', person: 'B', spending: 250000 },
                        { year: '2020', person: 'C', spending: 1500000 },
                    ],
                    formatter: {
                        color: (p) => new Intl.NumberFormat('en', { notation: 'compact' }).format(p.value as number),
                    },
                    series: [
                        {
                            type: 'heatmap',
                            xKey: 'year',
                            yKey: 'person',
                            colorKey: 'spending',
                            colorScale: {
                                mode: 'discrete' as const,
                                fills: [
                                    { color: '#fdd49e', stop: 150000 },
                                    { color: '#fdbb84', stop: 500000 },
                                    { color: '#e34a33', stop: 1000000 },
                                    { color: '#b30000' },
                                ],
                            },
                        },
                    ],
                })
            );

            const series = (chart as Chart).series[0];
            const legendData = series.getLegendData('category') as { label: { text: string } }[];
            const labels = legendData.map((d) => d.label.text);

            // Stops are 150000 / 500000 / 1000000; the final bin runs to the data max (1.5M).
            expect(labels).toEqual(['43K–150K', '150K–500K', '500K–1M', '1M–1.5M']);
        });
    });

    describe('null category key', () => {
        it('should render with null category key value', async () => {
            chart = await createEnterpriseChart({
                data: [
                    { year: '2020', person: 'Florian', spending: 10 },
                    { year: '2020', person: null, spending: 20 },
                    { year: '2021', person: 'Florian', spending: 30 },
                    { year: '2021', person: null, spending: 40 },
                ],
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'year',
                        yKey: 'person',
                        colorKey: 'spending',
                    },
                ],
            });

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [HeatmapSeries-1 / yValue] ignored:",
    "[null]",
  ],
]
`);
            await compare();
        });

        it('should filter undefined category key value', async () => {
            chart = await createEnterpriseChart({
                data: [
                    { year: '2020', person: 'Florian', spending: 10 },
                    { year: '2020', person: undefined, spending: 20 },
                    { year: '2021', person: 'Florian', spending: 30 },
                ],
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'year',
                        yKey: 'person',
                        colorKey: 'spending',
                    },
                ],
            });

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [undefined] for [HeatmapSeries-1 / yValue] ignored:",
    "[undefined]",
  ],
]
`);
            await compare();
        });

        it('should accept null category key when allowNullKeys is true', async () => {
            chart = await createEnterpriseChart({
                data: [
                    { year: '2020', person: 'Florian', spending: 10 },
                    { year: '2020', person: null, spending: 20 },
                    { year: '2021', person: 'Florian', spending: 30 },
                    { year: '2021', person: null, spending: 40 },
                ],
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'year',
                        yKey: 'person',
                        colorKey: 'spending',
                        allowNullKeys: true,
                    } as any,
                ],
            });

            expectWarningsCalls().toEqual([]);
            await compare();
        });

        it('should accept undefined category key when allowNullKeys is true', async () => {
            chart = await createEnterpriseChart({
                data: [
                    { year: '2020', person: 'Florian', spending: 10 },
                    { year: '2020', person: undefined, spending: 20 },
                    { year: '2021', person: 'Florian', spending: 30 },
                ],
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'year',
                        yKey: 'person',
                        colorKey: 'spending',
                        allowNullKeys: true,
                    } as any,
                ],
            });

            expectWarningsCalls().toEqual([]);
            await compare();
        });

        it('should fill missing colorValue with colorScale.missingDataFill', async () => {
            const data: Array<{ year: string; person: string; spending?: number | null }> = [
                { year: '2020', person: 'Florian', spending: 10 },
                { year: '2020', person: 'Julian', spending: null },
                { year: '2020', person: 'Martian' },
                { year: '2021', person: 'Florian', spending: 20 },
                { year: '2021', person: 'Julian', spending: 30 },
                { year: '2021', person: 'Martian', spending: 40 },
            ];
            chart = deproxy(
                await createEnterpriseChart({
                    data,
                    series: [
                        {
                            type: 'heatmap',
                            xKey: 'year',
                            yKey: 'person',
                            colorKey: 'spending',
                            colorScale: {
                                fills: [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }],
                                missingDataFill: '#cccccc',
                            },
                        },
                    ],
                })
            );
            await compare();

            const seriesImpl = chart.series[0] as HeatmapSeries;
            assertTooltipSuppressedForMissing(
                seriesImpl,
                data,
                (d) => d.spending == null,
                (i) => i
            );
        });

        it('AG-16046: should dismiss tooltip when hovering a missing colorValue datum', async () => {
            const data: Array<{ year: string; person: string; spending?: number | null }> = [
                { year: '2020', person: 'Florian', spending: 10 },
                { year: '2020', person: 'Julian', spending: null },
                { year: '2021', person: 'Florian', spending: 30 },
                { year: '2021', person: 'Julian', spending: 40 },
            ];
            chart = deproxy(
                await createEnterpriseChart({
                    data,
                    series: [
                        {
                            type: 'heatmap',
                            xKey: 'year',
                            yKey: 'person',
                            colorKey: 'spending',
                            colorScale: {
                                fills: [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }],
                                missingDataFill: '#cccccc',
                            },
                        },
                    ],
                })
            );

            const presentIndex = data.findIndex((d) => d.spending != null);
            const missingIndex = data.findIndex((d) => d.spending == null);

            await hoverDatumByIndex(chart, 0, presentIndex);
            expect(isTooltipVisible(chart)).toBe(true);

            await hoverDatumByIndex(chart, 0, missingIndex, MIN_TOOLTIP_HIDE_DELAY);
            expect(isTooltipVisible(chart)).toBe(false);
        });

        it('AG-16046: should dismiss tooltip when hovering a series with tooltip disabled', async () => {
            const data = [
                { year: '2020', person: 'Florian', spending: 10 },
                { year: '2020', person: 'Julian', spending: 20 },
                { year: '2021', person: 'Florian', spending: 30 },
                { year: '2021', person: 'Julian', spending: 40 },
            ];
            const proxy = await createEnterpriseChart({
                data,
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'year',
                        yKey: 'person',
                        colorKey: 'spending',
                    },
                ],
            });
            chart = deproxy(proxy);

            await hoverDatumByIndex(chart, 0, 0);
            expect(isTooltipVisible(chart)).toBe(true);

            await proxy.update(
                prepareEnterpriseTestOptions({
                    data,
                    series: [
                        {
                            type: 'heatmap',
                            xKey: 'year',
                            yKey: 'person',
                            colorKey: 'spending',
                            tooltip: { enabled: false },
                        },
                    ],
                })
            );
            await waitForChartStability(chart);

            // Re-resolve post-update: layout, scale domains and node identity may all have changed.
            await hoverDatumByIndex(chart, 0, 1, MIN_TOOLTIP_HIDE_DELAY);
            expect(isTooltipVisible(chart)).toBe(false);
        });

        it('should allow itemStyler to override missingDataFill', async () => {
            chart = await createEnterpriseChart({
                data: [
                    { year: '2020', person: 'Florian', spending: 10 },
                    { year: '2020', person: 'Julian', spending: null },
                    { year: '2020', person: 'Martian' },
                    { year: '2021', person: 'Florian', spending: 20 },
                    { year: '2021', person: 'Julian', spending: 30 },
                    { year: '2021', person: 'Martian', spending: 40 },
                ],
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'year',
                        yKey: 'person',
                        colorKey: 'spending',
                        colorScale: {
                            fills: [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }],
                            missingDataFill: '#cccccc',
                        },
                        itemStyler: ({ datum }) => {
                            if (datum.spending == null) {
                                return { fill: 'magenta' };
                            }
                            return {};
                        },
                    },
                ],
            });
            await compare();
        });
    });

    describe('grouped-category axes', () => {
        const GROUPED_DATA = [
            { category: ['Fruit', 'Apple'], quarter: 'Q1', sales: 10 },
            { category: ['Fruit', 'Apple'], quarter: 'Q2', sales: 20 },
            { category: ['Fruit', 'Apple'], quarter: 'Q3', sales: 30 },
            { category: ['Fruit', 'Apple'], quarter: 'Q4', sales: 40 },
            { category: ['Fruit', 'Banana'], quarter: 'Q1', sales: 15 },
            { category: ['Fruit', 'Banana'], quarter: 'Q2', sales: 25 },
            { category: ['Fruit', 'Banana'], quarter: 'Q3', sales: 35 },
            { category: ['Fruit', 'Banana'], quarter: 'Q4', sales: 45 },
            { category: ['Veg', 'Carrot'], quarter: 'Q1', sales: 5 },
            { category: ['Veg', 'Carrot'], quarter: 'Q2', sales: 15 },
            { category: ['Veg', 'Carrot'], quarter: 'Q3', sales: 25 },
            { category: ['Veg', 'Carrot'], quarter: 'Q4', sales: 50 },
            { category: ['Veg', 'Potato'], quarter: 'Q1', sales: 18 },
            { category: ['Veg', 'Potato'], quarter: 'Q2', sales: 28 },
            { category: ['Veg', 'Potato'], quarter: 'Q3', sales: 38 },
            { category: ['Veg', 'Potato'], quarter: 'Q4', sales: 48 },
        ];

        it('should render with grouped-category X axis', async () => {
            chart = await createEnterpriseChart({
                data: GROUPED_DATA,
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'category',
                        yKey: 'quarter',
                        colorKey: 'sales',
                        colorScale: { fills: [{ color: 'yellow' }, { color: 'red' }, { color: 'blue' }] },
                        label: { enabled: true },
                    },
                ],
                axes: {
                    x: { type: 'grouped-category', position: 'bottom' },
                    y: { type: 'category', position: 'left' },
                },
                legend: { enabled: false },
            });
            await compare();
        });

        it('should render with grouped-category Y axis', async () => {
            chart = await createEnterpriseChart({
                data: GROUPED_DATA,
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'quarter',
                        yKey: 'category',
                        colorKey: 'sales',
                        colorScale: { fills: [{ color: 'yellow' }, { color: 'red' }, { color: 'blue' }] },
                        label: { enabled: true },
                    },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'grouped-category', position: 'left' },
                },
                legend: { enabled: false },
            });
            await compare();
        });

        it('should render with grouped-category on both axes', async () => {
            const data = [];
            for (const x of [
                ['H1', 'Q1'],
                ['H1', 'Q2'],
                ['H2', 'Q3'],
                ['H2', 'Q4'],
            ]) {
                for (const y of [
                    ['Fruit', 'Apple'],
                    ['Fruit', 'Banana'],
                    ['Veg', 'Carrot'],
                    ['Veg', 'Potato'],
                ]) {
                    data.push({
                        period: x,
                        category: y,
                        sales: x[1].charCodeAt(1) * y[1].charCodeAt(0),
                    });
                }
            }

            chart = await createEnterpriseChart({
                data,
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'period',
                        yKey: 'category',
                        colorKey: 'sales',
                        colorScale: { fills: [{ color: 'yellow' }, { color: 'red' }, { color: 'blue' }] },
                    },
                ],
                axes: {
                    x: { type: 'grouped-category', position: 'bottom' },
                    y: { type: 'grouped-category', position: 'left' },
                },
                legend: { enabled: false },
            });
            await compare();
        });

        // Guards tick/cell alignment for grouped X categories against a reversed Y axis.
        it('should render plunker 8wpS0AylLFG3GSsZ baud/parity scenario', async () => {
            const baudRates = [187.6, 187.7, 187.8];
            const parities = ['E', 'O'];
            const lineRates = [100, 200, 300, 400];
            const data = [];
            for (const baud of baudRates) {
                for (const parity of parities) {
                    for (const lineRate of lineRates) {
                        const base = (baud - 187.5) * 40;
                        const parityOffset = parity === 'E' ? 5 : -3;
                        const lineFactor = lineRate / 100;
                        const value = Number(
                            (base + parityOffset + lineFactor * 7 + Math.sin(baud * lineRate) * 4).toFixed(2)
                        );
                        data.push({
                            baud: baud.toFixed(1),
                            parity,
                            baudParity: [baud.toFixed(1), parity],
                            lineRate,
                            value,
                        });
                    }
                }
            }

            chart = await createEnterpriseChart({
                title: { text: 'Link Quality by Baud Rate (Even/Odd) and Line Rate' },
                subtitle: {
                    text: 'AG Charts 13.2.1 heatmap requires category axes — Even/Odd pairs are grouped via category ordering and two-line label formatting (baud rate above, parity below).',
                },
                data,
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'baudParity',
                        xName: 'Baud / Parity',
                        yKey: 'lineRate',
                        yName: 'Line Rate',
                        colorKey: 'value',
                        colorName: 'Value',
                        label: { enabled: true },
                    },
                ],
                axes: {
                    x: { type: 'grouped-category', title: { text: 'Baud Rate (Even / Odd pairs)' } },
                    y: { type: 'category', title: { text: 'Line Rate' }, reverse: true },
                },
                gradientLegend: { position: 'right' } as any,
            });
            await compare();
        });

        it('should render with a single group (degenerate grouping)', async () => {
            chart = await createEnterpriseChart({
                data: [
                    { category: ['Fruit', 'Apple'], quarter: 'Q1', sales: 10 },
                    { category: ['Fruit', 'Apple'], quarter: 'Q2', sales: 20 },
                    { category: ['Fruit', 'Banana'], quarter: 'Q1', sales: 15 },
                    { category: ['Fruit', 'Banana'], quarter: 'Q2', sales: 25 },
                ],
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'category',
                        yKey: 'quarter',
                        colorKey: 'sales',
                        colorScale: { fills: [{ color: 'yellow' }, { color: 'red' }, { color: 'blue' }] },
                    },
                ],
                axes: {
                    x: { type: 'grouped-category', position: 'bottom' },
                    y: { type: 'category', position: 'left' },
                },
                legend: { enabled: false },
            });
            await compare();
        });
    });

    describe('null category key', () => {
        it('should treat null and undefined as distinct categories', async () => {
            chart = await createEnterpriseChart({
                data: [
                    { year: '2020', person: 'Florian', spending: 10 },
                    { year: '2020', person: null, spending: 20 },
                    { year: '2020', person: undefined, spending: 30 },
                    { year: '2021', person: 'Florian', spending: 40 },
                    { year: '2021', person: null, spending: 50 },
                    { year: '2021', person: undefined, spending: 60 },
                ],
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'year',
                        yKey: 'person',
                        colorKey: 'spending',
                        allowNullKeys: true,
                    } as any,
                ],
            });

            expectWarningsCalls().toEqual([]);
            await compare();
        });
    });

    describe('block-leading image segments (treemap parity)', () => {
        // Bespoke: the image loader is stubbed between create and first render.
        // A `block: true` image segment renders as in treemap: left of the cell label, text beside it.
        const iconSvg = (letter: string) =>
            `data:image/svg+xml;utf8,${encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">` +
                    `<circle cx="14" cy="14" r="12" fill="#1f77b4"/>` +
                    `<text x="14" y="19" text-anchor="middle" font-family="Verdana" font-size="13"` +
                    ` fill="white" font-weight="bold">${letter}</text></svg>`
            )}`;
        const ICONS: Record<string, string> = {
            Florian: iconSvg('F'),
            Julian: iconSvg('J'),
            Martian: iconSvg('M'),
        };

        let preloaded: Record<string, SkiaImage> = {};
        beforeAll(async () => {
            const entries = await Promise.all(
                Object.values(ICONS).map(async (url) => [url, await skiaLoadImage(url)] as const)
            );
            preloaded = Object.fromEntries(entries);
        });

        function stubChartImageLoader(chartInstance: any) {
            const imageLoader = (chartInstance as Chart).ctx.scene.imageLoader as any;
            imageLoader.loadImage = (uri: string) => preloaded[uri] as unknown as HTMLImageElement;
        }

        it('renders a block-leading image segment in heatmap cell labels', async () => {
            const options = prepareEnterpriseTestOptions({
                ...EXAMPLE_OPTIONS,
                legend: { enabled: false },
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'year',
                        yKey: 'person',
                        colorKey: 'spending',
                        label: {
                            enabled: true,
                            formatter: ({ datum }) => [
                                { type: 'image', url: ICONS[datum.person], width: 20, height: 20, block: true },
                                { text: `${datum.spending}` },
                            ],
                        },
                    },
                ],
            });

            chart = deproxy(AgCharts.create(options));
            stubChartImageLoader(chart);
            // The snapshot is the guard: if the series flattened the formatter's segment array to
            // plain text the stubbed image would not render and the baseline would diff.
            await compare();
            expectWarningsCalls().toHaveLength(0);
        });
    });

    describe('bigint values (AG-16608)', () => {
        it('renders a heatmap series with out-of-safe-range bigint colour values', async () => {
            expect(
                await renderEnterpriseChartImage(ctx, {
                    data: [
                        { col: 'a', row: 'x', temp: BIG },
                        { col: 'a', row: 'y', temp: NEG_BIG },
                        { col: 'b', row: 'x', temp: BIG * 2n },
                    ],
                    series: [{ type: 'heatmap', xKey: 'col', yKey: 'row', colorKey: 'temp' }],
                    axes: { x: { type: 'category' }, y: { type: 'category' } },
                    legend: { enabled: false },
                })
            ).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });

        // The same colour-scale domain/stops supplied as `number` and as `bigint` must render
        // pixel-identically and without validation warnings.
        it('renders a bigint colorScale domain and stops identically to numbers', async () => {
            const buildOptions = (colorScale: object): AgChartOptions => ({
                ...EXAMPLE_OPTIONS,
                series: [{ ...EXAMPLE_OPTIONS.series![0], colorScale } as never],
            });

            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createEnterpriseChart,
                buildOptions({
                    domain: [0, 60],
                    fills: [{ color: 'yellow', stop: 20 }, { color: 'red', stop: 40 }, { color: 'blue' }],
                }),
                buildOptions({
                    domain: [0n, 60n],
                    fills: [{ color: 'yellow', stop: 20n }, { color: 'red', stop: 40n }, { color: 'blue' }],
                })
            );
        });
    });

    // Heatmap skips its animation batch, so a data change lands the new layout on the first frame.
    describe('does not animate', () => {
        const frames = spyOnAnimationFrames();

        const cellKeys = (sample: SceneGeometrySample) =>
            [...sample.keys()].filter((k) => /^series\[0\]\/rect\[/.test(k));

        it('update data: cells snap to their new layout without tweening', async () => {
            chart = await createEnterpriseChart({
                data: [
                    { year: '2020', person: 'A', spending: 10 },
                    { year: '2020', person: 'B', spending: 20 },
                    { year: '2021', person: 'A', spending: 30 },
                    { year: '2021', person: 'B', spending: 40 },
                ],
                series: [{ type: 'heatmap', xKey: 'year', yKey: 'person', colorKey: 'spending' }],
                legend: { enabled: false },
            });
            const sampler = createSceneGeometrySampler(chart);
            const { before, trajectory, after } = await frames.captureSnap(chart, sampler, () =>
                chart.updateDelta({
                    data: [
                        { year: '2020', person: 'A', spending: 10 },
                        { year: '2020', person: 'B', spending: 20 },
                        { year: '2021', person: 'A', spending: 30 },
                        { year: '2021', person: 'B', spending: 40 },
                        { year: '2022', person: 'A', spending: 50 },
                        { year: '2022', person: 'B', spending: 60 },
                    ],
                })
            );

            // Anti-vacuity: the extra year adds two cells, so the scene genuinely changed — a constant
            // trajectory over it is a real snap, not a pin over an unchanged scene.
            expect(cellKeys(before)).toHaveLength(4);
            expect(cellKeys(after)).toHaveLength(6);
            // The full new grid is present on the first captured frame (no cells fading/scaling in).
            expect(cellKeys(trajectory[0])).toHaveLength(6);
            expectNoAnimation(trajectory);
        });
    });

    describe('cornerRadius', () => {
        // Rect.serializeProps() omits the corner-radius fields, so neither the image snapshot nor the
        // scene-graph JSON can witness this option — the node has to be read directly.
        const cellRects = (target: Chart) => {
            const rects: Rect[] = [];
            const visit = (node: Node) => {
                if (node instanceof Rect) rects.push(node);
                if (node instanceof Group) {
                    for (const child of node.children()) visit(child);
                }
            };
            visit(classCast(target.series[0], HeatmapSeries).contentGroup);
            return rects;
        };

        const buildOptions = (cornerRadius?: number): AgChartOptions => ({
            data: EXAMPLE_OPTIONS.data,
            series: [
                {
                    type: 'heatmap',
                    xKey: 'year',
                    yKey: 'person',
                    colorKey: 'spending',
                    colorScale: { fills: [{ color: 'yellow' }, { color: 'red' }, { color: 'blue' }] },
                    stroke: 'black',
                    strokeWidth: 4,
                    cornerRadius,
                },
            ],
            legend: { enabled: false },
        });

        it('rounds every cell, with the stroke following the rounded shape', async () => {
            chart = deproxy(await createEnterpriseChart(buildOptions(16)));

            const rects = cellRects(chart);
            expect(rects).toHaveLength(9);
            for (const rect of rects) {
                expect(rect.topLeftCornerRadius).toBe(16);
                expect(rect.topRightCornerRadius).toBe(16);
                expect(rect.bottomRightCornerRadius).toBe(16);
                expect(rect.bottomLeftCornerRadius).toBe(16);
            }

            await compareImageSnapshot(chart, ctx);
        });

        it('defaults to square corners', async () => {
            chart = deproxy(await createEnterpriseChart(buildOptions()));

            const rects = cellRects(chart);
            expect(rects).toHaveLength(9);
            for (const rect of rects) {
                expect(rect.topLeftCornerRadius).toBe(0);
            }
        });
    });

    describe('shadow', () => {
        const buildOptions = (seriesShadow?: typeof SHADOW): AgChartOptions => ({
            data: EXAMPLE_OPTIONS.data,
            series: [
                {
                    type: 'heatmap',
                    xKey: 'year',
                    yKey: 'person',
                    colorKey: 'spending',
                    colorScale: { fills: [{ color: 'yellow' }, { color: 'red' }, { color: 'blue' }] },
                    shadow: seriesShadow,
                },
            ],
            legend: { enabled: false },
        });

        it('defaults to a disabled shadow', async () => {
            chart = deproxy(await createEnterpriseChart(buildOptions()));

            expect(chart.series[0]['options'].shadow).toEqual(DEFAULT_DISABLED_SHADOW);
        });

        it('shadows nothing when no shadow is set', async () => {
            chart = deproxy(await createEnterpriseChart(buildOptions()));

            const shapes = collectShapes(chart.series[0].contentGroup);
            expect(shapes).toHaveLength(9);
            expect(shadowedShapes(chart.series[0].contentGroup)).toEqual([]);
        });

        it('applies an enabled shadow to every cell', async () => {
            chart = deproxy(await createEnterpriseChart(buildOptions(SHADOW)));

            const shapes = collectShapes(chart.series[0].contentGroup);
            expect(shapes).toHaveLength(9);
            for (const shape of shapes) {
                expect(shape.fillShadow).toMatchObject(SHADOW);
            }
        });

        it('renders with the shadow enabled', async () => {
            chart = deproxy(await createEnterpriseChart(buildOptions(SHADOW)));
            await compare();
        });
    });

    describe('label alignment', () => {
        const ITEM_PADDING = 12;

        const buildOptions = (series: object): AgChartOptions =>
            ({
                data: EXAMPLE_OPTIONS.data,
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'year',
                        yKey: 'person',
                        colorKey: 'spending',
                        colorScale: { fills: [{ color: 'yellow' }, { color: 'red' }, { color: 'blue' }] },
                        itemPadding: ITEM_PADDING,
                        ...series,
                    },
                ],
                legend: { enabled: false },
            }) as AgChartOptions;

        // Anchor offset of the first label, relative to its cell centre, plus the padded cell span it
        // should be a fraction of and the canvas alignment carried on the same datum.
        const readAnchor = async (options: AgChartOptions) => {
            chart = deproxy(await createEnterpriseChart(options));

            const series = classCast(chart.series[0], HeatmapSeries);
            const context = series.contextNodeData;
            expect(context).toBeDefined();

            const labelDatum = context!.labelData[0];
            expect(labelDatum).toBeDefined();
            const nodeDatum = context!.nodeData.find((node) => node.datumIndex === labelDatum.datumIndex);
            expect(nodeDatum).toBeDefined();

            const anchor = {
                dx: labelDatum.x - nodeDatum!.point.x,
                dy: labelDatum.y - nodeDatum!.point.y,
                xSpan: nodeDatum!.width - 2 * ITEM_PADDING,
                ySpan: nodeDatum!.height - 2 * ITEM_PADDING,
                textAlign: labelDatum.textAlign,
                textBaseline: labelDatum.textBaseline,
            };

            chart.destroy();
            (chart as unknown) = undefined;
            return anchor;
        };

        it('anchors left, center and right to increasing x positions', async () => {
            const left = await readAnchor(buildOptions({ label: { enabled: true, textAlign: 'left' } }));
            const center = await readAnchor(buildOptions({ label: { enabled: true, textAlign: 'center' } }));
            const right = await readAnchor(buildOptions({ label: { enabled: true, textAlign: 'right' } }));

            expect(left.dx).toBeLessThan(center.dx);
            expect(center.dx).toBeLessThan(right.dx);
        });

        it('anchors top, middle and bottom to increasing y positions', async () => {
            const top = await readAnchor(buildOptions({ label: { enabled: true, verticalAlign: 'top' } }));
            const middle = await readAnchor(buildOptions({ label: { enabled: true, verticalAlign: 'middle' } }));
            const bottom = await readAnchor(buildOptions({ label: { enabled: true, verticalAlign: 'bottom' } }));

            expect(top.dy).toBeLessThan(middle.dy);
            expect(middle.dy).toBeLessThan(bottom.dy);
        });

        it('offsets the label by half the padded cell span, not its square', async () => {
            const left = await readAnchor(buildOptions({ label: { enabled: true, textAlign: 'left' } }));
            expect(left.xSpan).toBeGreaterThan(0);
            expect(left.dx).toBeCloseTo(-0.5 * left.xSpan);

            const bottom = await readAnchor(buildOptions({ label: { enabled: true, verticalAlign: 'bottom' } }));
            expect(bottom.ySpan).toBeGreaterThan(0);
            expect(bottom.dy).toBeCloseTo(0.5 * bottom.ySpan);
        });

        it('keeps the label centred by default', async () => {
            const anchor = await readAnchor(buildOptions({ label: { enabled: true } }));

            expect(anchor.dx).toBe(0);
            expect(anchor.dy).toBe(0);
            expect(anchor.textAlign).toBe('center');
            expect(anchor.textBaseline).toBe('middle');
        });

        it('carries the glyph alignment matching the anchor', async () => {
            const anchor = await readAnchor(
                buildOptions({ label: { enabled: true, textAlign: 'right', verticalAlign: 'top' } })
            );

            expect(anchor.textAlign).toBe('right');
            expect(anchor.textBaseline).toBe('top');
        });

        describe('per-cell alignment from a label styler', () => {
            const TEXT_ALIGN_BY_YEAR: Record<string, 'left' | 'center' | 'right'> = {
                '2020': 'left',
                '2021': 'center',
                '2022': 'right',
            };
            const VERTICAL_ALIGN_BY_PERSON: Record<string, 'top' | 'middle' | 'bottom'> = {
                Florian: 'top',
                Julian: 'middle',
                Martian: 'bottom',
            };
            const TEXT_ALIGN_FACTORS = { left: -0.5, center: 0, right: 0.5 };
            const VERTICAL_ALIGN_FACTORS = { top: -0.5, middle: 0, bottom: 0.5 };

            const styledOptions = () =>
                buildOptions({
                    label: {
                        enabled: true,
                        itemStyler: ({ datum }: { datum: { year: string; person: string } }) => ({
                            textAlign: TEXT_ALIGN_BY_YEAR[datum.year],
                            verticalAlign: VERTICAL_ALIGN_BY_PERSON[datum.person],
                        }),
                    },
                });

            it('anchors every cell to the alignment its styler returned', async () => {
                chart = deproxy(await createEnterpriseChart(styledOptions()));

                const context = classCast(chart.series[0], HeatmapSeries).contextNodeData;
                expect(context).toBeDefined();
                expect(context!.labelData).toHaveLength(9);

                for (const labelDatum of context!.labelData) {
                    const nodeDatum = context!.nodeData.find((node) => node.datumIndex === labelDatum.datumIndex);
                    expect(nodeDatum).toBeDefined();

                    const textAlign = TEXT_ALIGN_BY_YEAR[labelDatum.datum.year];
                    const verticalAlign = VERTICAL_ALIGN_BY_PERSON[labelDatum.datum.person];
                    expect(labelDatum.textAlign).toBe(textAlign);
                    expect(labelDatum.textBaseline).toBe(verticalAlign);
                    expect(labelDatum.x - nodeDatum!.point.x).toBeCloseTo(
                        TEXT_ALIGN_FACTORS[textAlign] * (nodeDatum!.width - 2 * ITEM_PADDING)
                    );
                    expect(labelDatum.y - nodeDatum!.point.y).toBeCloseTo(
                        VERTICAL_ALIGN_FACTORS[verticalAlign] * (nodeDatum!.height - 2 * ITEM_PADDING)
                    );
                }
            });

            it('renders the nine styled cell alignments', async () => {
                chart = deproxy(await createEnterpriseChart(styledOptions()));

                await compareImageSnapshot(chart, ctx);
            });
        });

        // `'start'`/`'end'` name a side of the paragraph, so the cell edge they anchor to has to
        // follow the chart's direction.
        describe('direction-relative alignments', () => {
            it.each([
                ['start', false, -0.5],
                ['end', false, 0.5],
                ['start', true, 0.5],
                ['end', true, -0.5],
            ] as const)('anchors %s to the %j-direction cell edge', async (textAlign, enableRtl, expectedFactor) => {
                const anchor = await readAnchor({
                    ...buildOptions({ label: { enabled: true, textAlign } }),
                    enableRtl,
                } as AgChartOptions);

                expect(anchor.dx).toBeCloseTo(expectedFactor * anchor.xSpan);
            });
        });

        // setupMockConsole() fails on any unasserted warning, so every case here must consume its deprecation notice.
        describe('deprecated top-level options', () => {
            it('warns and still applies the deprecated top-level values', async () => {
                const anchor = await readAnchor(
                    buildOptions({ label: { enabled: true }, textAlign: 'left', verticalAlign: 'bottom' })
                );

                expectWarningsCalls().toMatchInlineSnapshot(`
                  [
                    [
                      "AG Charts - Option \`series[0].textAlign\` is deprecated. Use \`label.textAlign\` instead.",
                    ],
                    [
                      "AG Charts - Option \`series[0].verticalAlign\` is deprecated. Use \`label.verticalAlign\` instead.",
                    ],
                  ]
                `);

                expect(anchor.dx).toBeCloseTo(-0.5 * anchor.xSpan);
                expect(anchor.dy).toBeCloseTo(0.5 * anchor.ySpan);
                expect(anchor.textAlign).toBe('left');
                expect(anchor.textBaseline).toBe('bottom');
            });

            it('lets label.textAlign win over the deprecated top-level value', async () => {
                const anchor = await readAnchor(
                    buildOptions({
                        label: { enabled: true, textAlign: 'right', verticalAlign: 'top' },
                        textAlign: 'left',
                        verticalAlign: 'bottom',
                    })
                );

                expectWarningsCalls().toMatchInlineSnapshot(`
                  [
                    [
                      "AG Charts - Option \`series[0].textAlign\` is deprecated. Use \`label.textAlign\` instead.",
                    ],
                    [
                      "AG Charts - Option \`series[0].verticalAlign\` is deprecated. Use \`label.verticalAlign\` instead.",
                    ],
                  ]
                `);

                expect(anchor.dx).toBeCloseTo(0.5 * anchor.xSpan);
                expect(anchor.dy).toBeCloseTo(-0.5 * anchor.ySpan);
            });
        });

        describe('rendered output', () => {
            const cases: [string, string, string][] = [
                ['left', 'middle', 'left-middle'],
                ['center', 'middle', 'center-middle'],
                ['right', 'middle', 'right-middle'],
                ['center', 'top', 'center-top'],
                ['center', 'bottom', 'center-bottom'],
            ];

            it.each(cases)('renders %s / %s within the cell', async (textAlign, verticalAlign) => {
                chart = deproxy(
                    await createEnterpriseChart(buildOptions({ label: { enabled: true, textAlign, verticalAlign } }))
                );

                await compareImageSnapshot(chart, ctx);
            });
        });
    });
    describe('cell styling', () => {
        const DATA = [
            { year: '2020', person: 'A', spending: 10 },
            { year: '2020', person: 'B', spending: 20 },
            { year: '2021', person: 'A', spending: 30 },
            { year: '2021', person: 'B', spending: 40 },
        ];
        const SHIFTED_DATA = DATA.map((d, i) => ({ ...d, spending: [40, 5, 10, 100][i] }));
        const SELECTION = { enabled: true, unselectedItem: { opacity: 0.3 }, selectedItem: { fill: 'lime' } };
        // Without the tooltip, only the series' own restyle can account for a hovered cell's style.
        const NO_TOOLTIP = { tooltip: { enabled: false } };
        const HIGHLIGHT_OFF = { ...NO_TOOLTIP, highlight: { enabled: false } };

        const buildOptions = (overrides: Record<string, unknown> = {}, data: object[] = DATA) =>
            prepareEnterpriseTestOptions({
                width: 400,
                height: 300,
                data,
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'year',
                        yKey: 'person',
                        colorKey: 'spending',
                        colorScale: { fills: [{ color: 'blue' }, { color: 'red' }] },
                        ...overrides,
                    },
                ],
                legend: { enabled: false },
            });

        const cellRects = (c: Chart) => collectShapes(classCast(c.series[0], HeatmapSeries).contentGroup);
        const cellFills = (c: Chart) => cellRects(c).map((rect) => String(rect.fill));
        const cellOpacities = (c: Chart) => cellRects(c).map((rect) => rect.fillOpacity);
        const cellStrokes = (c: Chart) =>
            cellRects(c).map((rect) => ({ stroke: rect.stroke, width: rect.strokeWidth }));

        const strokeWidths = (c: Chart) => cellStrokes(c).map(({ width }) => width);

        /** Reads a freshly created chart's cells (their fills unless `read` says otherwise), then destroys it. */
        async function freshCellFills<T = string[]>(
            options: AgChartOptions,
            read: (c: Chart) => T = cellFills as unknown as (c: Chart) => T
        ): Promise<T> {
            const reference = deproxy(AgCharts.create(options));
            await waitForChartStability(reference);
            const result = read(reference);
            reference.destroy();
            return result;
        }

        async function createStable(options: AgChartOptions) {
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
        }

        async function hoverAway() {
            await hoverAction(1, 1)(chart);
            await waitForChartStability(chart, MIN_TOOLTIP_HIDE_DELAY);
        }

        async function select(datumIndex: number) {
            const series = classCast(chart.series[0], HeatmapSeries);
            const itemId = series.data!.getItemIdFromIndex(datumIndex);
            chart.publicApi.setSelection([{ seriesId: series.id, itemId }]);
            await waitForChartStability(chart);
        }

        it('restyles every cell when the colour scale domain changes', async () => {
            await createStable(buildOptions());
            const before = cellFills(chart);
            expect(new Set(before).size).toBe(DATA.length);

            chart.publicApi.updateDelta({ data: SHIFTED_DATA });
            await waitForChartStability(chart);

            const after = cellFills(chart);
            expect(after).not.toEqual(before);
            expect(after).toEqual(await freshCellFills(buildOptions({}, SHIFTED_DATA)));
        });

        it('restyles every cell when the colour scale fills change', async () => {
            await createStable(buildOptions());
            const before = cellFills(chart);

            const colorScale = { fills: [{ color: 'green' }, { color: 'yellow' }] };
            chart.publicApi.updateDelta({ series: [{ ...buildOptions().series[0], colorScale }] });
            await waitForChartStability(chart);

            const after = cellFills(chart);
            expect(after).not.toEqual(before);
            expect(after).toEqual(await freshCellFills(buildOptions({ colorScale })));
        });

        it.each([
            { name: 'an explicit unhighlightedItem', highlight: { unhighlightedItem: { opacity: 0.4 } }, dimmed: 0.4 },
            { name: 'the theme highlight', highlight: undefined, dimmed: 0.6 },
        ])('dims the cells on hover with $name and restores them afterwards', async ({ highlight, dimmed }) => {
            await createStable(buildOptions({ ...NO_TOOLTIP, highlight }));
            const fills = cellFills(chart);
            expect(cellOpacities(chart)).toEqual([1, 1, 1, 1]);

            await hoverDatumByIndex(chart, 0, 0);
            expect(cellOpacities(chart)).toEqual([dimmed, dimmed, dimmed, dimmed]);
            expect(cellFills(chart)).toEqual(fills);

            await hoverAway();
            expect(cellOpacities(chart)).toEqual([1, 1, 1, 1]);
            expect(cellFills(chart)).toEqual(fills);
        });

        it('keeps the colour scale fills and full opacity on update and hover when highlighting is disabled', async () => {
            const options = buildOptions(HIGHLIGHT_OFF);
            await createStable(options);

            chart.publicApi.updateDelta({ data: SHIFTED_DATA });
            await waitForChartStability(chart);
            expect(cellFills(chart)).toEqual(await freshCellFills(buildOptions(HIGHLIGHT_OFF, SHIFTED_DATA)));

            await hoverDatumByIndex(chart, 0, 0);
            expect(cellOpacities(chart)).toEqual([1, 1, 1, 1]);
            expect(new Set(cellFills(chart)).size).toBe(DATA.length);
        });

        it('keeps the new colour scale fills when the domain changes during a hover and restores them after', async () => {
            await createStable(buildOptions({ ...NO_TOOLTIP, highlight: { unhighlightedItem: { opacity: 0.4 } } }));
            await hoverDatumByIndex(chart, 0, 0);

            chart.publicApi.updateDelta({ data: SHIFTED_DATA });
            await waitForChartStability(chart);

            const fills = cellFills(chart);
            expect(fills).toEqual(await freshCellFills(buildOptions({}, SHIFTED_DATA)));
            expect(new Set(fills).size).toBe(DATA.length);

            await hoverAway();
            expect(cellFills(chart)).toEqual(fills);
            expect(cellOpacities(chart)).toEqual([1, 1, 1, 1]);
        });

        it('applies the selection styles over the colour scale fill', async () => {
            await createStable(buildOptions({ selection: SELECTION }));
            const fills = cellFills(chart);

            await select(1);

            expect(cellOpacities(chart)).toEqual([0.3, 1, 0.3, 0.3]);
            expect(cellFills(chart)).toEqual(fills.map((fill, i) => (i === 1 ? 'lime' : fill)));
        });

        it('restores the colour scale styling when the selection is cleared', async () => {
            await createStable(buildOptions({ selection: SELECTION }));
            const fills = cellFills(chart);

            await select(1);
            expect(cellFills(chart)).not.toEqual(fills);

            chart.publicApi.setSelection([]);
            await waitForChartStability(chart);
            expect(cellFills(chart)).toEqual(fills);
            expect(cellOpacities(chart)).toEqual([1, 1, 1, 1]);
        });

        it('styles each cell once per update when only the colour scale colours the cells', async () => {
            await createStable(buildOptions());
            const getItemStyle = vi.spyOn(HeatmapSeries.prototype as any, 'getItemStyle');

            try {
                chart.publicApi.updateDelta({ data: SHIFTED_DATA });
                await waitForChartStability(chart);

                expect(getItemStyle).toHaveBeenCalledTimes(DATA.length);
            } finally {
                getItemStyle.mockRestore();
            }
        });

        it('applies an itemStyler over the colour scale fill and follows a domain change', async () => {
            const itemStyler = ({ datum }: { datum: { year: string; person: string } }) =>
                datum.person === 'A' ? { stroke: 'black', strokeWidth: 3 } : {};

            await createStable(buildOptions({ itemStyler }));
            const strokes = cellStrokes(chart);
            expect(strokes.filter(({ width }) => width === 3)).toHaveLength(2);

            chart.publicApi.updateDelta({ data: SHIFTED_DATA });
            await waitForChartStability(chart);

            expect(cellFills(chart)).toEqual(await freshCellFills(buildOptions({ itemStyler }, SHIFTED_DATA)));
            expect(cellStrokes(chart)).toEqual(strokes);
        });

        it('applies an itemStyler that depends on the highlight state and drops it when the pointer leaves', async () => {
            const itemStyler = ({ highlightState }: { highlightState: string }) =>
                highlightState === 'unhighlighted-item' ? { strokeWidth: 5 } : {};
            await createStable(buildOptions({ ...NO_TOOLTIP, itemStyler }));
            const before = cellStrokes(chart);

            await hoverDatumByIndex(chart, 0, 0);
            expect(cellStrokes(chart)).not.toEqual(before);

            await hoverAway();
            expect(cellStrokes(chart)).toEqual(before);
        });

        it('re-evaluates an itemStyler on an update that leaves the data and options alone', async () => {
            let strokeWidth = 1;
            const itemStyler = () => ({ strokeWidth });
            const options = buildOptions({ itemStyler });
            await createStable(options);
            expect(cellStrokes(chart).map(({ width }) => width)).toEqual([1, 1, 1, 1]);

            strokeWidth = 4;
            chart.publicApi.update(options);
            await waitForChartStability(chart);

            expect(cellStrokes(chart).map(({ width }) => width)).toEqual([4, 4, 4, 4]);
        });

        it('fills cells without a colour value with missingDataFill and restyles them on update', async () => {
            const missingDataFill = '#cccccc';
            const colorScale = { fills: [{ color: 'blue' }, { color: 'red' }], missingDataFill };
            const withGap = DATA.map((d, i) => (i === 1 ? { ...d, spending: undefined } : d));

            await createStable(buildOptions({ colorScale }, withGap));
            expect(cellFills(chart).filter((f) => f === missingDataFill)).toHaveLength(1);

            chart.publicApi.updateDelta({ data: DATA });
            await waitForChartStability(chart);
            expect(cellFills(chart)).not.toContain(missingDataFill);
            expect(cellFills(chart)).toEqual(await freshCellFills(buildOptions({ colorScale })));
        });

        describe('itemStyler results', () => {
            type StylerParams = AgHeatmapSeriesItemStylerParams<(typeof DATA)[number]>;
            // Six distinct results (more than any small result memory holds) in an order that revisits the early ones.
            const MANY_DATA = [10, 20, 30, 40, 50, 60, 10, 30, 60, 20, 50, 40].map((spending, i) => ({
                year: `${2000 + i}`,
                person: 'A',
                spending,
            }));
            it('gives every cell the result its own datum produced, across more distinct results than a small memory holds', async () => {
                const itemStyler = ({ datum }: StylerParams) => ({
                    stroke: 'black',
                    strokeWidth: datum.spending / 10,
                });
                await createStable(buildOptions({ itemStyler }, MANY_DATA));

                expect(strokeWidths(chart)).toEqual(MANY_DATA.map((d) => d.spending / 10));
            });

            it('gives every cell its own result when the styler alternates between two results', async () => {
                const data = Array.from({ length: 12 }, (_, i) => ({ year: `${2000 + i}`, person: 'A', spending: i }));
                const itemStyler = ({ datum }: StylerParams) =>
                    datum.spending % 2 === 0 ? { strokeWidth: 2, stroke: 'black' } : { strokeWidth: 7, stroke: 'red' };
                await createStable(buildOptions({ itemStyler }, data));

                expect(cellStrokes(chart)).toEqual(
                    data.map((d) =>
                        d.spending % 2 === 0 ? { stroke: 'black', width: 2 } : { stroke: 'red', width: 7 }
                    )
                );
            });

            it('does not let a styler that reuses and mutates one returned object leak between cells', async () => {
                const shared: { strokeWidth?: number } = {};
                const itemStyler = ({ datum }: StylerParams) => {
                    shared.strokeWidth = datum.spending / 10;
                    return shared;
                };
                await createStable(buildOptions({ itemStyler }));

                expect(strokeWidths(chart)).toEqual(DATA.map((d) => d.spending / 10));
            });

            it('keeps the colour scale fill for undefined result values and for cells whose styler returns nothing', async () => {
                const unstyled = await freshCellFills(buildOptions());
                const unstyledWidths = await freshCellFills(buildOptions(), strokeWidths);

                const itemStyler = ({ datum }: StylerParams) =>
                    datum.person === 'A' ? { fill: undefined, strokeWidth: 6 } : undefined;
                await createStable(buildOptions({ itemStyler }));

                expect(cellFills(chart)).toEqual(unstyled);
                expect(strokeWidths(chart)).toEqual(DATA.map((d, i) => (d.person === 'A' ? 6 : unstyledWidths[i])));
            });

            it('lets a styler fill replace the colour scale fill only on the cells it styles', async () => {
                const unstyled = await freshCellFills(buildOptions());

                const itemStyler = ({ datum }: StylerParams) => (datum.spending >= 30 ? { fill: 'lime' } : {});
                await createStable(buildOptions({ itemStyler }));

                expect(cellFills(chart)).toEqual(DATA.map((d, i) => (d.spending >= 30 ? 'lime' : unstyled[i])));
            });

            it('merges a gradient fill from the styler into the selected cell gradient rather than replacing it', async () => {
                const selectedGradient = {
                    type: 'gradient',
                    gradient: 'linear',
                    rotation: 45,
                    colorStops: [{ color: 'white' }, { color: 'black' }],
                };
                const stylerGradient = {
                    type: 'gradient',
                    gradient: 'linear',
                    colorStops: [{ color: 'red' }, { color: 'blue' }],
                };
                const itemStyler = ({ datum }: StylerParams) =>
                    datum.person === 'A' ? { fill: stylerGradient } : { strokeWidth: 2 };
                const selection = {
                    enabled: true,
                    selectedItem: { fill: selectedGradient },
                };
                await createStable(buildOptions({ selection, itemStyler }));
                const fills = cellRects(chart).map((rect) => rect.fill);

                await select(0);

                // The styler's stops win, and the properties it leaves out (the rotation) come from the selection.
                expect(cellRects(chart)[0].fill).toMatchObject({ ...stylerGradient, rotation: 45 });
                // A cell that is not selected keeps its own styler fill; the styler gradient replaces a plain fill.
                expect(cellRects(chart)[2].fill).toEqual(fills[2]);
                expect(cellRects(chart)[2].fill).toMatchObject(stylerGradient);
            });

            it('applies each cell its own opacity result alongside the shared stroke values', async () => {
                const itemStyler = ({ datum }: StylerParams) => ({
                    stroke: 'black',
                    strokeWidth: 1,
                    fillOpacity: datum.spending / 100,
                });
                await createStable(buildOptions({ itemStyler }));

                expect(cellOpacities(chart)).toEqual(DATA.map((d) => d.spending / 100));
            });

            it('keeps the node and highlight results of the same cell apart while hovering', async () => {
                const STROKE_WIDTH_BY_STATE: Record<string, number> = {
                    'highlighted-item': 9,
                    'unhighlighted-item': 7,
                };
                const itemStyler = vi.fn(({ highlightState }: StylerParams) => ({
                    strokeWidth: STROKE_WIDTH_BY_STATE[highlightState as string] ?? 2,
                }));
                const highlightWidths = () =>
                    collectShapes(classCast(chart.series[0], HeatmapSeries).highlightGroup).map((r) => r.strokeWidth);
                await createStable(buildOptions({ ...NO_TOOLTIP, itemStyler }));
                expect(itemStyler).toHaveBeenCalledTimes(DATA.length);
                expect(strokeWidths(chart)).toEqual([2, 2, 2, 2]);

                itemStyler.mockClear();
                await hoverDatumByIndex(chart, 0, 1);

                // Every cell, the hovered one included, keeps its own node result under the highlight copy.
                expect(strokeWidths(chart)).toEqual([7, 7, 7, 7]);
                expect(highlightWidths()).toEqual([9]);
                const states = itemStyler.mock.calls.map(([params]) => params.highlightState);
                expect(states.filter((s) => s === 'highlighted-item')).toHaveLength(1);
                expect(states.filter((s) => s === 'unhighlighted-item')).toHaveLength(DATA.length);

                await hoverAway();
                expect(strokeWidths(chart)).toEqual([2, 2, 2, 2]);
            });

            it('resolves each distinct flat result once, and again after an update clears the memory', async () => {
                const data = Array.from({ length: 12 }, (_, i) => ({ year: `${2000 + i}`, person: 'A', spending: i }));
                const itemStyler = ({ datum }: StylerParams) => ({ strokeWidth: 1 + (datum.spending % 3) });
                const options = buildOptions({ itemStyler }, data);
                await createStable(options);

                const { optionsGraphService } = chart.series[0].ctx;
                const resolvePartial = vi.spyOn(optionsGraphService, 'resolvePartial');
                const resolvedStylerResults = () =>
                    resolvePartial.mock.calls.filter(([, value]) => Object.keys(value ?? {}).includes('strokeWidth'));

                try {
                    chart.publicApi.update(options);
                    await waitForChartStability(chart);
                    expect(strokeWidths(chart)).toEqual(data.map((d) => 1 + (d.spending % 3)));
                    expect(resolvedStylerResults()).toHaveLength(3);

                    resolvePartial.mockClear();
                    chart.publicApi.update(options);
                    await waitForChartStability(chart);
                    expect(resolvedStylerResults()).toHaveLength(3);
                } finally {
                    resolvePartial.mockRestore();
                }
            });

            it('warns once about an invalid result value and still applies the valid properties', async () => {
                const itemStyler = ({ datum }: StylerParams) =>
                    datum.person === 'A' ? { strokeWidth: 'thick', stroke: 'black' } : { strokeWidth: 5 };
                const unstyled = await freshCellFills(buildOptions(), strokeWidths);

                await createStable(buildOptions({ itemStyler }));
                expect(strokeWidths(chart)).toEqual(DATA.map((d, i) => (d.person === 'A' ? unstyled[i] : 5)));
                expectWarningsCalls().toMatchInlineSnapshot(`
                  [
                    [
                      "AG Charts - Callback \`series[0].itemStyler\` returned an invalid property \`series[0].itemStyler.strokeWidth\`: \`"thick"\`; expecting a number greater than or equal to 0, ignoring.",
                    ],
                  ]
                `);
            });

            it('warns about an unknown result property', async () => {
                const itemStyler = () => ({ strokeWidth: 3, notAnOption: 1 });
                await createStable(buildOptions({ itemStyler }));

                expect(strokeWidths(chart)).toEqual([3, 3, 3, 3]);
                expectWarningsCalls().toMatchInlineSnapshot(`
                  [
                    [
                      "AG Charts - Callback \`series[0].itemStyler\` returned an unknown property \`series[0].itemStyler.notAnOption\`, ignoring.",
                    ],
                  ]
                `);
            });
        });

        it('keeps the colour scale fill in the tooltip symbol', async () => {
            await createStable(buildOptions());

            const series = classCast(chart.series[0], HeatmapSeries);
            const content = series.getTooltipContent(2);
            expect(content).toMatchObject({ type: 'structured', symbol: { marker: { fill: cellFills(chart)[2] } } });
        });
    });
});
