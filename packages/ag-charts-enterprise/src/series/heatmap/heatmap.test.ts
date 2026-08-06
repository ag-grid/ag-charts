import { type Image as SkiaImage, loadImage as skiaLoadImage } from 'skia-canvas';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { type AgChartOptions, AgCharts, _ModuleSupport } from 'ag-charts-community';
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
import { classCast } from 'ag-charts-test';

import { createEnterpriseChart, prepareEnterpriseTestOptions, renderEnterpriseChartImage } from '../../test/utils';
import { HeatmapSeries } from './heatmapSeries';

// Drives a hover at the canvas point of the given datum index and waits for chart stability.
// Resolves nodeData fresh on every call so it stays valid across `proxy.update(...)` rebuilds.
async function hoverDatumByIndex(chart: Chart, seriesIndex: number, datumIndex: number, hideDelay?: number) {
    const series = classCast(chart.series[seriesIndex], HeatmapSeries);
    const nodeData = series.getNodeData();
    expect(nodeData).toBeDefined();
    const datum = nodeData!.find((n) => n.datumIndex === datumIndex);
    expect(datum).toBeDefined();
    const { canvasX: x, canvasY: y } = _ModuleSupport.Transformable.toCanvasPoint(
        series.contentGroup,
        datum!.point.x,
        datum!.point.y
    );
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
        const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it('AG-8290 label boxing', async () => {
        const options = prepareEnterpriseTestOptions({
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

        chart = AgCharts.create(options);
        await compare();
    });

    describe('AG-16306 - clearing data', () => {
        it('should clear heatmap when data is updated to empty array', async () => {
            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // Clear the data
            await chart.updateDelta({ data: [] });

            // Verify chart is cleared
            await compareImageSnapshot(chart, ctx);
        });
    });

    describe('AG-15645 - colorKey edge cases', () => {
        it('should handle some null color values', async () => {
            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
            await compare();
        });

        it('should handle all null color values', async () => {
            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
            await compare();
        });

        it('should handle no colorKey', async () => {
            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
            await compare();
        });

        it('should handle null color values in colorKey', async () => {
            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('colorScale', () => {
        it('should render with continuous colorScale', async () => {
            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render with discrete colorScale', async () => {
            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render with explicit domain colorScale', async () => {
            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render with discrete named stops colorScale', async () => {
            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('legend', () => {
        it('should render gradient legend with continuous colorScale', async () => {
            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render category legend with discrete colorScale', async () => {
            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render category legend with named discrete stops', async () => {
            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render gradient legend with continuous named stops', async () => {
            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render gradient legend with discrete named stops', async () => {
            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
            await compare();
        });

        it('AG-16043: moving from a normal legend item onto a suppressed bin clears the legend-scoped highlight', async () => {
            const options = prepareEnterpriseTestOptions({
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
            });

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            // Drive Legend.onHover directly rather than simulating canvas coordinates — the
            // legend's own markerLabel nodes already carry the datum association, and the
            // MouseEvent argument is only used for tooltip positioning, not highlight state.
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
            const options = prepareEnterpriseTestOptions({
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

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const { highlightManager } = (chart as Chart).ctx;
            expect(highlightManager.getActiveHighlight()).toBeUndefined();

            const legendBBox = computeLegendBBox(chart);
            await hoverAction(legendBBox.x + 5, legendBBox.y + legendBBox.height / 2)(chart);
            await waitForChartStability(chart);

            // The bin's itemId is a bin index, not a datum index; feeding it through the
            // highlight pipeline would either dim everything (heatmap/maps) or throw
            // (treemap/sunburst whose datumIndex is a path array).
            expect(highlightManager.getActiveHighlight()).toBeUndefined();
        });

        it('AG-16043: discrete-bin legend items render with the default cursor, not pointer', async () => {
            const options = prepareEnterpriseTestOptions({
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

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            // Discrete-bin items don't toggle and don't drive series highlight, so the
            // pointer cursor would mislead users into expecting an interactive response.
            const legendButtons = document.querySelectorAll<HTMLElement>('button.ag-charts-proxy-elem[role="switch"]');
            expect(legendButtons.length).toBeGreaterThan(0);
            for (const button of Array.from(legendButtons)) {
                expect(button.style.cursor).toBe('default');
            }
        });

        it('AG-16043: discrete-bin legend labels run through chart-level formatter.color', async () => {
            const options = prepareEnterpriseTestOptions({
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
            });

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const series = (chart as Chart).series[0];
            const legendData = series.getLegendData('category') as { label: { text: string } }[];
            const labels = legendData.map((d) => d.label.text);

            // Compact-notation formatting should be applied to every bin boundary.
            // Stops are 150000 / 500000 / 1000000; final bin runs to data max (1.5M).
            expect(labels).toEqual(['43K–150K', '150K–500K', '500K–1M', '1M–1.5M']);
        });
    });

    describe('null category key', () => {
        it('should render with null category key value', async () => {
            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

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
            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

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
            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toEqual([]);
            await compare();
        });

        it('should accept undefined category key when allowNullKeys is true', async () => {
            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

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
            const options = prepareEnterpriseTestOptions({
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
            });

            chart = deproxy(AgCharts.create(options));
            await compare();

            const seriesImpl = chart.series[0] as HeatmapSeries;
            assertTooltipSuppressedForMissing(
                seriesImpl,
                data,
                (d) => d.spending == null,
                (i) => i
            );
        });

        // AG-16046 pt2 regression: previously, hovering a missing-data datum left the prior
        // neighbour's tooltip stuck because seriesAreaManager.showTooltip skipped the dismissal
        // path when the per-series tooltipContent array came back empty. This drives the chart
        // through real hover events to exercise that pipeline end-to-end.
        it('AG-16046: should dismiss tooltip when hovering a missing colorValue datum', async () => {
            const data: Array<{ year: string; person: string; spending?: number | null }> = [
                { year: '2020', person: 'Florian', spending: 10 },
                { year: '2020', person: 'Julian', spending: null },
                { year: '2021', person: 'Florian', spending: 30 },
                { year: '2021', person: 'Julian', spending: 40 },
            ];
            const options = prepareEnterpriseTestOptions({
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
            });

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const presentIndex = data.findIndex((d) => d.spending != null);
            const missingIndex = data.findIndex((d) => d.spending == null);

            await hoverDatumByIndex(chart, 0, presentIndex);
            expect(isTooltipVisible(chart)).toBe(true);

            await hoverDatumByIndex(chart, 0, missingIndex, MIN_TOOLTIP_HIDE_DELAY);
            expect(isTooltipVisible(chart)).toBe(false);
        });

        // AG-16046 pt2 broadened semantic: when a series has tooltip.enabled = false, hovering
        // it now also dismisses any prior tooltip via the same empty-content path.
        it('AG-16046: should dismiss tooltip when hovering a series with tooltip disabled', async () => {
            const data = [
                { year: '2020', person: 'Florian', spending: 10 },
                { year: '2020', person: 'Julian', spending: 20 },
                { year: '2021', person: 'Florian', spending: 30 },
                { year: '2021', person: 'Julian', spending: 40 },
            ];
            const options = prepareEnterpriseTestOptions({
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

            const proxy = AgCharts.create(options);
            chart = deproxy(proxy);
            await waitForChartStability(chart);

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

            // Re-resolve via the helper post-update — layout, scale domains and node identity
            // may all have changed, so pre-update coordinates aren't guaranteed to land on the
            // second datum.
            await hoverDatumByIndex(chart, 0, 1, MIN_TOOLTIP_HIDE_DELAY);
            expect(isTooltipVisible(chart)).toBe(false);
        });

        it('should allow itemStyler to override missingDataFill', async () => {
            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
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
            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render with grouped-category Y axis', async () => {
            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
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

            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
            await compare();
        });

        // Mirrors plunker https://plnkr.co/edit/8wpS0AylLFG3GSsZ — baud rate (Even/Odd)
        // grouped on X, line-rate category on Y (reversed). Guards the tick/cell
        // alignment the user observed on that specific config.
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

            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render with a single group (degenerate grouping)', async () => {
            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('null category key', () => {
        it('should treat null and undefined as distinct categories', async () => {
            const options = prepareEnterpriseTestOptions({
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

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toEqual([]);
            await compare();
        });
    });

    describe('block-leading image segments (treemap parity)', () => {
        // Heatmap cell labels go through formatLabels() like treemap, so a `block: true` image
        // segment must render the same way: anchored left of the cell label with text beside it.
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

    // Heatmap skips its animation batch (`animationManager.skipCurrentBatch()` in update()), so cells
    // never tween — a data change lands the new layout on the first frame. Pinned by a minimal guard
    // rather than a trajectory suite, since there is no motion to describe.
    describe('does not animate', () => {
        const frames = spyOnAnimationFrames();

        const cellKeys = (sample: SceneGeometrySample) =>
            [...sample.keys()].filter((k) => /^series\[0\]\/rect\[/.test(k));

        it('update data: cells snap to their new layout without tweening', async () => {
            const options = prepareEnterpriseTestOptions({
                data: [
                    { year: '2020', person: 'A', spending: 10 },
                    { year: '2020', person: 'B', spending: 20 },
                    { year: '2021', person: 'A', spending: 30 },
                    { year: '2021', person: 'B', spending: 40 },
                ],
                series: [{ type: 'heatmap', xKey: 'year', yKey: 'person', colorKey: 'spending' }],
                legend: { enabled: false },
            });
            chart = AgCharts.create(options);
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
            const rects: _ModuleSupport.Rect[] = [];
            const visit = (node: _ModuleSupport.Node) => {
                if (node instanceof _ModuleSupport.Rect) rects.push(node);
                if (node instanceof _ModuleSupport.Group) {
                    for (const child of node.children()) visit(child);
                }
            };
            visit(classCast(target.series[0], HeatmapSeries).contentGroup);
            return rects;
        };

        const buildOptions = (cornerRadius?: number) =>
            prepareEnterpriseTestOptions({
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
            chart = deproxy(AgCharts.create(buildOptions(16)));
            await waitForChartStability(chart);

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
            chart = deproxy(AgCharts.create(buildOptions()));
            await waitForChartStability(chart);

            const rects = cellRects(chart);
            expect(rects).toHaveLength(9);
            for (const rect of rects) {
                expect(rect.topLeftCornerRadius).toBe(0);
            }
        });
    });
});
