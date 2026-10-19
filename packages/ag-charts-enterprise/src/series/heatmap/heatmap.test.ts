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
    pressKey,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    tabIntoChart,
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
            chart = await createEnterpriseChart(buildOptions(SHADOW));
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
                chart = await createEnterpriseChart(styledOptions());

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

        const rawOptions = (overrides: Record<string, unknown> = {}, data: object[] = DATA) => ({
            width: 400,
            height: 300,
            data,
            series: [
                {
                    type: 'heatmap' as const,
                    xKey: 'year',
                    yKey: 'person',
                    colorKey: 'spending',
                    colorScale: { fills: [{ color: 'blue' }, { color: 'red' }] },
                    ...overrides,
                },
            ],
            legend: { enabled: false },
        });

        // Prepared for the updates that replay options onto a chart the factory has already prepared.
        const buildOptions = (...args: Parameters<typeof rawOptions>) =>
            prepareEnterpriseTestOptions(rawOptions(...args));

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
            const reference = deproxy(await createEnterpriseChart(options));
            const result = read(reference);
            reference.destroy();
            return result;
        }

        async function createStable(options: AgChartOptions) {
            chart = deproxy(await createEnterpriseChart(options));
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
            await createStable(rawOptions());
            const before = cellFills(chart);
            expect(new Set(before).size).toBe(DATA.length);

            chart.publicApi.updateDelta({ data: SHIFTED_DATA });
            await waitForChartStability(chart);

            const after = cellFills(chart);
            expect(after).not.toEqual(before);
            expect(after).toEqual(await freshCellFills(rawOptions({}, SHIFTED_DATA)));
        });

        it('restyles every cell when the colour scale fills change', async () => {
            await createStable(rawOptions());
            const before = cellFills(chart);

            const colorScale = { fills: [{ color: 'green' }, { color: 'yellow' }] };
            chart.publicApi.updateDelta({ series: [{ ...buildOptions().series[0], colorScale }] });
            await waitForChartStability(chart);

            const after = cellFills(chart);
            expect(after).not.toEqual(before);
            expect(after).toEqual(await freshCellFills(rawOptions({ colorScale })));
        });

        it.each([
            { name: 'an explicit unhighlightedItem', highlight: { unhighlightedItem: { opacity: 0.4 } }, dimmed: 0.4 },
            { name: 'the theme highlight', highlight: undefined, dimmed: 0.6 },
        ])('dims the cells on hover with $name and restores them afterwards', async ({ highlight, dimmed }) => {
            await createStable(rawOptions({ ...NO_TOOLTIP, highlight }));
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
            const options = rawOptions(HIGHLIGHT_OFF);
            await createStable(options);

            chart.publicApi.updateDelta({ data: SHIFTED_DATA });
            await waitForChartStability(chart);
            expect(cellFills(chart)).toEqual(await freshCellFills(rawOptions(HIGHLIGHT_OFF, SHIFTED_DATA)));

            await hoverDatumByIndex(chart, 0, 0);
            expect(cellOpacities(chart)).toEqual([1, 1, 1, 1]);
            expect(new Set(cellFills(chart)).size).toBe(DATA.length);
        });

        it('keeps the new colour scale fills when the domain changes during a hover and restores them after', async () => {
            await createStable(rawOptions({ ...NO_TOOLTIP, highlight: { unhighlightedItem: { opacity: 0.4 } } }));
            await hoverDatumByIndex(chart, 0, 0);

            chart.publicApi.updateDelta({ data: SHIFTED_DATA });
            await waitForChartStability(chart);

            const fills = cellFills(chart);
            expect(fills).toEqual(await freshCellFills(rawOptions({}, SHIFTED_DATA)));
            expect(new Set(fills).size).toBe(DATA.length);

            await hoverAway();
            expect(cellFills(chart)).toEqual(fills);
            expect(cellOpacities(chart)).toEqual([1, 1, 1, 1]);
        });

        it('applies the selection styles over the colour scale fill', async () => {
            await createStable(rawOptions({ selection: SELECTION }));
            const fills = cellFills(chart);

            await select(1);

            expect(cellOpacities(chart)).toEqual([0.3, 1, 0.3, 0.3]);
            expect(cellFills(chart)).toEqual(fills.map((fill, i) => (i === 1 ? 'lime' : fill)));
        });

        it('restores the colour scale styling when the selection is cleared', async () => {
            await createStable(rawOptions({ selection: SELECTION }));
            const fills = cellFills(chart);

            await select(1);
            expect(cellFills(chart)).not.toEqual(fills);

            chart.publicApi.setSelection([]);
            await waitForChartStability(chart);
            expect(cellFills(chart)).toEqual(fills);
            expect(cellOpacities(chart)).toEqual([1, 1, 1, 1]);
        });

        it('styles each cell once per update when only the colour scale colours the cells', async () => {
            await createStable(rawOptions());
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

            await createStable(rawOptions({ itemStyler }));
            const strokes = cellStrokes(chart);
            expect(strokes.filter(({ width }) => width === 3)).toHaveLength(2);

            chart.publicApi.updateDelta({ data: SHIFTED_DATA });
            await waitForChartStability(chart);

            expect(cellFills(chart)).toEqual(await freshCellFills(rawOptions({ itemStyler }, SHIFTED_DATA)));
            expect(cellStrokes(chart)).toEqual(strokes);
        });

        it('applies an itemStyler that depends on the highlight state and drops it when the pointer leaves', async () => {
            const itemStyler = ({ highlightState }: { highlightState: string }) =>
                highlightState === 'unhighlighted-item' ? { strokeWidth: 5 } : {};
            await createStable(rawOptions({ ...NO_TOOLTIP, itemStyler }));
            const before = cellStrokes(chart);

            await hoverDatumByIndex(chart, 0, 0);
            expect(cellStrokes(chart)).not.toEqual(before);

            await hoverAway();
            expect(cellStrokes(chart)).toEqual(before);
        });

        it('re-evaluates an itemStyler on an update that leaves the data and options alone', async () => {
            let strokeWidth = 1;
            const itemStyler = () => ({ strokeWidth });
            const options = rawOptions({ itemStyler });
            await createStable(options);
            prepareEnterpriseTestOptions(options);
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

            await createStable(rawOptions({ colorScale }, withGap));
            expect(cellFills(chart).filter((f) => f === missingDataFill)).toHaveLength(1);

            chart.publicApi.updateDelta({ data: DATA });
            await waitForChartStability(chart);
            expect(cellFills(chart)).not.toContain(missingDataFill);
            expect(cellFills(chart)).toEqual(await freshCellFills(rawOptions({ colorScale })));
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
                await createStable(rawOptions({ itemStyler }, MANY_DATA));

                expect(strokeWidths(chart)).toEqual(MANY_DATA.map((d) => d.spending / 10));
            });

            it('gives every cell its own result when the styler alternates between two results', async () => {
                const data = Array.from({ length: 12 }, (_, i) => ({ year: `${2000 + i}`, person: 'A', spending: i }));
                const itemStyler = ({ datum }: StylerParams) =>
                    datum.spending % 2 === 0 ? { strokeWidth: 2, stroke: 'black' } : { strokeWidth: 7, stroke: 'red' };
                await createStable(rawOptions({ itemStyler }, data));

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
                await createStable(rawOptions({ itemStyler }));

                expect(strokeWidths(chart)).toEqual(DATA.map((d) => d.spending / 10));
            });

            it('keeps the colour scale fill for undefined result values and for cells whose styler returns nothing', async () => {
                const unstyled = await freshCellFills(rawOptions());
                const unstyledWidths = await freshCellFills(rawOptions(), strokeWidths);

                const itemStyler = ({ datum }: StylerParams) =>
                    datum.person === 'A' ? { fill: undefined, strokeWidth: 6 } : undefined;
                await createStable(rawOptions({ itemStyler }));

                expect(cellFills(chart)).toEqual(unstyled);
                expect(strokeWidths(chart)).toEqual(DATA.map((d, i) => (d.person === 'A' ? 6 : unstyledWidths[i])));
            });

            it('lets a styler fill replace the colour scale fill only on the cells it styles', async () => {
                const unstyled = await freshCellFills(rawOptions());

                const itemStyler = ({ datum }: StylerParams) => (datum.spending >= 30 ? { fill: 'lime' } : {});
                await createStable(rawOptions({ itemStyler }));

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
                await createStable(rawOptions({ selection, itemStyler }));
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
                await createStable(rawOptions({ itemStyler }));

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
                await createStable(rawOptions({ ...NO_TOOLTIP, itemStyler }));
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
                const options = rawOptions({ itemStyler }, data);
                await createStable(options);
                prepareEnterpriseTestOptions(options);

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
                const unstyled = await freshCellFills(rawOptions(), strokeWidths);

                await createStable(rawOptions({ itemStyler }));
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
                await createStable(rawOptions({ itemStyler }));

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
            await createStable(rawOptions());

            const series = classCast(chart.series[0], HeatmapSeries);
            const content = series.getTooltipContent(2);
            expect(content).toMatchObject({ type: 'structured', symbol: { marker: { fill: cellFills(chart)[2] } } });
        });

        /** Counts every canvas `fillRect` and path `fill` the chart makes during `act`, so compare against a baseline. */
        async function countFills(act: () => Promise<void>) {
            const proto = Object.getPrototypeOf(ctx.getRenderContext2D());
            const fillRect = vi.spyOn(proto, 'fillRect');
            const fill = vi.spyOn(proto, 'fill');
            try {
                await act();
                return { rects: fillRect.mock.calls.length, paths: fill.mock.calls.length };
            } finally {
                fillRect.mockRestore();
                fill.mockRestore();
            }
        }

        const repaint = async () => {
            chart.publicApi.updateDelta({ data: SHIFTED_DATA });
            await waitForChartStability(chart);
        };

        it('repaints the cells in their new colours without rebuilding their paths', async () => {
            await createStable(rawOptions());
            const before = cellFills(chart);
            const updatePaths = cellRects(chart).map((rect) => vi.spyOn(rect as Rect, 'updatePath'));
            const updated = () => updatePaths.filter((spy) => spy.mock.calls.length > 0).length;

            chart.publicApi.updateDelta({ data: SHIFTED_DATA });
            await waitForChartStability(chart);

            expect(cellFills(chart)).not.toEqual(before);
            expect(updatePaths).toHaveLength(DATA.length);
            expect(updated()).toBe(0);

            // A change of layout still rebuilds them.
            chart.publicApi.updateDelta({ data: [...SHIFTED_DATA, { year: '2022', person: 'A', spending: 50 }] });
            await waitForChartStability(chart);
            expect(updated()).toBeGreaterThan(0);
        });

        it('paints plain cells with a fillRect each, and cells that need a path through it', async () => {
            const fills: Record<string, { rects: number; paths: number }> = {};
            const variants = {
                plain: {},
                rounded: { cornerRadius: 4 },
                stroked: { stroke: 'black', strokeWidth: 2 },
                shadowed: { shadow: SHADOW },
            };
            for (const [name, overrides] of Object.entries(variants)) {
                await createStable(rawOptions(overrides));
                fills[name] = await countFills(repaint);
                chart.destroy();
            }

            expect(fills.plain.rects - fills.rounded.rects).toBe(DATA.length);
            expect(fills.rounded.paths - fills.plain.paths).toBe(DATA.length);
            expect(fills.stroked.rects).toBe(fills.rounded.rects);
            expect(fills.shadowed.rects).toBe(fills.rounded.rects);
        });

        /** The rects the chart fills apart from its cells and the highlighted cell, by a hover over rounded cells. */
        async function nonCellRects(highlight: object) {
            await createStable(rawOptions({ ...NO_TOOLTIP, cornerRadius: 4, highlight }));
            const { rects } = await countFills(() => hoverDatumByIndex(chart, 0, 1));
            chart.destroy();
            return rects;
        }

        it('paints the highlight of a cell through its path and leaves the other cells painting directly', async () => {
            const highlight = {
                highlightedItem: { stroke: 'black', strokeWidth: 3 },
                unhighlightedItem: { opacity: 0.4 },
            };
            const others = await nonCellRects(highlight);
            await createStable(rawOptions({ ...NO_TOOLTIP, highlight }));
            const series = classCast(chart.series[0], HeatmapSeries);

            const { rects } = await countFills(() => hoverDatumByIndex(chart, 0, 1));

            const highlighted = collectShapes(series.highlightNodeGroup).filter((shape) => shape.visible);
            expect(highlighted).toHaveLength(1);
            expect(highlighted[0]).toMatchObject({ stroke: 'black', strokeWidth: 3 });
            expect(rects).toBe(others + DATA.length);
        });

        it('paints cells that a highlight strokes through their path and back to a direct fill once it ends', async () => {
            const highlight = { unhighlightedItem: { stroke: 'black', strokeWidth: 3 } };
            const others = await nonCellRects(highlight);
            await createStable(rawOptions({ ...NO_TOOLTIP, highlight }));
            const fills = cellFills(chart);

            // Only the plain highlight node is filled directly.
            const hovered = await countFills(() => hoverDatumByIndex(chart, 0, 1));
            expect(cellStrokes(chart)).toEqual(Array(DATA.length).fill({ stroke: 'black', width: 3 }));
            expect(hovered.rects).toBe(others + 1);

            const away = await countFills(hoverAway);
            expect(cellStrokes(chart).map((style) => style.width)).toEqual([0, 0, 0, 0]);
            expect(away.rects).toBe(others + DATA.length);
            expect(cellFills(chart)).toEqual(fills);
        });

        it('picks, highlights and shows the tooltip of the cell under the pointer after a repaint', async () => {
            await createStable(rawOptions());
            chart.publicApi.updateDelta({ data: SHIFTED_DATA });
            await waitForChartStability(chart);

            await hoverDatumByIndex(chart, 0, 3);

            expect(isTooltipVisible(chart)).toBe(true);
            expect((chart as Chart).ctx.highlightManager.getActiveHighlight()?.datumIndex).toBe(3);
        });

        it('keeps keyboard navigation and labels working after a repaint', async () => {
            await createStable(rawOptions({ label: { enabled: true } }));
            chart.publicApi.updateDelta({ data: SHIFTED_DATA });
            await waitForChartStability(chart);

            const labels = () =>
                collectShapes(classCast(chart.series[0], HeatmapSeries).labelGroup).map(
                    (shape) => (shape as { text?: string }).text
                );
            expect(labels().sort((a, b) => String(a).localeCompare(String(b)))).toEqual(['10', '100', '40', '5']);

            const highlightedIndex = () => (chart as Chart).ctx.highlightManager.getActiveHighlight()?.datumIndex;
            await tabIntoChart(chart);
            await pressKey(chart, 'ArrowRight');
            expect(highlightedIndex()).toBe(1);
            await pressKey(chart, 'ArrowRight');
            expect(highlightedIndex()).toBe(2);
            expect(isTooltipVisible(chart)).toBe(true);
        });
    });

    describe('applyTransaction', () => {
        type Cell = { id: string; x: string; y: string; v: number | null };

        const GRID: Cell[] = [];
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 3; y++) {
                GRID.push({ id: `${x}:${y}`, x: `X${x}`, y: `Y${y}`, v: x * 3 + y });
            }
        }
        const UPDATED = (id: string, v: number | null, move?: Partial<Cell>): Cell => ({
            ...GRID.find((cell) => cell.id === id)!,
            v,
            ...move,
        });
        const NO_TOOLTIP = { tooltip: { enabled: false } };

        const rawOptions = (data: Cell[], series: Record<string, unknown> = {}) => ({
            width: 400,
            height: 300,
            data,
            dataIdKey: 'id',
            series: [
                {
                    type: 'heatmap' as const,
                    xKey: 'x',
                    yKey: 'y',
                    colorKey: 'v',
                    colorScale: { fills: [{ color: 'blue' }, { color: 'red' }] },
                    ...series,
                },
            ],
            legend: { enabled: false },
        });

        // Prepared for the updates that replay options onto a chart the factory has already prepared.
        const buildOptions = (...args: Parameters<typeof rawOptions>) =>
            prepareEnterpriseTestOptions(rawOptions(...args));

        const heatmap = (c: Chart) => classCast(c.series[0], HeatmapSeries);
        const rects = (c: Chart) => collectShapes(heatmap(c).contentGroup) as Rect[];
        const cells = (c: Chart) =>
            rects(c).map((rect) => ({
                fill: String(rect.fill),
                opacity: rect.fillOpacity,
                stroke: rect.stroke,
                strokeWidth: rect.strokeWidth,
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
            }));

        async function create(data: Cell[], series: Record<string, unknown> = {}) {
            chart = deproxy(await createEnterpriseChart(rawOptions(data, series) as AgChartOptions));
        }

        async function transact(transaction: { update?: Cell[]; add?: Cell[]; remove?: { id: string }[] }) {
            await chart.publicApi.applyTransaction(transaction);
            await waitForChartStability(chart);
        }

        async function freshCells(data: Cell[], series: Record<string, unknown> = {}) {
            const reference = deproxy(await createEnterpriseChart(rawOptions(data, series) as AgChartOptions));
            const result = cells(reference);
            reference.destroy();
            return result;
        }

        const withUpdates = (...updates: Cell[]) =>
            GRID.map((cell) => updates.find((update) => update.id === cell.id) ?? cell);

        function spyOnCellRebuilds() {
            const prototype = HeatmapSeries.prototype as any;
            const datums = vi.spyOn(prototype, 'updateNodeDatum');
            const styles = vi.spyOn(prototype, 'getItemStyle');
            return {
                datums,
                styles,
                restore() {
                    datums.mockRestore();
                    styles.mockRestore();
                },
            };
        }

        // Asserts that only the updated cells' datums were rebuilt, so a test that uses it is on the incremental path.
        async function transactIncrementally(update: Cell[]) {
            expect(update.length).toBeLessThan(GRID.length);
            const spy = spyOnCellRebuilds();
            try {
                await transact({ update });
                expect(spy.datums).toHaveBeenCalledTimes(update.length);
            } finally {
                spy.restore();
            }
        }

        it('rebuilds and restyles only the updated cell', async () => {
            await create(GRID);
            const before = cells(chart);
            const nodes = rects(chart);
            const spy = spyOnCellRebuilds();

            try {
                await transact({ update: [UPDATED('1:1', 7)] });

                expect(spy.datums).toHaveBeenCalledTimes(1);
                expect(spy.styles).toHaveBeenCalledTimes(1);
            } finally {
                spy.restore();
            }

            const after = cells(chart);
            expect(after).not.toEqual(before);
            expect(after).toEqual(await freshCells(withUpdates(UPDATED('1:1', 7))));
            expect(rects(chart).every((rect, i) => rect === nodes[i])).toBe(true);
        });

        it('rebuilds every updated cell, and only those', async () => {
            await create(GRID);
            const spy = spyOnCellRebuilds();
            const updates = [UPDATED('0:1', 4), UPDATED('2:1', 8), UPDATED('3:1', 6)];

            try {
                await transact({ update: updates });

                expect(spy.datums).toHaveBeenCalledTimes(updates.length);
                expect(spy.styles).toHaveBeenCalledTimes(updates.length);
            } finally {
                spy.restore();
            }

            expect(cells(chart)).toEqual(await freshCells(withUpdates(...updates)));
        });

        it('restyles every cell when the update moves the colour domain', async () => {
            await create(GRID);
            const before = cells(chart);
            const spy = spyOnCellRebuilds();

            try {
                await transact({ update: [UPDATED('1:1', 100)] });

                expect(spy.styles).toHaveBeenCalledTimes(GRID.length);
            } finally {
                spy.restore();
            }

            const after = cells(chart);
            expect(after.map((cell) => cell.fill)).not.toEqual(before.map((cell) => cell.fill));
            expect(after).toEqual(await freshCells(withUpdates(UPDATED('1:1', 100))));
        });

        it('restyles every cell when the update removes the only extreme value', async () => {
            await create(GRID);
            await transact({ update: [UPDATED('3:2', 1)] });

            expect(cells(chart)).toEqual(await freshCells(withUpdates(UPDATED('3:2', 1))));
        });

        it('repositions a cell that the update moves to another category', async () => {
            await create(GRID);
            const moved = UPDATED('1:1', 7, { x: 'X3', y: 'Y0' });
            await transact({ update: [moved] });

            expect(cells(chart)).toEqual(await freshCells(withUpdates(moved)));
        });

        it('rebuilds the layout when the update introduces a category', async () => {
            await create(GRID);
            const moved = UPDATED('1:1', 7, { x: 'X9' });
            const spy = spyOnCellRebuilds();

            try {
                await transact({ update: [moved] });

                expect(spy.datums).toHaveBeenCalledTimes(GRID.length);
            } finally {
                spy.restore();
            }

            expect(cells(chart)).toEqual(await freshCells(withUpdates(moved)));
        });

        it('follows added and removed cells', async () => {
            await create(GRID);
            const added: Cell = { id: '4:0', x: 'X4', y: 'Y0', v: 5 };
            await transact({ add: [added], remove: [{ id: '0:0' }] });

            const expected = [...GRID.filter((cell) => cell.id !== '0:0'), added];
            expect(cells(chart)).toEqual(await freshCells(expected));
        });

        it('keeps up with a sequence of transactions', async () => {
            await create(GRID);
            const first = UPDATED('0:1', 9);
            const second = UPDATED('3:0', 2);
            await transact({ update: [first] });
            await transact({ update: [second] });
            await transact({ update: [UPDATED('0:1', 10)] });

            expect(cells(chart)).toEqual(await freshCells(withUpdates(UPDATED('0:1', 10), second)));
        });

        it('rebuilds every cell when an options change follows a transaction', async () => {
            await create(GRID);
            await transact({ update: [UPDATED('1:1', 7)] });
            const data = withUpdates(UPDATED('1:1', 7));
            const series = { cornerRadius: 6, colorScale: { fills: [{ color: 'green' }, { color: 'orange' }] } };

            chart.publicApi.update(buildOptions(data, series));
            await waitForChartStability(chart);

            expect(cells(chart)).toEqual(await freshCells(data, series));
        });

        it('rebuilds every cell when the chart resizes after a transaction', async () => {
            await create(GRID);
            await transact({ update: [UPDATED('1:1', 7)] });

            chart.publicApi.updateDelta({ width: 300, height: 200 });
            await waitForChartStability(chart);

            // Bespoke: the size is set after preparation, which the factory would overwrite with the default canvas size.
            const reference = deproxy(
                AgCharts.create({ ...buildOptions(withUpdates(UPDATED('1:1', 7))), width: 300, height: 200 })
            );
            await waitForChartStability(reference);
            const expected = cells(reference);
            reference.destroy();
            expect(cells(chart)).toEqual(expected);
        });

        it('re-evaluates an itemStyler for the updated cell only', async () => {
            const stylerCalls: string[] = [];
            const itemStyler = ({ datum }: { datum: Cell }) => {
                stylerCalls.push(datum.id);
                return (datum.v ?? 0) > 6 ? { stroke: 'black', strokeWidth: 3 } : {};
            };
            await create(GRID, { itemStyler });
            const strokeWidths = () => cells(chart).map((cell) => cell.strokeWidth);
            const before = strokeWidths();

            // Both values stay inside the 0..11 extent, so each transaction takes the incremental path.
            stylerCalls.length = 0;
            await transactIncrementally([UPDATED('1:1', 8)]);
            expect(new Set(stylerCalls)).toEqual(new Set(['1:1']));

            stylerCalls.length = 0;
            await transactIncrementally([UPDATED('2:1', 3)]);
            expect(new Set(stylerCalls)).toEqual(new Set(['2:1']));

            const data = withUpdates(UPDATED('1:1', 8), UPDATED('2:1', 3));
            expect(strokeWidths()).not.toEqual(before);
            expect(cells(chart)).toEqual(await freshCells(data, { itemStyler }));
        });

        it('restyles an itemStyler from the new data indices when a transaction removes a cell', async () => {
            const itemStyler = ({ datum }: { datum: Cell }) => ((datum.v ?? 0) > 6 ? { fill: 'green' } : {});
            await create(GRID, { itemStyler });

            await transact({ remove: [{ id: '0:0' }] });

            expect(cells(chart)).toEqual(await freshCells(GRID.slice(1), { itemStyler }));
        });

        it('restyles an itemStyler that reads the fill when a transaction moves the colour domain', async () => {
            const itemStyler = ({ fill }: { fill: string }) => ({ stroke: fill });
            await create(GRID, { itemStyler });

            // 50 lies outside the 0..11 extent, so every cell's fill, and the stroke taken from it, changes.
            await transact({ update: [UPDATED('3:2', 50)] });

            expect(cells(chart)).toEqual(await freshCells(withUpdates(UPDATED('3:2', 50)), { itemStyler }));
        });

        it('keeps the highlight styling of a hovered cell while another cell updates', async () => {
            const series = { ...NO_TOOLTIP, highlight: { unhighlightedItem: { opacity: 0.4 } } };
            await create(GRID, series);
            await hoverDatumByIndex(chart, 0, 0);
            expect(cells(chart).map((cell) => cell.opacity)).toEqual(Array(GRID.length).fill(0.4));

            await transact({ update: [UPDATED('2:2', 5)] });

            expect(cells(chart).map((cell) => cell.opacity)).toEqual(Array(GRID.length).fill(0.4));

            await hoverAction(1, 1)(chart);
            await waitForChartStability(chart, MIN_TOOLTIP_HIDE_DELAY);
            expect(cells(chart)).toEqual(await freshCells(withUpdates(UPDATED('2:2', 5)), series));
        });

        it('rebuilds only the updated cells while a hover is held across transactions', async () => {
            await create(GRID, NO_TOOLTIP);
            await hoverDatumByIndex(chart, 0, 0);
            expect(cells(chart).map((cell) => cell.opacity)).toEqual(Array(GRID.length).fill(0.6));

            // The update clears the hover for its first pass and applies it again in the second.
            await transactIncrementally([UPDATED('1:1', 7)]);
            await transactIncrementally([UPDATED('2:2', 5)]);

            const reference = deproxy(
                await createEnterpriseChart(
                    rawOptions(withUpdates(UPDATED('1:1', 7), UPDATED('2:2', 5)), NO_TOOLTIP) as AgChartOptions
                )
            );
            await hoverDatumByIndex(reference, 0, 0);
            const expected = cells(reference);
            reference.destroy();
            expect(cells(chart)).toEqual(expected);
        });

        it('undims every cell when the highlight ends in the same update as a transaction', async () => {
            const series = { ...NO_TOOLTIP, highlight: { unhighlightedItem: { opacity: 0.4 } } };
            await create(GRID, series);
            // The highlight is set through the manager, so the pointer cannot bring it back after the update.
            const { highlightManager } = (chart as Chart).ctx;
            highlightManager.updateHighlight('test', heatmap(chart).getNodeData()![0]);
            await waitForChartStability(chart);
            expect(cells(chart).map((cell) => cell.opacity)).toEqual(Array(GRID.length).fill(0.4));

            highlightManager.updateHighlight('test');
            await transact({ update: [UPDATED('2:2', 5)] });

            expect(highlightManager.getActiveHighlight()).toBeUndefined();
            expect(cells(chart)).toEqual(await freshCells(withUpdates(UPDATED('2:2', 5)), series));
            expect(cells(chart).map((cell) => cell.opacity)).toEqual(Array(GRID.length).fill(1));
        });

        it('restyles and updates only the updated cells when an itemStyler is set', async () => {
            const itemStyler = ({ datum }: { datum: Cell }) => ((datum.v ?? 0) > 6 ? { strokeWidth: 3 } : {});
            await create(GRID, { itemStyler });
            const spy = spyOnCellRebuilds();
            const nodeUpdates = rects(chart).map((rect) => vi.spyOn(rect, 'setStyleProperties'));

            try {
                await transact({ update: [UPDATED('1:1', 7)] });

                expect(spy.datums).toHaveBeenCalledTimes(1);
                expect(spy.styles).toHaveBeenCalledTimes(1);
                expect(nodeUpdates.filter((update) => update.mock.calls.length > 0)).toHaveLength(1);
            } finally {
                spy.restore();
                for (const update of nodeUpdates) update.mockRestore();
            }

            expect(cells(chart)).toEqual(await freshCells(withUpdates(UPDATED('1:1', 7)), { itemStyler }));
        });

        it('picks and shows the tooltip of an updated cell', async () => {
            await create(GRID);
            await transactIncrementally([UPDATED('2:1', 9.5)]);
            const datumIndex = GRID.findIndex((cell) => cell.id === '2:1');

            await hoverDatumByIndex(chart, 0, datumIndex);

            expect(isTooltipVisible(chart)).toBe(true);
            expect((chart as Chart).ctx.highlightManager.getActiveHighlight()?.datumIndex).toBe(datumIndex);
            expect(JSON.stringify(heatmap(chart).getTooltipContent(datumIndex))).toContain('9.5');
        });

        it('stops picking a cell that the update left without a colour value', async () => {
            await create(GRID);
            const datumIndex = GRID.findIndex((cell) => cell.id === '1:2');
            await hoverDatumByIndex(chart, 0, datumIndex);
            expect(isTooltipVisible(chart)).toBe(true);

            await transact({ update: [UPDATED('1:2', null)] });
            await hoverDatumByIndex(chart, 0, datumIndex, MIN_TOOLTIP_HIDE_DELAY);

            expect(isTooltipVisible(chart)).toBe(false);
        });

        describe('against the changed fraction', () => {
            const ids = GRID.map((cell) => cell.id);
            // 0:0 holds the only minimum (0) and 3:2 the only maximum (11). Leaving both where they are and moving
            // every other value within 1..10 keeps the colour domain, so only the cells themselves change.
            const inner = ids.filter((id) => id !== '0:0' && id !== '3:2');
            const moveWithinExtent = (id: string, i: number) => {
                const { v } = GRID.find((cell) => cell.id === id)!;
                return UPDATED(id, v === 0 || v === 11 ? v : 1 + ((v! + i + 3) % 10));
            };

            it.each([
                ['one cell', 1],
                ['a quarter of the cells', 3],
                ['half of the cells', 6],
            ])('matches a fresh render when the update changes %s', async (_name, count) => {
                await create(GRID);
                const updates = inner.slice(0, count).map(moveWithinExtent);
                await transactIncrementally(updates);

                expect(cells(chart)).toEqual(await freshCells(withUpdates(...updates)));
            });

            it('matches a fresh render when the update changes every cell', async () => {
                await create(GRID);
                const updates = ids.map(moveWithinExtent);
                await transact({ update: updates });

                expect(cells(chart)).toEqual(await freshCells(withUpdates(...updates)));
            });

            it('rebuilds only the updated cells whatever fraction changes', async () => {
                await create(GRID);
                const counts: number[] = [];

                for (const count of [1, 3, 6]) {
                    const spy = spyOnCellRebuilds();
                    try {
                        await transact({
                            update: inner.slice(0, count).map((id, i) => UPDATED(id, 1 + ((i + count) % 10))),
                        });
                        counts.push(spy.datums.mock.calls.length);
                    } finally {
                        spy.restore();
                    }
                }

                expect(counts).toEqual([1, 3, 6]);
            });
        });

        // Each case stays inside the colour extent, so the guard under test is the only reason to rebuild everything.
        describe('falls back to a full rebuild', () => {
            it('restyles and repaints every cell when a selection lands in the same frame as the update', async () => {
                const selection = { enabled: true, unselectedItem: { opacity: 0.3 }, selectedItem: { fill: 'lime' } };
                await create(GRID, { ...NO_TOOLTIP, selection });
                const series = heatmap(chart);

                chart.publicApi.setSelection([{ seriesId: series.id, itemId: series.data!.getItemIdFromIndex(0) }]);
                await transactIncrementally([UPDATED('2:2', 5)]);

                const painted = cells(chart);
                expect(painted.map((cell) => cell.opacity)).toEqual(GRID.map((_, i) => (i === 0 ? 1 : 0.3)));
                expect(painted[0].fill).toBe('lime');
            });

            it('rebuilds every cell when a second update lands in the same frame as the transaction', async () => {
                await create(GRID);

                const transaction = chart.publicApi.applyTransaction({ update: [UPDATED('1:1', 8)] });
                chart.publicApi.updateDelta({ series: [{ ...buildOptions(GRID).series[0], cornerRadius: 6 }] });
                await transaction;
                await waitForChartStability(chart);

                expect(rects(chart).map((rect) => rect.topLeftCornerRadius)).toEqual(Array(GRID.length).fill(6));
                expect(cells(chart)).toEqual(await freshCells(withUpdates(UPDATED('1:1', 8)), { cornerRadius: 6 }));
            });

            it('rebuilds every cell when an options change follows a transaction without new data', async () => {
                await create(GRID);
                await transact({ update: [UPDATED('1:1', 8)] });

                chart.publicApi.updateDelta({ series: [{ ...buildOptions(GRID).series[0], cornerRadius: 6 }] });
                await waitForChartStability(chart);

                expect(rects(chart).map((rect) => rect.topLeftCornerRadius)).toEqual(Array(GRID.length).fill(6));
            });

            it('rebuilds every cell when two transactions land in the same frame', async () => {
                await create(GRID);

                const first = chart.publicApi.applyTransaction({ update: [UPDATED('1:1', 8)] });
                const second = chart.publicApi.applyTransaction({ update: [UPDATED('2:1', 3)] });
                await Promise.all([first, second]);
                await waitForChartStability(chart);

                expect(cells(chart)).toEqual(await freshCells(withUpdates(UPDATED('1:1', 8), UPDATED('2:1', 3))));
            });
        });

        describe('colour domain', () => {
            it('restyles every cell when the update sets a new minimum', async () => {
                await create(GRID);
                const before = cells(chart);
                const spy = spyOnCellRebuilds();

                try {
                    await transact({ update: [UPDATED('2:2', -50)] });

                    expect(spy.styles).toHaveBeenCalledTimes(GRID.length);
                } finally {
                    spy.restore();
                }

                const after = cells(chart);
                expect(after.map((cell) => cell.fill)).not.toEqual(before.map((cell) => cell.fill));
                expect(after).toEqual(await freshCells(withUpdates(UPDATED('2:2', -50))));
            });

            it('restyles every cell when the update shrinks the domain from the top', async () => {
                await create(GRID);
                const before = cells(chart);

                // 3:2 holds the only maximum (11); lowering it pulls the top of the domain down to 10.
                await transact({ update: [UPDATED('3:2', 2)] });

                const after = cells(chart);
                expect(after.map((cell) => cell.fill)).not.toEqual(before.map((cell) => cell.fill));
                expect(after).toEqual(await freshCells(withUpdates(UPDATED('3:2', 2))));
            });

            it('matches a fresh render when a fixed domain already covers the new value', async () => {
                const series = { colorScale: { domain: [0, 100], fills: [{ color: 'blue' }, { color: 'red' }] } };
                await create(GRID, series);

                await transact({ update: [UPDATED('1:1', 60)] });

                expect(cells(chart)).toEqual(await freshCells(withUpdates(UPDATED('1:1', 60)), series));
            });

            it('colours every cell from the new domain after a run of transactions', async () => {
                await create(GRID);
                await transact({ update: [UPDATED('0:0', 80)] });
                await transact({ update: [UPDATED('1:0', 5)] });
                await transact({ update: [UPDATED('0:0', 3)] });

                expect(cells(chart)).toEqual(await freshCells(withUpdates(UPDATED('0:0', 3), UPDATED('1:0', 5))));
            });
        });

        describe('added and removed cells', () => {
            it('adds a cell to an existing row and column', async () => {
                const data = GRID.filter((cell) => cell.id !== '2:1');
                await create(data);

                await transact({ add: [GRID.find((cell) => cell.id === '2:1')!] });

                expect(cells(chart)).toEqual(await freshCells([...data, GRID.find((cell) => cell.id === '2:1')!]));
                expect(rects(chart)).toHaveLength(GRID.length);
            });

            it('removes a cell and leaves the rest where they were', async () => {
                await create(GRID);

                await transact({ remove: [{ id: '1:1' }] });

                expect(rects(chart)).toHaveLength(GRID.length - 1);
                expect(cells(chart)).toEqual(await freshCells(GRID.filter((cell) => cell.id !== '1:1')));
            });

            it('adds a cell in a new column and lays the grid out again', async () => {
                await create(GRID);
                const added: Cell = { id: '4:1', x: 'X4', y: 'Y1', v: 6 };

                await transact({ add: [added] });

                expect(cells(chart)).toEqual(await freshCells([...GRID, added]));
            });

            it('colours every cell from the new domain when an added cell extends it', async () => {
                await create(GRID);
                const added: Cell = { id: '0:3', x: 'X0', y: 'Y0', v: 500 };

                await transact({ add: [added] });

                expect(cells(chart)).toEqual(await freshCells([...GRID, added]));
            });

            it('colours every cell from the new domain when the removed cell held the maximum', async () => {
                await create(GRID);
                const before = cells(chart);

                await transact({ remove: [{ id: '3:2' }] });

                expect(cells(chart).map((cell) => cell.fill)).not.toEqual(before.map((cell) => cell.fill));
                expect(cells(chart)).toEqual(await freshCells(GRID.filter((cell) => cell.id !== '3:2')));
            });

            it('updates, adds and removes in one transaction', async () => {
                await create(GRID);
                const updated = UPDATED('0:2', 4);
                const added: Cell = { id: '4:2', x: 'X4', y: 'Y2', v: 2 };

                await transact({ update: [updated], add: [added], remove: [{ id: '2:0' }] });

                const expected = [...withUpdates(updated).filter((cell) => cell.id !== '2:0'), added];
                expect(cells(chart)).toEqual(await freshCells(expected));
            });
        });

        // The mock canvas only tracks the first chart created per test, so the painted pixels of the
        // transacted chart are checked against the fills a separate reference chart resolves for the same data.
        describe('canvas output', () => {
            const NAMED: Record<string, number[]> = { blue: [0, 0, 255], red: [255, 0, 0] };
            const parseFill = (fill: string) =>
                NAMED[fill] ?? Array.from(fill.matchAll(/\d+/g), (match) => Number(match[0])).slice(0, 3);

            const paintedColours = (c: Chart) => {
                const { contentGroup } = heatmap(c);
                const image = ctx.snapshot();
                return rects(c).map((rect) => {
                    const { canvasX, canvasY } = Transformable.toCanvasPoint(
                        contentGroup,
                        rect.x + rect.width / 2,
                        rect.y + rect.height / 2
                    );
                    const offset = (Math.round(canvasY) * image.width + Math.round(canvasX)) * 4;
                    return Array.from(image.data.slice(offset, offset + 3));
                });
            };

            async function expectPaintedLikeFresh(data: Cell[]) {
                const painted = paintedColours(chart);
                const expected = (await freshCells(data)).map((cell) => parseFill(cell.fill));
                expect(painted).toEqual(expected);
            }

            it('paints the fills of a fresh chart after cells are updated', async () => {
                await create(GRID);
                const original = paintedColours(chart);
                const updates = [UPDATED('1:1', 8), UPDATED('2:1', 3)];
                await transactIncrementally(updates);

                expect(paintedColours(chart)).not.toEqual(original);
                await expectPaintedLikeFresh(withUpdates(...updates));
            });

            it('paints the fills of a fresh chart after the colour domain moves', async () => {
                await create(GRID);
                const original = paintedColours(chart);
                await transact({ update: [UPDATED('1:2', 90)] });

                expect(paintedColours(chart)).not.toEqual(original);
                await expectPaintedLikeFresh(withUpdates(UPDATED('1:2', 90)));
            });

            it('paints the fills of a fresh chart after cells are added and removed', async () => {
                await create(GRID);
                const added: Cell = { id: '4:0', x: 'X4', y: 'Y0', v: 5 };
                await transact({ add: [added], remove: [{ id: '0:0' }] });

                await expectPaintedLikeFresh([...GRID.filter((cell) => cell.id !== '0:0'), added]);
            });
        });

        describe('labels', () => {
            const labelTexts = (c: Chart) =>
                (heatmap(c).contextNodeData?.labelData ?? []).map((label) => JSON.stringify(label.text));
            const series = { label: { enabled: true } };

            it('shows the new value on the updated cell and keeps the rest', async () => {
                await create(GRID, series);
                const before = labelTexts(chart);
                expect(before).toHaveLength(GRID.length);

                // Inside the colour extent, so only the labels guard sends this update down the full rebuild.
                await transact({ update: [UPDATED('1:1', 8)] });

                const after = labelTexts(chart);
                expect(after).toHaveLength(GRID.length);
                expect(after.filter((text, i) => text !== before[i])).toHaveLength(1);

                const reference = deproxy(
                    await createEnterpriseChart(rawOptions(withUpdates(UPDATED('1:1', 8)), series) as AgChartOptions)
                );
                expect(after).toEqual(labelTexts(reference));
                reference.destroy();
            });
        });

        describe('tooltip and picking', () => {
            const nodeFor = (datumIndex: number) =>
                heatmap(chart)
                    .getNodeData()
                    ?.find((n) => n.datumIndex === datumIndex);

            it('picks a cell that the update did not touch with its original value', async () => {
                await create(GRID);
                await transactIncrementally([UPDATED('2:1', 9.5)]);
                const datumIndex = GRID.findIndex((cell) => cell.id === '0:0');

                await hoverDatumByIndex(chart, 0, datumIndex);

                expect(isTooltipVisible(chart)).toBe(true);
                expect((chart as Chart).ctx.highlightManager.getActiveHighlight()?.datumIndex).toBe(datumIndex);
                expect(nodeFor(datumIndex)?.colorValue).toBe(0);
            });

            it('shows the new value when the hovered cell itself is updated', async () => {
                await create(GRID);
                const datumIndex = GRID.findIndex((cell) => cell.id === '1:1');
                await hoverDatumByIndex(chart, 0, datumIndex);
                expect(isTooltipVisible(chart)).toBe(true);

                await transact({ update: [UPDATED('1:1', 8.5)] });

                expect(nodeFor(datumIndex)?.colorValue).toBe(8.5);
                expect(JSON.stringify(heatmap(chart).getTooltipContent(datumIndex))).toContain('8.5');
            });

            it('picks the moved cell at its new position and not its old one', async () => {
                // 3:1 is left out so the moved cell has an empty slot, and 2:2 is late enough in the data to keep the categories in order.
                const data = GRID.filter((cell) => cell.id !== '3:1');
                await create(data);
                const datumIndex = data.findIndex((cell) => cell.id === '2:2');
                const { x: oldX, y: oldY } = nodeFor(datumIndex)!.point;
                const moved = UPDATED('2:2', 7, { x: 'X3', y: 'Y1' });

                const spy = spyOnCellRebuilds();
                try {
                    await transact({ update: [moved] });
                    expect(spy.datums).toHaveBeenCalledTimes(1);
                } finally {
                    spy.restore();
                }

                const newPoint = nodeFor(datumIndex)!.point;
                expect(newPoint).not.toEqual({ x: oldX, y: oldY });

                await hoverDatumByIndex(chart, 0, datumIndex);
                expect(isTooltipVisible(chart)).toBe(true);
                expect((chart as Chart).ctx.highlightManager.getActiveHighlight()?.datumIndex).toBe(datumIndex);

                // The old slot is empty now, so hovering it must not pick the moved cell.
                const { canvasX, canvasY } = Transformable.toCanvasPoint(heatmap(chart).contentGroup, oldX, oldY);
                await hoverAction(canvasX, canvasY)(chart);
                await waitForChartStability(chart, MIN_TOOLTIP_HIDE_DELAY);
                expect((chart as Chart).ctx.highlightManager.getActiveHighlight()?.datumIndex).not.toBe(datumIndex);
                expect(cells(chart)).toEqual(await freshCells(data.map((cell) => (cell.id === '2:2' ? moved : cell))));
            });
        });
    });
});
