import { type Image as SkiaImage, loadImage as skiaLoadImage } from 'skia-canvas';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
    type AgChartOptions,
    AgCharts,
    type AgHeatmapSeriesItemStylerParams,
    type AgHeatmapSeriesOptions,
    type TextAlign,
    type VerticalAlign,
} from 'ag-charts-community';
import {
    BIG,
    type ChartOrProxy,
    IMAGE_SNAPSHOT_DEFAULTS,
    MIN_TOOLTIP_HIDE_DELAY,
    NEG_BIG,
    type SceneGeometrySample,
    assertTooltipSuppressedForMissing,
    clickAction,
    compareImageSnapshot,
    computeLegendBBox,
    createSceneGeometrySampler,
    deproxy,
    expectNoAnimation,
    expectNonBlank,
    expectPixelIdenticalAcrossUpdate,
    expectWarningsCalls,
    getLegendItemNodes,
    getLegendModule,
    getSeriesAt,
    getSeriesOptions,
    hoverAction,
    isTooltipVisible,
    pressKey,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    stubChartImageLoader,
    tabIntoChart,
    waitForChartStability,
    withUndocumentedOptions,
} from 'ag-charts-community-test';
import { CallbackResultMemo, Group, Rect, Transformable } from 'ag-charts-core';
import { testLogger } from 'ag-charts-test';

import {
    destroyChart,
    getHeatmapCellMethods,
    getLegendItemSuppressHighlight,
    getSeriesInstance,
    getSeriesLabelTexts,
} from '../../test/enterpriseSeriesAccessors';
import {
    DEFAULT_DISABLED_SHADOW,
    SHADOW,
    collectShapes,
    createEnterpriseChart,
    itemNodes,
    prepareEnterpriseTestOptions,
    renderEnterpriseChartImage,
    shadowedShapes,
} from '../../test/utils';
import { HeatmapCellBatch } from './heatmapCellBatch';
import { HeatmapSeries } from './heatmapSeries';

const ALLOW_NULL_KEYS_SERIES = withUndocumentedOptions(
    { type: 'heatmap' as const, xKey: 'year', yKey: 'person', colorKey: 'spending' },
    { allowNullKeys: true }
);

// Resolves nodeData fresh on every call so it stays valid across `proxy.update(...)` rebuilds.
async function hoverDatumByIndex(
    chart: ChartOrProxy<any>,
    seriesIndex: number,
    datumIndex: number,
    hideDelay?: number
) {
    const series = getSeriesInstance(chart, HeatmapSeries, seriesIndex);
    const nodeData = series.getNodeData();
    expect(nodeData).toBeDefined();
    const datum = nodeData!.find((n) => n.datumIndex === datumIndex);
    expect(datum).toBeDefined();
    const { canvasX: x, canvasY: y } = Transformable.toCanvasPoint(series.contentGroup, datum!.point.x, datum!.point.y);
    await hoverAction(x, y)(chart);
    await waitForChartStability(chart, hideDelay);
}

type GridCell = { id: string; x: string; y: string; v: number | null };

function gridCells(columns: number, rows: number): GridCell[] {
    const cells: GridCell[] = [];
    for (let x = 0; x < columns; x++) {
        for (let y = 0; y < rows; y++) {
            cells.push({ id: `${x}:${y}`, x: `X${x}`, y: `Y${y}`, v: x * rows + y });
        }
    }
    return cells;
}

const cellShapes = (c: ChartOrProxy<any>) => itemNodes(c);
const cellFills = (c: ChartOrProxy<any>) => cellShapes(c).map((shape) => String(shape.fill));

describe('HeatmapSeries', () => {
    setupMockConsole();

    let chart: ChartOrProxy<any>;
    const ctx = setupMockCanvas();

    afterEach(() => {
        chart = destroyChart(chart);
    });

    async function select(datumIndex: number) {
        const series = getSeriesInstance(chart, HeatmapSeries);
        const itemId = series.data!.getItemIdFromIndex(datumIndex);
        deproxy(chart).publicApi!.setSelection([{ seriesId: series.id, itemId }]);
        await waitForChartStability(chart);
    }

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
            const legendModule = getLegendModule(deproxy(chart));
            const items = getLegendItemNodes(chart);
            // 1 toggleable Series A + 3 bin items from Series B.
            expect(items).toHaveLength(4);
            expect(getLegendItemSuppressHighlight(items[0])).toBeUndefined();
            expect(getLegendItemSuppressHighlight(items[1])).toBe(true);

            const { highlightManager } = deproxy(chart).ctx;
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

            const { highlightManager } = deproxy(chart).ctx;
            expect(highlightManager.getActiveHighlight()).toBeUndefined();

            const legendBBox = computeLegendBBox(chart);
            await hoverAction(legendBBox.x + 5, legendBBox.y + legendBBox.height / 2)(chart);
            await waitForChartStability(chart);

            // A bin's itemId is a bin index, not a datum index, so it must never reach the
            // highlight pipeline.
            expect(highlightManager.getActiveHighlight()).toBeUndefined();
        });

        it('AG-16043: discrete-bin legend items render with the default cursor, not pointer', async () => {
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

            const series = getSeriesAt(chart);
            const legendData = series.getLegendData('category');
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
                series: [ALLOW_NULL_KEYS_SERIES],
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
                series: [ALLOW_NULL_KEYS_SERIES],
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

            const seriesImpl = getSeriesInstance(chart, HeatmapSeries);
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
                gradientLegend: { position: 'right' },
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
                series: [ALLOW_NULL_KEYS_SERIES],
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
            stubChartImageLoader(chart, preloaded);
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
            const proxy = await createEnterpriseChart({
                data: [
                    { year: '2020', person: 'A', spending: 10 },
                    { year: '2020', person: 'B', spending: 20 },
                    { year: '2021', person: 'A', spending: 30 },
                    { year: '2021', person: 'B', spending: 40 },
                ],
                series: [{ type: 'heatmap', xKey: 'year', yKey: 'person', colorKey: 'spending' }],
                legend: { enabled: false },
            });
            chart = proxy;
            const sampler = createSceneGeometrySampler(chart);
            const { before, trajectory, after } = await frames.captureSnap(chart, sampler, () =>
                proxy.updateDelta({
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
        const cellRects = (target: ChartOrProxy<any>) => itemNodes<Rect>(target);

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

            expect(getSeriesOptions<AgHeatmapSeriesOptions>(chart).shadow).toEqual(DEFAULT_DISABLED_SHADOW);
        });

        it('shadows nothing when no shadow is set', async () => {
            chart = deproxy(await createEnterpriseChart(buildOptions()));

            expect(itemNodes(chart)).toHaveLength(9);
            expect(shadowedShapes(getSeriesAt(chart).contentGroup)).toEqual([]);
        });

        it('applies an enabled shadow to every cell', async () => {
            chart = deproxy(await createEnterpriseChart(buildOptions(SHADOW)));

            const shapes = itemNodes(chart);
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

        const buildOptions = (series: Partial<AgHeatmapSeriesOptions>): AgChartOptions => ({
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
        });

        // Anchor offset of the first label, relative to its cell centre, plus the padded cell span it
        // should be a fraction of and the canvas alignment carried on the same datum.
        const readAnchor = async (options: AgChartOptions) => {
            chart = deproxy(await createEnterpriseChart(options));

            const context = getSeriesInstance(chart, HeatmapSeries).contextNodeData;
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

            chart = destroyChart(chart);
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

                const context = getSeriesInstance(chart, HeatmapSeries).contextNodeData;
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
                });

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
            const cases: [TextAlign, VerticalAlign, string][] = [
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

        // The series overrides stay free-form: typing them would force each test's styler to name its datum type.
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

        const cellOpacities = (c: ChartOrProxy<any>) => cellShapes(c).map((rect) => rect.fillOpacity);
        const cellStrokes = (c: ChartOrProxy<any>) =>
            cellShapes(c).map((rect) => ({ stroke: rect.stroke, width: rect.strokeWidth }));

        const strokeWidths = (c: ChartOrProxy<any>) => cellStrokes(c).map(({ width }) => width);

        /** Reads a freshly created chart's cells (their fills unless `read` says otherwise), then destroys it. */
        async function freshCellFills(options: AgChartOptions): Promise<string[]>;
        async function freshCellFills<T>(options: AgChartOptions, read: (c: ChartOrProxy<any>) => T): Promise<T>;
        async function freshCellFills(options: AgChartOptions, read: (c: ChartOrProxy<any>) => unknown = cellFills) {
            const reference = deproxy(await createEnterpriseChart(options));
            const result = read(reference);
            reference.destroy();
            return result;
        }

        async function hoverAway() {
            await hoverAction(1, 1)(chart);
            await waitForChartStability(chart, MIN_TOOLTIP_HIDE_DELAY);
        }

        it('restyles every cell when the colour scale domain changes', async () => {
            chart = deproxy(await createEnterpriseChart(rawOptions()));
            const before = cellFills(chart);
            expect(new Set(before).size).toBe(DATA.length);

            void chart.publicApi!.updateDelta({ data: SHIFTED_DATA });
            await waitForChartStability(chart);

            const after = cellFills(chart);
            expect(after).not.toEqual(before);
            expect(after).toEqual(await freshCellFills(rawOptions({}, SHIFTED_DATA)));
        });

        it('restyles every cell when the colour scale fills change', async () => {
            chart = deproxy(await createEnterpriseChart(rawOptions()));
            const before = cellFills(chart);

            const colorScale = { fills: [{ color: 'green' }, { color: 'yellow' }] };
            void chart.publicApi!.updateDelta({ series: [{ ...rawOptions().series[0], colorScale }] });
            await waitForChartStability(chart);

            const after = cellFills(chart);
            expect(after).not.toEqual(before);
            expect(after).toEqual(await freshCellFills(rawOptions({ colorScale })));
        });

        it.each([
            { name: 'an explicit unhighlightedItem', highlight: { unhighlightedItem: { opacity: 0.4 } }, dimmed: 0.4 },
            { name: 'the theme highlight', highlight: undefined, dimmed: 0.6 },
        ])('dims the cells on hover with $name and restores them afterwards', async ({ highlight, dimmed }) => {
            chart = deproxy(await createEnterpriseChart(rawOptions({ ...NO_TOOLTIP, highlight })));
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
            chart = deproxy(await createEnterpriseChart(options));

            void chart.publicApi!.updateDelta({ data: SHIFTED_DATA });
            await waitForChartStability(chart);
            expect(cellFills(chart)).toEqual(await freshCellFills(rawOptions(HIGHLIGHT_OFF, SHIFTED_DATA)));

            await hoverDatumByIndex(chart, 0, 0);
            expect(cellOpacities(chart)).toEqual([1, 1, 1, 1]);
            expect(new Set(cellFills(chart)).size).toBe(DATA.length);
        });

        it('keeps the new colour scale fills when the domain changes during a hover and restores them after', async () => {
            chart = deproxy(
                await createEnterpriseChart(
                    rawOptions({ ...NO_TOOLTIP, highlight: { unhighlightedItem: { opacity: 0.4 } } })
                )
            );
            await hoverDatumByIndex(chart, 0, 0);

            void chart.publicApi!.updateDelta({ data: SHIFTED_DATA });
            await waitForChartStability(chart);

            const fills = cellFills(chart);
            expect(fills).toEqual(await freshCellFills(rawOptions({}, SHIFTED_DATA)));
            expect(new Set(fills).size).toBe(DATA.length);

            await hoverAway();
            expect(cellFills(chart)).toEqual(fills);
            expect(cellOpacities(chart)).toEqual([1, 1, 1, 1]);
        });

        it('applies the selection styles over the colour scale fill', async () => {
            chart = deproxy(await createEnterpriseChart(rawOptions({ selection: SELECTION })));
            const fills = cellFills(chart);

            await select(1);

            expect(cellOpacities(chart)).toEqual([0.3, 1, 0.3, 0.3]);
            expect(cellFills(chart)).toEqual(fills.map((fill, i) => (i === 1 ? 'lime' : fill)));
        });

        it('restores the colour scale styling when the selection is cleared', async () => {
            chart = deproxy(await createEnterpriseChart(rawOptions({ selection: SELECTION })));
            const fills = cellFills(chart);

            await select(1);
            expect(cellFills(chart)).not.toEqual(fills);

            chart.publicApi!.setSelection([]);
            await waitForChartStability(chart);
            expect(cellFills(chart)).toEqual(fills);
            expect(cellOpacities(chart)).toEqual([1, 1, 1, 1]);
        });

        it('styles each cell once per update when only the colour scale colours the cells', async () => {
            chart = deproxy(await createEnterpriseChart(rawOptions()));
            const getItemStyle = vi.spyOn(getHeatmapCellMethods(), 'getItemStyle');

            try {
                void chart.publicApi!.updateDelta({ data: SHIFTED_DATA });
                await waitForChartStability(chart);

                expect(getItemStyle).toHaveBeenCalledTimes(DATA.length);
            } finally {
                getItemStyle.mockRestore();
            }
        });

        it('applies an itemStyler over the colour scale fill and follows a domain change', async () => {
            const itemStyler = ({ datum }: { datum: { year: string; person: string } }) =>
                datum.person === 'A' ? { stroke: 'black', strokeWidth: 3 } : {};

            chart = deproxy(await createEnterpriseChart(rawOptions({ itemStyler })));
            const strokes = cellStrokes(chart);
            expect(strokes.filter(({ width }) => width === 3)).toHaveLength(2);

            void chart.publicApi!.updateDelta({ data: SHIFTED_DATA });
            await waitForChartStability(chart);

            expect(cellFills(chart)).toEqual(await freshCellFills(rawOptions({ itemStyler }, SHIFTED_DATA)));
            expect(cellStrokes(chart)).toEqual(strokes);
        });

        it('applies an itemStyler that depends on the highlight state and drops it when the pointer leaves', async () => {
            const itemStyler = ({ highlightState }: { highlightState: string }) =>
                highlightState === 'unhighlighted-item' ? { strokeWidth: 5 } : {};
            chart = deproxy(await createEnterpriseChart(rawOptions({ ...NO_TOOLTIP, itemStyler })));
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
            chart = deproxy(await createEnterpriseChart(options));
            prepareEnterpriseTestOptions(options);
            expect(cellStrokes(chart).map(({ width }) => width)).toEqual([1, 1, 1, 1]);

            strokeWidth = 4;
            void chart.publicApi!.update(options);
            await waitForChartStability(chart);

            expect(cellStrokes(chart).map(({ width }) => width)).toEqual([4, 4, 4, 4]);
        });

        it('fills cells without a colour value with missingDataFill and restyles them on update', async () => {
            const missingDataFill = '#cccccc';
            const colorScale = { fills: [{ color: 'blue' }, { color: 'red' }], missingDataFill };
            const withGap = DATA.map((d, i) => (i === 1 ? { ...d, spending: undefined } : d));

            chart = deproxy(await createEnterpriseChart(rawOptions({ colorScale }, withGap)));
            expect(cellFills(chart).filter((f) => f === missingDataFill)).toHaveLength(1);

            void chart.publicApi!.updateDelta({ data: DATA });
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
                chart = deproxy(await createEnterpriseChart(rawOptions({ itemStyler }, MANY_DATA)));

                expect(strokeWidths(chart)).toEqual(MANY_DATA.map((d) => d.spending / 10));
            });

            it('gives every cell its own result when the styler alternates between two results', async () => {
                const data = Array.from({ length: 12 }, (_, i) => ({ year: `${2000 + i}`, person: 'A', spending: i }));
                const itemStyler = ({ datum }: StylerParams) =>
                    datum.spending % 2 === 0 ? { strokeWidth: 2, stroke: 'black' } : { strokeWidth: 7, stroke: 'red' };
                chart = deproxy(await createEnterpriseChart(rawOptions({ itemStyler }, data)));

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
                chart = deproxy(await createEnterpriseChart(rawOptions({ itemStyler })));

                expect(strokeWidths(chart)).toEqual(DATA.map((d) => d.spending / 10));
            });

            it('keeps the colour scale fill for undefined result values and for cells whose styler returns nothing', async () => {
                const unstyled = await freshCellFills(rawOptions());
                const unstyledWidths = await freshCellFills(rawOptions(), strokeWidths);

                const itemStyler = ({ datum }: StylerParams) =>
                    datum.person === 'A' ? { fill: undefined, strokeWidth: 6 } : undefined;
                chart = deproxy(await createEnterpriseChart(rawOptions({ itemStyler })));

                expect(cellFills(chart)).toEqual(unstyled);
                expect(strokeWidths(chart)).toEqual(DATA.map((d, i) => (d.person === 'A' ? 6 : unstyledWidths[i])));
            });

            it('lets a styler fill replace the colour scale fill only on the cells it styles', async () => {
                const unstyled = await freshCellFills(rawOptions());

                const itemStyler = ({ datum }: StylerParams) => (datum.spending >= 30 ? { fill: 'lime' } : {});
                chart = deproxy(await createEnterpriseChart(rawOptions({ itemStyler })));

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
                chart = deproxy(await createEnterpriseChart(rawOptions({ selection, itemStyler })));
                const fills = cellShapes(chart).map((rect) => rect.fill);

                await select(0);

                // The styler's stops win, and the properties it leaves out (the rotation) come from the selection.
                expect(cellShapes(chart)[0].fill).toMatchObject({ ...stylerGradient, rotation: 45 });
                // A cell that is not selected keeps its own styler fill; the styler gradient replaces a plain fill.
                expect(cellShapes(chart)[2].fill).toEqual(fills[2]);
                expect(cellShapes(chart)[2].fill).toMatchObject(stylerGradient);
            });

            it('applies each cell its own opacity result alongside the shared stroke values', async () => {
                const itemStyler = ({ datum }: StylerParams) => ({
                    stroke: 'black',
                    strokeWidth: 1,
                    fillOpacity: datum.spending / 100,
                });
                chart = deproxy(await createEnterpriseChart(rawOptions({ itemStyler })));

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
                    collectShapes(getSeriesInstance(chart, HeatmapSeries).highlightGroup).map((r) => r.strokeWidth);
                chart = deproxy(await createEnterpriseChart(rawOptions({ ...NO_TOOLTIP, itemStyler })));
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

            it('leaves a flat result out of the options graph', async () => {
                const data = Array.from({ length: 12 }, (_, i) => ({ year: `${2000 + i}`, person: 'A', spending: i }));
                const itemStyler = ({ datum }: StylerParams) => ({ strokeWidth: 1 + (datum.spending % 3) });
                const options = rawOptions({ itemStyler }, data);
                chart = deproxy(await createEnterpriseChart(options));
                prepareEnterpriseTestOptions(options);

                const { optionsGraphService } = deproxy(chart).ctx;
                const resolvePartial = vi.spyOn(optionsGraphService, 'resolvePartial');

                try {
                    void chart.publicApi!.update(options);
                    await waitForChartStability(chart);

                    expect(strokeWidths(chart)).toEqual(data.map((d) => 1 + (d.spending % 3)));
                    expect(resolvePartial).not.toHaveBeenCalled();
                } finally {
                    resolvePartial.mockRestore();
                }
            });

            it('warns once about an invalid result value and still applies the valid properties', async () => {
                const itemStyler = ({ datum }: StylerParams) =>
                    datum.person === 'A' ? { strokeWidth: 'thick', stroke: 'black' } : { strokeWidth: 5 };
                const unstyled = await freshCellFills(rawOptions(), strokeWidths);

                chart = deproxy(await createEnterpriseChart(rawOptions({ itemStyler })));
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
                chart = deproxy(await createEnterpriseChart(rawOptions({ itemStyler })));

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

        describe('itemStyler call count and restyling', () => {
            type StylerParams = AgHeatmapSeriesItemStylerParams<(typeof DATA)[number]>;
            const ROWS = Array.from({ length: 12 }, (_, i) => ({ year: `${2000 + i}`, person: 'A', spending: i }));

            const highlightWidths = () =>
                collectShapes(getSeriesInstance(chart, HeatmapSeries).highlightGroup).map((r) => r.strokeWidth);

            describe.each([
                ['undefined', () => undefined],
                ['an empty object', () => ({})],
                ['a fill', () => ({ fill: 'lime' })],
            ])('a styler that returns %s', (_name, result) => {
                it('runs once per cell on creation and once per cell on each full update', async () => {
                    const itemStyler = vi.fn((_params: StylerParams) => result());
                    const options = rawOptions({ ...NO_TOOLTIP, itemStyler }, ROWS);
                    chart = deproxy(await createEnterpriseChart(options));
                    prepareEnterpriseTestOptions(options);
                    expect(itemStyler).toHaveBeenCalledTimes(ROWS.length);

                    itemStyler.mockClear();
                    void chart.publicApi!.update(options);
                    await waitForChartStability(chart);
                    expect(itemStyler).toHaveBeenCalledTimes(ROWS.length);

                    itemStyler.mockClear();
                    void chart.publicApi!.updateDelta({
                        data: ROWS.map((d) => ({ ...d, spending: d.spending + 100 })),
                    });
                    await waitForChartStability(chart);
                    expect(itemStyler).toHaveBeenCalledTimes(ROWS.length);
                });
            });

            it('styles each cell from its own datum after repeated full updates that return nothing for some cells', async () => {
                let width = 2;
                const itemStyler = ({ datum }: StylerParams) =>
                    datum.spending % 2 === 0 ? undefined : { strokeWidth: width };
                const options = rawOptions({ ...NO_TOOLTIP, itemStyler }, ROWS);
                chart = deproxy(await createEnterpriseChart(options));
                prepareEnterpriseTestOptions(options);
                const unstyled = await freshCellFills(rawOptions({}, ROWS), strokeWidths);

                for (const next of [5, 8]) {
                    width = next;
                    void chart.publicApi!.update(options);
                    await waitForChartStability(chart);
                    expect(strokeWidths(chart)).toEqual(
                        ROWS.map((d, i) => (d.spending % 2 === 0 ? unstyled[i] : next))
                    );
                }
            });

            it('restyles from the highlight state after a full update, and restores the cells when the pointer leaves', async () => {
                const itemStyler = vi.fn(({ highlightState }: StylerParams) =>
                    highlightState === 'unhighlighted-item' ? { strokeWidth: 6 } : undefined
                );
                const options = rawOptions({ ...NO_TOOLTIP, itemStyler });
                chart = deproxy(await createEnterpriseChart(options));
                prepareEnterpriseTestOptions(options);
                const before = strokeWidths(chart);
                expect(before).not.toContain(6);

                // The restyle straight after this update is skipped, so the hover below must still restyle.
                void chart.publicApi!.update(options);
                await waitForChartStability(chart);
                expect(strokeWidths(chart)).toEqual(before);

                await hoverDatumByIndex(chart, 0, 0);
                expect(strokeWidths(chart)).toEqual([6, 6, 6, 6]);

                await hoverAway();
                expect(strokeWidths(chart)).toEqual(before);
            });

            it('restyles every cell on a full update while a cell is highlighted', async () => {
                let width = 2;
                const itemStyler = ({ highlightState }: StylerParams) =>
                    highlightState === 'highlighted-item' ? { strokeWidth: 9 } : { strokeWidth: width };
                const options = rawOptions({ ...NO_TOOLTIP, itemStyler });
                chart = deproxy(await createEnterpriseChart(options));
                prepareEnterpriseTestOptions(options);
                await hoverDatumByIndex(chart, 0, 1);
                expect(highlightWidths()).toEqual([9]);

                width = 4;
                void chart.publicApi!.update(options);
                await waitForChartStability(chart);

                expect(strokeWidths(chart)).toEqual([4, 4, 4, 4]);
                expect(highlightWidths()).toEqual([9]);

                await hoverAway();
                expect(strokeWidths(chart)).toEqual([4, 4, 4, 4]);
            });

            it('restyles a cell that a highlight styled once the highlight is gone and the data changes', async () => {
                const itemStyler = ({ datum, highlightState }: StylerParams) =>
                    highlightState === 'unhighlighted-item'
                        ? { strokeWidth: 7 }
                        : { strokeWidth: 1 + (datum.spending >= 30 ? 1 : 0) };
                chart = deproxy(await createEnterpriseChart(rawOptions({ ...NO_TOOLTIP, itemStyler })));
                await hoverDatumByIndex(chart, 0, 0);
                expect(strokeWidths(chart)).toEqual([7, 7, 7, 7]);
                await hoverAway();

                void chart.publicApi!.updateDelta({ data: SHIFTED_DATA });
                await waitForChartStability(chart);

                expect(strokeWidths(chart)).toEqual(SHIFTED_DATA.map((d) => 1 + (d.spending >= 30 ? 1 : 0)));
            });

            it('applies a selection over cells whose styler returns nothing, and clears it again', async () => {
                const itemStyler = vi.fn(() => undefined);
                const options = rawOptions({ ...NO_TOOLTIP, selection: SELECTION, itemStyler });
                chart = deproxy(await createEnterpriseChart(options));
                prepareEnterpriseTestOptions(options);
                const unselected = cellFills(chart);
                expect(cellOpacities(chart)).toEqual([1, 1, 1, 1]);

                await select(0);

                expect(cellFills(chart)[0]).toBe('lime');
                expect(cellFills(chart).slice(1)).toEqual(unselected.slice(1));
                expect(cellOpacities(chart).slice(1)).toEqual([0.3, 0.3, 0.3]);

                // A full update while a cell is selected keeps the selection styling.
                void chart.publicApi!.update(options);
                await waitForChartStability(chart);
                expect(cellFills(chart)[0]).toBe('lime');
                expect(cellOpacities(chart).slice(1)).toEqual([0.3, 0.3, 0.3]);

                chart.publicApi!.setSelection([]);
                await waitForChartStability(chart);
                expect(cellFills(chart)).toEqual(unselected);
                expect(cellOpacities(chart)).toEqual([1, 1, 1, 1]);
            });

            it('keeps the styler result on cells alongside a selection', async () => {
                const itemStyler = ({ datum }: StylerParams) =>
                    datum.person === 'B' ? { stroke: 'black', strokeWidth: 4 } : undefined;
                chart = deproxy(
                    await createEnterpriseChart(rawOptions({ ...NO_TOOLTIP, selection: SELECTION, itemStyler }))
                );
                const widths = strokeWidths(chart);

                await select(1);

                expect(cellFills(chart)[1]).toBe('lime');
                expect(strokeWidths(chart)).toEqual(widths);
            });

            it('does not run a styler that returned nothing again when a selection restyles the cells', async () => {
                const itemStyler = vi.fn((_params: StylerParams) => undefined);
                chart = deproxy(
                    await createEnterpriseChart(rawOptions({ ...NO_TOOLTIP, selection: SELECTION, itemStyler }, ROWS))
                );
                expect(itemStyler).toHaveBeenCalledTimes(ROWS.length);

                await select(0);
                chart.publicApi!.setSelection([]);
                await waitForChartStability(chart);

                expect(itemStyler).toHaveBeenCalledTimes(ROWS.length);
            });

            describe('the restyle after a full update', () => {
                // The watcher hooks each cell's `Rect`, so the cells stay on `Rect`s; the batch keeps no per-cell node.
                const ON_RECTS = { cornerRadius: 1 };

                /** Counts the style writes to the cells' datums from now on, which only a restyle of the cells makes. */
                function watchCellStyleWrites() {
                    let writes = 0;
                    const watch = (datum: { style: unknown }) => {
                        let style = datum.style;
                        Object.defineProperty(datum, 'style', {
                            configurable: true,
                            get: () => style,
                            set: (value) => {
                                writes++;
                                style = value;
                            },
                        });
                    };
                    for (const rect of cellShapes(chart)) {
                        // `Node.datum` is `unknown`; the series gives every cell the datum it draws, which carries `style`.
                        let datum = rect.datum as { style: unknown };
                        watch(datum);
                        // A full update binds new datums to the same cells.
                        Object.defineProperty(rect, 'datum', {
                            configurable: true,
                            get: () => datum,
                            set: (value) => {
                                datum = value;
                                if (value != null) watch(value);
                            },
                        });
                    }
                    return () => writes;
                }

                it.each([
                    ['returns nothing', () => undefined],
                    ['returns a fill', () => ({ fill: 'lime' })],
                ])('is skipped for a styler that %s when nothing is highlighted or selected', async (_name, result) => {
                    const options = rawOptions({ ...NO_TOOLTIP, ...ON_RECTS, itemStyler: result }, ROWS);
                    chart = deproxy(await createEnterpriseChart(options));
                    prepareEnterpriseTestOptions(options);
                    const writes = watchCellStyleWrites();

                    void chart.publicApi!.update(options);
                    await waitForChartStability(chart);

                    expect(writes()).toBe(0);
                });

                it('still happens on a full update while a cell is highlighted', async () => {
                    const options = rawOptions({ ...NO_TOOLTIP, ...ON_RECTS, itemStyler: () => undefined }, ROWS);
                    chart = deproxy(await createEnterpriseChart(options));
                    prepareEnterpriseTestOptions(options);
                    await hoverDatumByIndex(chart, 0, 1);
                    const writes = watchCellStyleWrites();

                    void chart.publicApi!.update(options);
                    await waitForChartStability(chart);

                    expect(writes()).toBeGreaterThan(0);
                });

                it('still happens on a full update while a cell is selected', async () => {
                    const options = rawOptions(
                        { ...NO_TOOLTIP, ...ON_RECTS, selection: SELECTION, itemStyler: () => undefined },
                        ROWS
                    );
                    chart = deproxy(await createEnterpriseChart(options));
                    prepareEnterpriseTestOptions(options);
                    await select(0);
                    const writes = watchCellStyleWrites();

                    void chart.publicApi!.update(options);
                    await waitForChartStability(chart);

                    expect(writes()).toBeGreaterThan(0);
                });
            });

            it('logs a styler that throws once and gives its cells the default style, without calling it again', async () => {
                const unstyledFills = await freshCellFills(rawOptions());
                const unstyledWidths = await freshCellFills(rawOptions(), strokeWidths);
                const itemStyler = vi.fn(({ datum }: StylerParams) => {
                    if (datum.person === 'B') throw new Error('boom');
                    return { strokeWidth: 8 };
                });
                const options = rawOptions({ ...NO_TOOLTIP, itemStyler });
                chart = deproxy(await createEnterpriseChart(options));
                prepareEnterpriseTestOptions(options);

                expect(itemStyler).toHaveBeenCalledTimes(DATA.length);
                expect(cellFills(chart)).toEqual(unstyledFills);
                expect(strokeWidths(chart)).toEqual(DATA.map((d, i) => (d.person === 'B' ? unstyledWidths[i] : 8)));
                expectWarningsCalls().toMatchInlineSnapshot(`
                  [
                    [
                      "AG Charts - Uncaught exception in user callback \`series[0].itemStyler\`",
                      [Error: boom],
                    ],
                  ]
                `);
            });
        });

        describe('itemStyler results with and without a theme reference', () => {
            type StylerParams = AgHeatmapSeriesItemStylerParams<(typeof DATA)[number]>;
            const resolvedStylerResults = (resolvePartial: { mock: { calls: unknown[][] } }) =>
                resolvePartial.mock.calls.filter(
                    ([, value]) => typeof value === 'object' && value != null && 'fill' in value
                );

            async function updateWatchingResolvePartial(
                options: ReturnType<typeof rawOptions> & Pick<AgChartOptions, 'theme'>
            ) {
                chart = deproxy(await createEnterpriseChart(options));
                prepareEnterpriseTestOptions(options);
                const resolvePartial = vi.spyOn(deproxy(chart).ctx.optionsGraphService, 'resolvePartial');
                void chart.publicApi!.update(options);
                await waitForChartStability(chart);
                return resolvePartial;
            }

            it('applies about 256 distinct fills to the cells that asked for them, skipping the options graph', async () => {
                const DISTINCT = 256;
                const data = Array.from({ length: DISTINCT * 2 }, (_, i) => ({
                    year: `${2000 + (i % 40)}`,
                    person: `P${Math.floor(i / 40)}`,
                    spending: i,
                }));
                const fillFor = (spending: number) => `rgb(${spending % DISTINCT}, 20, 30)`;
                const itemStyler = ({ datum }: { datum: { spending: number } }) => ({ fill: fillFor(datum.spending) });
                const options = rawOptions({ itemStyler }, data);

                const resolvePartial = await updateWatchingResolvePartial(options);
                try {
                    expect(resolvedStylerResults(resolvePartial)).toHaveLength(0);
                    const fills = cellFills(chart);
                    expect(fills).toHaveLength(data.length);
                    expect(new Set(fills).size).toBe(DISTINCT);
                    // Cells 0..255 and 256..511 share fills pairwise, and every cell shows the fill its own datum asked for.
                    const expected = await freshCellFills(rawOptions({ itemStyler }, data));
                    expect(fills).toEqual(expected);
                    expect(fills[0]).toBe(fills[DISTINCT]);
                    expect(fills[1]).not.toBe(fills[0]);
                } finally {
                    resolvePartial.mockRestore();
                }
            });

            it('forgets the remembered results when a data update restyles every cell', async () => {
                const itemStyler = ({ datum }: StylerParams) => ({ strokeWidth: datum.spending / 10 });
                chart = deproxy(await createEnterpriseChart(rawOptions({ itemStyler })));
                const clear = vi.spyOn(CallbackResultMemo.prototype, 'clear');

                try {
                    void chart.publicApi!.updateDelta({ data: SHIFTED_DATA });
                    await waitForChartStability(chart);

                    expect(clear).toHaveBeenCalled();
                    expect(strokeWidths(chart)).toEqual(SHIFTED_DATA.map((d) => d.spending / 10));
                } finally {
                    clear.mockRestore();
                }
            });

            it('still resolves a result holding a theme colour reference through the options graph for each cell', async () => {
                const itemStyler = ({ datum }: StylerParams) => ({
                    fill: { ref: 'accentColor' as const },
                    strokeWidth: datum.spending / 10,
                });
                const options = {
                    ...rawOptions({ ...NO_TOOLTIP, itemStyler }),
                    theme: { params: { accentColor: 'orange' } },
                };

                const resolvePartial = await updateWatchingResolvePartial(options);
                try {
                    expect(resolvedStylerResults(resolvePartial)).toHaveLength(DATA.length);
                    expect(cellFills(chart)).toEqual(DATA.map(() => 'orange'));
                    expect(strokeWidths(chart)).toEqual(DATA.map((d) => d.spending / 10));
                } finally {
                    resolvePartial.mockRestore();
                }
            });
        });

        it('keeps the colour scale fill in the tooltip symbol', async () => {
            chart = deproxy(await createEnterpriseChart(rawOptions()));

            const series = getSeriesInstance(chart, HeatmapSeries);
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
            void deproxy(chart).publicApi!.updateDelta({ data: SHIFTED_DATA });
            await waitForChartStability(chart);
        };

        it('repaints the cells in their new colours without rebuilding their paths', async () => {
            // Rounded corners keep every cell a `Rect` of its own, which the cell batch would otherwise replace.
            chart = deproxy(await createEnterpriseChart(rawOptions({ cornerRadius: 2 })));
            const before = cellFills(chart);
            const updatePaths = itemNodes<Rect>(chart).map((rect) => vi.spyOn(rect, 'updatePath'));
            const updated = () => updatePaths.filter((spy) => spy.mock.calls.length > 0).length;

            void chart.publicApi!.updateDelta({ data: SHIFTED_DATA });
            await waitForChartStability(chart);

            expect(cellFills(chart)).not.toEqual(before);
            expect(updatePaths).toHaveLength(DATA.length);
            expect(updated()).toBe(0);

            // A change of layout still rebuilds them.
            void chart.publicApi!.updateDelta({ data: [...SHIFTED_DATA, { year: '2022', person: 'A', spending: 50 }] });
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
                chart = deproxy(await createEnterpriseChart(rawOptions(overrides)));
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
            chart = deproxy(await createEnterpriseChart(rawOptions({ ...NO_TOOLTIP, cornerRadius: 4, highlight })));
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
            chart = deproxy(await createEnterpriseChart(rawOptions({ ...NO_TOOLTIP, highlight })));
            const series = getSeriesInstance(chart, HeatmapSeries);

            const { rects } = await countFills(() => hoverDatumByIndex(chart, 0, 1));

            const highlighted = collectShapes(series.highlightNodeGroup).filter((shape) => shape.visible);
            expect(highlighted).toHaveLength(1);
            expect(highlighted[0]).toMatchObject({ stroke: 'black', strokeWidth: 3 });
            expect(rects).toBe(others + DATA.length);
        });

        it('paints cells that a highlight strokes through their path and back to a direct fill once it ends', async () => {
            const highlight = { unhighlightedItem: { stroke: 'black', strokeWidth: 3 } };
            const others = await nonCellRects(highlight);
            chart = deproxy(await createEnterpriseChart(rawOptions({ ...NO_TOOLTIP, highlight })));
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
            chart = deproxy(await createEnterpriseChart(rawOptions()));
            void chart.publicApi!.updateDelta({ data: SHIFTED_DATA });
            await waitForChartStability(chart);

            await hoverDatumByIndex(chart, 0, 3);

            expect(isTooltipVisible(chart)).toBe(true);
            expect(deproxy(chart).ctx.highlightManager.getActiveHighlight()?.datumIndex).toBe(3);
        });

        it('keeps keyboard navigation and labels working after a repaint', async () => {
            chart = deproxy(await createEnterpriseChart(rawOptions({ label: { enabled: true } })));
            void chart.publicApi!.updateDelta({ data: SHIFTED_DATA });
            await waitForChartStability(chart);

            const labels = () => getSeriesLabelTexts(chart).map(({ text }) => text);
            expect(labels().sort((a, b) => String(a).localeCompare(String(b)))).toEqual(['10', '100', '40', '5']);

            const highlightedIndex = () => deproxy(chart).ctx.highlightManager.getActiveHighlight()?.datumIndex;
            await tabIntoChart(chart);
            await pressKey(chart, 'ArrowRight');
            expect(highlightedIndex()).toBe(1);
            await pressKey(chart, 'ArrowRight');
            expect(highlightedIndex()).toBe(2);
            expect(isTooltipVisible(chart)).toBe(true);
        });
    });

    describe('applyTransaction', () => {
        const GRID = gridCells(4, 3);
        const UPDATED = (id: string, v: number | null, move?: Partial<GridCell>): GridCell => ({
            ...GRID.find((cell) => cell.id === id)!,
            v,
            ...move,
        });
        const NO_TOOLTIP = { tooltip: { enabled: false } };

        // The series overrides stay free-form, as above.
        const rawOptions = (data: GridCell[], series: Record<string, unknown> = {}) => ({
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

        const heatmap = (c: ChartOrProxy<any>) => getSeriesInstance(c, HeatmapSeries);
        const rects = (c: ChartOrProxy<any>) => itemNodes<Rect>(c);
        const cells = (c: ChartOrProxy<any>) =>
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

        async function create(data: GridCell[], series: Record<string, unknown> = {}) {
            chart = deproxy(await createEnterpriseChart(rawOptions(data, series)));
        }

        async function transact(transaction: { update?: GridCell[]; add?: GridCell[]; remove?: { id: string }[] }) {
            await deproxy(chart).publicApi!.applyTransaction(transaction);
            await waitForChartStability(chart);
        }

        async function freshCells(data: GridCell[], series: Record<string, unknown> = {}) {
            const reference = deproxy(await createEnterpriseChart(rawOptions(data, series)));
            const result = cells(reference);
            reference.destroy();
            return result;
        }

        const withUpdates = (...updates: GridCell[]) =>
            GRID.map((cell) => updates.find((update) => update.id === cell.id) ?? cell);

        function spyOnCellRebuilds() {
            const prototype = getHeatmapCellMethods();
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
        async function transactIncrementally(update: GridCell[]) {
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
            // Rounded corners keep every cell a `Rect` of its own, which the cell batch would otherwise replace.
            const rounded = { cornerRadius: 2 };
            chart = deproxy(await createEnterpriseChart(rawOptions(GRID, rounded)));
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
            expect(after).toEqual(await freshCells(withUpdates(UPDATED('1:1', 7)), rounded));
            expect(rects(chart).every((rect, i) => rect === nodes[i])).toBe(true);
        });

        it('rebuilds every updated cell, and only those', async () => {
            chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));
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
            chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));
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
            chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));
            await transact({ update: [UPDATED('3:2', 1)] });

            expect(cells(chart)).toEqual(await freshCells(withUpdates(UPDATED('3:2', 1))));
        });

        it('repositions a cell that the update moves to another category', async () => {
            chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));
            const moved = UPDATED('1:1', 7, { x: 'X3', y: 'Y0' });
            await transact({ update: [moved] });

            expect(cells(chart)).toEqual(await freshCells(withUpdates(moved)));
        });

        it('rebuilds the layout when the update introduces a category', async () => {
            chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));
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
            const added: GridCell = { id: '4:0', x: 'X4', y: 'Y0', v: 5 };
            await transact({ add: [added], remove: [{ id: '0:0' }] });

            const expected = [...GRID.filter((cell) => cell.id !== '0:0'), added];
            expect(cells(chart)).toEqual(await freshCells(expected));
        });

        it('keeps up with a sequence of transactions', async () => {
            chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));
            const first = UPDATED('0:1', 9);
            const second = UPDATED('3:0', 2);
            await transact({ update: [first] });
            await transact({ update: [second] });
            await transact({ update: [UPDATED('0:1', 10)] });

            expect(cells(chart)).toEqual(await freshCells(withUpdates(UPDATED('0:1', 10), second)));
        });

        it('rebuilds every cell when an options change follows a transaction', async () => {
            chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));
            await transact({ update: [UPDATED('1:1', 7)] });
            const data = withUpdates(UPDATED('1:1', 7));
            const series = { cornerRadius: 6, colorScale: { fills: [{ color: 'green' }, { color: 'orange' }] } };

            void chart.publicApi!.update(buildOptions(data, series));
            await waitForChartStability(chart);

            expect(cells(chart)).toEqual(await freshCells(data, series));
        });

        it('rebuilds every cell when the chart resizes after a transaction', async () => {
            chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));
            await transact({ update: [UPDATED('1:1', 7)] });

            void chart.publicApi!.updateDelta({ width: 300, height: 200 });
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
            const itemStyler = ({ datum }: { datum: GridCell }) => {
                stylerCalls.push(datum.id);
                return (datum.v ?? 0) > 6 ? { stroke: 'black', strokeWidth: 3 } : {};
            };
            chart = deproxy(await createEnterpriseChart(rawOptions(GRID, { itemStyler })));
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
            const itemStyler = ({ datum }: { datum: GridCell }) => ((datum.v ?? 0) > 6 ? { fill: 'green' } : {});
            await create(GRID, { itemStyler });

            await transact({ remove: [{ id: '0:0' }] });

            expect(cells(chart)).toEqual(await freshCells(GRID.slice(1), { itemStyler }));
        });

        it('restyles an itemStyler that reads the fill when a transaction moves the colour domain', async () => {
            const itemStyler = ({ fill }: { fill: string }) => ({ stroke: fill });
            chart = deproxy(await createEnterpriseChart(rawOptions(GRID, { itemStyler })));

            // 50 lies outside the 0..11 extent, so every cell's fill, and the stroke taken from it, changes.
            await transact({ update: [UPDATED('3:2', 50)] });

            expect(cells(chart)).toEqual(await freshCells(withUpdates(UPDATED('3:2', 50)), { itemStyler }));
        });

        it('keeps the highlight styling of a hovered cell while another cell updates', async () => {
            const series = { ...NO_TOOLTIP, highlight: { unhighlightedItem: { opacity: 0.4 } } };
            chart = deproxy(await createEnterpriseChart(rawOptions(GRID, series)));
            await hoverDatumByIndex(chart, 0, 0);
            expect(cells(chart).map((cell) => cell.opacity)).toEqual(Array(GRID.length).fill(0.4));

            await transact({ update: [UPDATED('2:2', 5)] });

            expect(cells(chart).map((cell) => cell.opacity)).toEqual(Array(GRID.length).fill(0.4));

            await hoverAction(1, 1)(chart);
            await waitForChartStability(chart, MIN_TOOLTIP_HIDE_DELAY);
            expect(cells(chart)).toEqual(await freshCells(withUpdates(UPDATED('2:2', 5)), series));
        });

        it('rebuilds only the updated cells while a hover is held across transactions', async () => {
            chart = deproxy(await createEnterpriseChart(rawOptions(GRID, NO_TOOLTIP)));
            await hoverDatumByIndex(chart, 0, 0);
            expect(cells(chart).map((cell) => cell.opacity)).toEqual(Array(GRID.length).fill(0.6));

            // The update clears the hover for its first pass and applies it again in the second.
            await transactIncrementally([UPDATED('1:1', 7)]);
            await transactIncrementally([UPDATED('2:2', 5)]);

            const reference = deproxy(
                await createEnterpriseChart(rawOptions(withUpdates(UPDATED('1:1', 7), UPDATED('2:2', 5)), NO_TOOLTIP))
            );
            await hoverDatumByIndex(reference, 0, 0);
            const expected = cells(reference);
            reference.destroy();
            expect(cells(chart)).toEqual(expected);
        });

        it('undims every cell when the highlight ends in the same update as a transaction', async () => {
            const series = { ...NO_TOOLTIP, highlight: { unhighlightedItem: { opacity: 0.4 } } };
            chart = deproxy(await createEnterpriseChart(rawOptions(GRID, series)));
            // The highlight is set through the manager, so the pointer cannot bring it back after the update.
            const { highlightManager } = deproxy(chart).ctx;
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
            const itemStyler = ({ datum }: { datum: GridCell }) => ((datum.v ?? 0) > 6 ? { strokeWidth: 3 } : {});
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
            chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));
            await transactIncrementally([UPDATED('2:1', 9.5)]);
            const datumIndex = GRID.findIndex((cell) => cell.id === '2:1');

            await hoverDatumByIndex(chart, 0, datumIndex);

            expect(isTooltipVisible(chart)).toBe(true);
            expect(deproxy(chart).ctx.highlightManager.getActiveHighlight()?.datumIndex).toBe(datumIndex);
            expect(JSON.stringify(heatmap(chart).getTooltipContent(datumIndex))).toContain('9.5');
        });

        it('stops picking a cell that the update left without a colour value', async () => {
            chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));
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
                chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));
                const updates = inner.slice(0, count).map(moveWithinExtent);
                await transactIncrementally(updates);

                expect(cells(chart)).toEqual(await freshCells(withUpdates(...updates)));
            });

            it('matches a fresh render when the update changes every cell', async () => {
                chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));
                const updates = ids.map(moveWithinExtent);
                await transact({ update: updates });

                expect(cells(chart)).toEqual(await freshCells(withUpdates(...updates)));
            });

            it('rebuilds only the updated cells whatever fraction changes', async () => {
                chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));
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
                chart = deproxy(await createEnterpriseChart(rawOptions(GRID, { ...NO_TOOLTIP, selection })));
                const series = heatmap(chart);

                chart.publicApi!.setSelection([{ seriesId: series.id, itemId: series.data!.getItemIdFromIndex(0) }]);
                await transactIncrementally([UPDATED('2:2', 5)]);

                const painted = cells(chart);
                expect(painted.map((cell) => cell.opacity)).toEqual(GRID.map((_, i) => (i === 0 ? 1 : 0.3)));
                expect(painted[0].fill).toBe('lime');
            });

            it('rebuilds every cell when a second update lands in the same frame as the transaction', async () => {
                chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));

                const transaction = chart.publicApi!.applyTransaction({ update: [UPDATED('1:1', 8)] });
                void chart.publicApi!.updateDelta({ series: [{ ...rawOptions(GRID).series[0], cornerRadius: 6 }] });
                await transaction;
                await waitForChartStability(chart);

                expect(rects(chart).map((rect) => rect.topLeftCornerRadius)).toEqual(Array(GRID.length).fill(6));
                expect(cells(chart)).toEqual(await freshCells(withUpdates(UPDATED('1:1', 8)), { cornerRadius: 6 }));
            });

            it('rebuilds every cell when an options change follows a transaction without new data', async () => {
                chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));
                await transact({ update: [UPDATED('1:1', 8)] });

                void chart.publicApi!.updateDelta({ series: [{ ...rawOptions(GRID).series[0], cornerRadius: 6 }] });
                await waitForChartStability(chart);

                expect(rects(chart).map((rect) => rect.topLeftCornerRadius)).toEqual(Array(GRID.length).fill(6));
            });

            it('rebuilds every cell when two transactions land in the same frame', async () => {
                chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));

                const first = chart.publicApi!.applyTransaction({ update: [UPDATED('1:1', 8)] });
                const second = chart.publicApi!.applyTransaction({ update: [UPDATED('2:1', 3)] });
                await Promise.all([first, second]);
                await waitForChartStability(chart);

                expect(cells(chart)).toEqual(await freshCells(withUpdates(UPDATED('1:1', 8), UPDATED('2:1', 3))));
            });
        });

        describe('colour domain', () => {
            it('restyles every cell when the update sets a new minimum', async () => {
                chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));
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
                chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));
                const before = cells(chart);

                // 3:2 holds the only maximum (11); lowering it pulls the top of the domain down to 10.
                await transact({ update: [UPDATED('3:2', 2)] });

                const after = cells(chart);
                expect(after.map((cell) => cell.fill)).not.toEqual(before.map((cell) => cell.fill));
                expect(after).toEqual(await freshCells(withUpdates(UPDATED('3:2', 2))));
            });

            it('matches a fresh render when a fixed domain already covers the new value', async () => {
                const series = { colorScale: { domain: [0, 100], fills: [{ color: 'blue' }, { color: 'red' }] } };
                chart = deproxy(await createEnterpriseChart(rawOptions(GRID, series)));

                await transact({ update: [UPDATED('1:1', 60)] });

                expect(cells(chart)).toEqual(await freshCells(withUpdates(UPDATED('1:1', 60)), series));
            });

            it('colours every cell from the new domain after a run of transactions', async () => {
                chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));
                await transact({ update: [UPDATED('0:0', 80)] });
                await transact({ update: [UPDATED('1:0', 5)] });
                await transact({ update: [UPDATED('0:0', 3)] });

                expect(cells(chart)).toEqual(await freshCells(withUpdates(UPDATED('0:0', 3), UPDATED('1:0', 5))));
            });
        });

        describe('added and removed cells', () => {
            it('adds a cell to an existing row and column', async () => {
                const data = GRID.filter((cell) => cell.id !== '2:1');
                chart = deproxy(await createEnterpriseChart(rawOptions(data)));

                await transact({ add: [GRID.find((cell) => cell.id === '2:1')!] });

                expect(cells(chart)).toEqual(await freshCells([...data, GRID.find((cell) => cell.id === '2:1')!]));
                expect(rects(chart)).toHaveLength(GRID.length);
            });

            it('removes a cell and leaves the rest where they were', async () => {
                chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));

                await transact({ remove: [{ id: '1:1' }] });

                expect(rects(chart)).toHaveLength(GRID.length - 1);
                expect(cells(chart)).toEqual(await freshCells(GRID.filter((cell) => cell.id !== '1:1')));
            });

            it('adds a cell in a new column and lays the grid out again', async () => {
                await create(GRID);
                const added: GridCell = { id: '4:1', x: 'X4', y: 'Y1', v: 6 };

                await transact({ add: [added] });

                expect(cells(chart)).toEqual(await freshCells([...GRID, added]));
            });

            it('colours every cell from the new domain when an added cell extends it', async () => {
                await create(GRID);
                const added: GridCell = { id: '0:3', x: 'X0', y: 'Y0', v: 500 };

                await transact({ add: [added] });

                expect(cells(chart)).toEqual(await freshCells([...GRID, added]));
            });

            it('colours every cell from the new domain when the removed cell held the maximum', async () => {
                chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));
                const before = cells(chart);

                await transact({ remove: [{ id: '3:2' }] });

                expect(cells(chart).map((cell) => cell.fill)).not.toEqual(before.map((cell) => cell.fill));
                expect(cells(chart)).toEqual(await freshCells(GRID.filter((cell) => cell.id !== '3:2')));
            });

            it('updates, adds and removes in one transaction', async () => {
                chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));
                const updated = UPDATED('0:2', 4);
                const added: GridCell = { id: '4:2', x: 'X4', y: 'Y2', v: 2 };

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

            const paintedColours = (c: ChartOrProxy<any>) => {
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

            async function expectPaintedLikeFresh(data: GridCell[]) {
                const painted = paintedColours(chart);
                const expected = (await freshCells(data)).map((cell) => parseFill(cell.fill));
                expect(painted).toEqual(expected);
            }

            it('paints the fills of a fresh chart after cells are updated', async () => {
                chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));
                const original = paintedColours(chart);
                const updates = [UPDATED('1:1', 8), UPDATED('2:1', 3)];
                await transactIncrementally(updates);

                expect(paintedColours(chart)).not.toEqual(original);
                await expectPaintedLikeFresh(withUpdates(...updates));
            });

            it('paints the fills of a fresh chart after the colour domain moves', async () => {
                chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));
                const original = paintedColours(chart);
                await transact({ update: [UPDATED('1:2', 90)] });

                expect(paintedColours(chart)).not.toEqual(original);
                await expectPaintedLikeFresh(withUpdates(UPDATED('1:2', 90)));
            });

            it('paints the fills of a fresh chart after cells are added and removed', async () => {
                await create(GRID);
                const added: GridCell = { id: '4:0', x: 'X4', y: 'Y0', v: 5 };
                await transact({ add: [added], remove: [{ id: '0:0' }] });

                await expectPaintedLikeFresh([...GRID.filter((cell) => cell.id !== '0:0'), added]);
            });
        });

        describe('labels', () => {
            const labelTexts = (c: ChartOrProxy<any>) =>
                (heatmap(c).contextNodeData?.labelData ?? []).map((label) => JSON.stringify(label.text));
            const series = { label: { enabled: true } };

            it('shows the new value on the updated cell and keeps the rest', async () => {
                chart = deproxy(await createEnterpriseChart(rawOptions(GRID, series)));
                const before = labelTexts(chart);
                expect(before).toHaveLength(GRID.length);

                // Inside the colour extent, so only the labels guard sends this update down the full rebuild.
                await transact({ update: [UPDATED('1:1', 8)] });

                const after = labelTexts(chart);
                expect(after).toHaveLength(GRID.length);
                expect(after.filter((text, i) => text !== before[i])).toHaveLength(1);

                const reference = deproxy(
                    await createEnterpriseChart(rawOptions(withUpdates(UPDATED('1:1', 8)), series))
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
                chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));
                await transactIncrementally([UPDATED('2:1', 9.5)]);
                const datumIndex = GRID.findIndex((cell) => cell.id === '0:0');

                await hoverDatumByIndex(chart, 0, datumIndex);

                expect(isTooltipVisible(chart)).toBe(true);
                expect(deproxy(chart).ctx.highlightManager.getActiveHighlight()?.datumIndex).toBe(datumIndex);
                expect(nodeFor(datumIndex)?.colorValue).toBe(0);
            });

            it('shows the new value when the hovered cell itself is updated', async () => {
                chart = deproxy(await createEnterpriseChart(rawOptions(GRID)));
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
                chart = deproxy(await createEnterpriseChart(rawOptions(data)));
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
                expect(deproxy(chart).ctx.highlightManager.getActiveHighlight()?.datumIndex).toBe(datumIndex);

                // The old slot is empty now, so hovering it must not pick the moved cell.
                const { canvasX, canvasY } = Transformable.toCanvasPoint(heatmap(chart).contentGroup, oldX, oldY);
                await hoverAction(canvasX, canvasY)(chart);
                await waitForChartStability(chart, MIN_TOOLTIP_HIDE_DELAY);
                expect(deproxy(chart).ctx.highlightManager.getActiveHighlight()?.datumIndex).not.toBe(datumIndex);
                expect(cells(chart)).toEqual(await freshCells(data.map((cell) => (cell.id === '2:2' ? moved : cell))));
            });
        });
    });

    describe('batched cells', () => {
        const GRID = gridCells(6, 4);
        const COLOR_SCALE = { fills: [{ color: 'blue' }, { color: 'red' }] };
        // An enabled shadow that casts nothing paints nothing, but keeps the cells out of the batch.
        const AS_RECTS = { shadow: { enabled: true, fill: 'transparent', blur: 0, xOffset: 0, yOffset: 0 } };
        const SELECTION = { enabled: true, selectedItem: { fill: 'lime' }, unselectedItem: { opacity: 0.3 } };

        const options = (series: Record<string, unknown> = {}, data: GridCell[] = GRID, asRects = false) =>
            prepareEnterpriseTestOptions({
                data,
                dataIdKey: 'id',
                series: [
                    {
                        type: 'heatmap' as const,
                        xKey: 'x',
                        yKey: 'y',
                        colorKey: 'v',
                        colorScale: COLOR_SCALE,
                        ...series,
                        ...(asRects ? AS_RECTS : {}),
                    },
                ],
                legend: { enabled: false },
            } as AgChartOptions);

        const heatmap = (c: ChartOrProxy<any>) => getSeriesInstance(c, HeatmapSeries);
        const batchOf = (c: ChartOrProxy<any>) =>
            [...heatmap(c).contentGroup.descendants()].find((node) => node instanceof HeatmapCellBatch);
        const isBatched = (c: ChartOrProxy<any>) => batchOf(c)?.visible === true;
        /** Counts rather than the batch itself, so a failure doesn't print every datum the batch holds. */
        const hiddenBatchSizes = (c: ChartOrProxy<any>) => {
            const batch = batchOf(c) as HeatmapCellBatch;
            return { cells: batch.size, datums: batch.datums.length };
        };
        /** The cells drawn as `Rect`s of their own, which is none while the batch paints them. */
        const rectCellCount = (c: ChartOrProxy<any>) =>
            [...heatmap(c).contentGroup.descendants()].filter((node) => node instanceof Rect).length;

        async function create(series: Record<string, unknown> = {}, data: GridCell[] = GRID, asRects = false) {
            chart = deproxy(await createEnterpriseChart(options(series, data, asRects)));
        }

        async function update(series: Record<string, unknown>, data: GridCell[], asRects: boolean) {
            await deproxy(chart).publicApi!.update(options(series, data, asRects));
            await waitForChartStability(chart);
        }

        /**
         * Paints the cells as `Rect`s, then as the batch, then as `Rect`s again on one chart (the mock canvas
         * only tracks the first), and expects the same pixels each time.
         */
        async function expectBatchMatchesRects(series: Record<string, unknown> = {}, data: GridCell[] = GRID) {
            await create(series, data, true);
            expect(isBatched(chart)).toBe(false);
            const reference = ctx.snapshot();
            expectNonBlank(reference);

            await update(series, data, false);
            expect(isBatched(chart)).toBe(true);
            expect(ctx.snapshot()).toMatchImage(reference);

            await update(series, data, true);
            expect(isBatched(chart)).toBe(false);
            expect(ctx.snapshot()).toMatchImage(reference);
        }

        /** Expects the chart's current batched paint to match the `Rect` paint of `data`, then returns to the batch. */
        async function expectCurrentMatchesRects(data: GridCell[], series: Record<string, unknown> = {}) {
            expect(isBatched(chart)).toBe(true);
            const batched = ctx.snapshot();
            expectNonBlank(batched);

            await update(series, data, true);
            expect(isBatched(chart)).toBe(false);
            expect(ctx.snapshot()).toMatchImage(batched);
            await update(series, data, false);
            expect(isBatched(chart)).toBe(true);
        }

        const cellProps = (c: ChartOrProxy<any>) =>
            (cellShapes(c) as Rect[]).map(({ fill, fillOpacity, stroke, strokeWidth, x, y, width, height }) => ({
                fill: String(fill),
                fillOpacity,
                stroke,
                strokeWidth,
                x,
                y,
                width,
                height,
            }));

        /** The cells of a chart created from `data` in one go, which has had no switch or transaction. */
        async function freshCellProps(data: GridCell[], series: Record<string, unknown> = {}) {
            const reference = deproxy(await createEnterpriseChart(options(series, data)));
            const props = cellProps(reference);
            reference.destroy();
            return props;
        }

        describe('pixel parity with Rect cells', () => {
            it('paints a colour scale as the Rects do', async () => {
                await expectBatchMatchesRects();
            });

            it('paints an itemStyler fillOpacity as the Rects do', async () => {
                const itemStyler = ({ datum }: { datum: GridCell }) => ({
                    fillOpacity: (datum.v ?? 0) % 2 === 1 ? 0.4 : 1,
                });
                await expectBatchMatchesRects({ itemStyler });
            });

            it('paints missingDataFill and an itemStyler fill as the Rects do', async () => {
                const data = GRID.map((cell, i) => (i % 5 === 0 ? { ...cell, v: null } : cell));
                const itemStyler = ({ datum }: { datum: GridCell }) => (datum.id === '2:1' ? { fill: 'magenta' } : {});
                await expectBatchMatchesRects(
                    { colorScale: { ...COLOR_SCALE, missingDataFill: '#cccccc' }, itemStyler },
                    data
                );
            });

            it('paints cells narrower than a pixel as the Rects do', async () => {
                await expectBatchMatchesRects({}, gridCells(1500, 2));
            });

            it('paints cells shorter than a pixel as the Rects do', async () => {
                await expectBatchMatchesRects({}, gridCells(2, 800));
            });

            it('paints cells at a non-crisp zoom as the Rects do', async () => {
                const zoom = { zoom: { enabled: true }, initialState: { zoom: { ratioX: { start: 0.1, end: 0.7 } } } };
                chart = deproxy(await createEnterpriseChart({ ...options({}, GRID, true), ...zoom }));
                expect(isBatched(chart)).toBe(false);
                const reference = ctx.snapshot();
                expectNonBlank(reference);

                await deproxy(chart).publicApi!.update({ ...options({}, GRID, false), ...zoom });
                await waitForChartStability(chart);
                expect(isBatched(chart)).toBe(true);
                expect(ctx.snapshot()).toMatchImage(reference);
            });
        });

        describe('data changes', () => {
            it('keeps matching the Rects across a domain change, added columns and removed cells', async () => {
                const SHIFTED = GRID.map((cell, i) => ({ ...cell, v: i === 0 ? 40 : cell.v }));
                const GROWN = [...SHIFTED, ...gridCells(8, 4).filter((cell) => cell.x === 'X6' || cell.x === 'X7')];
                const SHRUNK = GROWN.filter((cell) => cell.y !== 'Y2' && cell.x !== 'X0');

                await create();
                for (const data of [SHIFTED, GROWN, SHRUNK, GRID]) {
                    await deproxy(chart).publicApi!.updateDelta({ data });
                    await waitForChartStability(chart);
                    expect(isBatched(chart)).toBe(true);
                    expect(cellShapes(chart)).toHaveLength(data.length);
                    const batched = ctx.snapshot();
                    expectNonBlank(batched);

                    await update({}, data, true);
                    expect(isBatched(chart)).toBe(false);
                    expect(ctx.snapshot()).toMatchImage(batched);
                    await update({}, data, false);
                }
            });

            it('keeps matching the Rects across transactions that update, add and remove cells', async () => {
                const UPDATED = GRID.map((cell) => (cell.id === '1:1' ? { ...cell, v: 9 } : cell));
                const ADDED = [...UPDATED, { id: '9:0', x: 'X9', y: 'Y0', v: 3 }];
                const REMOVED = ADDED.filter((cell) => cell.id !== '0:0');
                const transactions = [
                    { data: UPDATED, transaction: { update: [{ id: '1:1', x: 'X1', y: 'Y1', v: 9 }] } },
                    { data: ADDED, transaction: { add: [{ id: '9:0', x: 'X9', y: 'Y0', v: 3 }] } },
                    { data: REMOVED, transaction: { remove: [{ id: '0:0' }] } },
                ];

                await create();
                for (const { data, transaction } of transactions) {
                    await deproxy(chart).publicApi!.applyTransaction(transaction);
                    await waitForChartStability(chart);
                    expect(cellShapes(chart)).toHaveLength(data.length);
                    await expectCurrentMatchesRects(data);
                }
            });

            it('writes only the updated cells to the batch on a transaction', async () => {
                await create();
                const set = vi.spyOn(HeatmapCellBatch.prototype, 'set');
                try {
                    await deproxy(chart).publicApi!.applyTransaction({
                        update: [{ id: '1:1', x: 'X1', y: 'Y1', v: 9 }],
                    });
                    await waitForChartStability(chart);
                    expect(set).toHaveBeenCalledTimes(1);

                    set.mockClear();
                    await deproxy(chart).publicApi!.applyTransaction({
                        update: [
                            { id: '2:2', x: 'X2', y: 'Y2', v: 3 },
                            { id: '4:0', x: 'X4', y: 'Y0', v: 8 },
                        ],
                    });
                    await waitForChartStability(chart);
                    expect(set).toHaveBeenCalledTimes(2);
                } finally {
                    set.mockRestore();
                }

                const data = GRID.map((cell) => {
                    if (cell.id === '1:1') return { ...cell, v: 9 };
                    if (cell.id === '2:2') return { ...cell, v: 3 };
                    return cell.id === '4:0' ? { ...cell, v: 8 } : cell;
                });
                expect(cellProps(chart)).toEqual(await freshCellProps(data));
                await expectCurrentMatchesRects(data);
            });

            it('moves the series to Rects and back when a transaction strokes then unstrokes a cell', async () => {
                const itemStyler = ({ datum }: { datum: GridCell }) =>
                    datum.id === '1:1' && datum.v === 9 ? { stroke: 'black', strokeWidth: 2 } : {};
                const transact = async (v: number) => {
                    await deproxy(chart).publicApi!.applyTransaction({ update: [{ id: '1:1', x: 'X1', y: 'Y1', v }] });
                    await waitForChartStability(chart);
                    return GRID.map((cell) => (cell.id === '1:1' ? { ...cell, v } : cell));
                };

                await create({ itemStyler });
                expect(isBatched(chart)).toBe(true);

                const stroked = await transact(9);
                expect(isBatched(chart)).toBe(false);
                expect(rectCellCount(chart)).toBe(GRID.length);
                expect(cellProps(chart)).toEqual(await freshCellProps(stroked, { itemStyler }));
                expect(cellShapes(chart).filter((shape) => shape.strokeWidth === 2)).toHaveLength(1);

                const plain = await transact(6);
                expect(isBatched(chart)).toBe(true);
                expect(rectCellCount(chart)).toBe(0);
                expect(cellProps(chart)).toEqual(await freshCellProps(plain, { itemStyler }));
                await expectCurrentMatchesRects(plain, { itemStyler });

                await transact(9);
                expect(isBatched(chart)).toBe(false);
            });
        });

        describe('eligibility', () => {
            const GRADIENT = { type: 'gradient', colorStops: [{ color: 'red' }, { color: 'blue' }] };
            const ineligible: Record<string, Record<string, unknown>> = {
                'a corner radius': { cornerRadius: 2 },
                'a series stroke': { stroke: 'black', strokeWidth: 2 },
                'an enabled shadow': { shadow: SHADOW },
                'a gradient fill from the itemStyler': { itemStyler: () => ({ fill: GRADIENT }) },
                'a stroke on one cell from the itemStyler': {
                    itemStyler: ({ datum }: { datum: GridCell }) =>
                        datum.id === '3:2' ? { stroke: 'black', strokeWidth: 2 } : {},
                },
            };

            it('batches plain cells, and leaves no Rect behind', async () => {
                await create();
                expect(isBatched(chart)).toBe(true);
                expect(rectCellCount(chart)).toBe(0);
                expect(cellShapes(chart)).toHaveLength(GRID.length);
            });

            it('batches a zero-width stroke and an itemStyler that only changes the fill', async () => {
                await create({ stroke: 'black', strokeWidth: 0, itemStyler: () => ({ fill: 'green' }) });
                expect(isBatched(chart)).toBe(true);
                expect(cellFills(chart)).toEqual(Array(GRID.length).fill('green'));
            });

            it('stays batched with a highlight glow, as the hovered cell is drawn by the highlight layer', async () => {
                await create({ highlight: { highlightedItem: { glow: { enabled: true } } } });
                expect(isBatched(chart)).toBe(true);
                expect(rectCellCount(chart)).toBe(0);
            });

            it('leaves the batch only while a highlight is active when the other cells glow in place', async () => {
                await create({
                    highlight: { unhighlightedItem: { glow: { enabled: true } } },
                    tooltip: { enabled: false },
                });
                expect(isBatched(chart)).toBe(true);
                expect(rectCellCount(chart)).toBe(0);

                await hoverDatumByIndex(chart, 0, 3);
                expect(isBatched(chart)).toBe(false);
                const glowing = cellShapes(chart).filter((shape) => shape.fillShadow?.enabled === true);
                expect(glowing).toHaveLength(GRID.length - 1);

                await hoverAction(1, 1)(chart);
                await waitForChartStability(chart, MIN_TOOLTIP_HIDE_DELAY);
                expect(isBatched(chart)).toBe(true);
                expect(rectCellCount(chart)).toBe(0);
                expect(cellShapes(chart)).toHaveLength(GRID.length);
            });

            it.each(Object.keys(ineligible))('paints every cell as a Rect for %s', async (name) => {
                await create(ineligible[name]);
                expect(isBatched(chart)).toBe(false);
                expect(rectCellCount(chart)).toBe(GRID.length);
                expect(cellShapes(chart)).toHaveLength(GRID.length);
            });
        });

        describe('alignment', () => {
            it('leaves the aligned geometry alone when a hover or selection only restyles the cells', async () => {
                const itemStyler = ({ highlightState }: { highlightState: string }) =>
                    highlightState === 'unhighlighted-item' ? { fillOpacity: 0.4 } : {};
                await create({
                    itemStyler,
                    selection: { ...SELECTION, selectedItem: { fill: 'lime', strokeWidth: 0 } },
                    tooltip: { enabled: false },
                });
                expect(isBatched(chart)).toBe(true);
                const align = vi.spyOn(HeatmapCellBatch.prototype, 'alignCell');

                const plain = cellShapes(chart).map((shape) => shape.fillOpacity);

                await hoverDatumByIndex(chart, 0, 0);
                expect(cellShapes(chart).map((shape) => shape.fillOpacity)).not.toEqual(plain);
                await select(5);
                expect(cellFills(chart)[5]).toBe('lime');
                expect(isBatched(chart)).toBe(true);
                expect(align).not.toHaveBeenCalled();
            });

            const BOXES = [
                [10.3, 5.2, 20.4, 8.6],
                [40.7, 5.2, 0.3, 8.6],
            ];
            const AT_RATIO_1 = [
                [10, 5, 21, 9],
                [41, 5, 1, 9],
            ];
            const AT_RATIO_2 = [
                [10.5, 5, 20, 9],
                [40.5, 5, 0.5, 9],
            ];

            function createBatch() {
                const batch = new HeatmapCellBatch();
                batch.resize(BOXES.length);
                writeBoxes(batch);
                return batch;
            }

            function writeBoxes(batch: HeatmapCellBatch) {
                for (const [index, [x, y, width, height]] of BOXES.entries()) {
                    batch.set(index, x, y, width, height, 'red', 1, 1, undefined);
                }
                batch.commit();
            }

            /** The `fillRect` calls one render of the batch makes. */
            function paint(batch: HeatmapCellBatch, devicePixelRatio: number) {
                const canvasCtx = document.createElement('canvas').getContext('2d')!;
                const fillRect = vi.spyOn(canvasCtx, 'fillRect');
                const renderCtx = {
                    ctx: canvasCtx,
                    direction: 'ltr' as const,
                    width: 100,
                    height: 50,
                    devicePixelRatio,
                    logger: testLogger,
                    debugNodes: {},
                };
                batch.preRender(renderCtx);
                batch.render(renderCtx);
                return fillRect.mock.calls;
            }

            it('realigns its cells to the device pixel grid when the pixel ratio changes', () => {
                const batch = createBatch();

                expect(paint(batch, 1)).toEqual(AT_RATIO_1);
                expect(paint(batch, 2)).toEqual(AT_RATIO_2);
                expect(paint(batch, 1)).toEqual(AT_RATIO_1);
            });

            it('realigns a cell written again after the batch shrank and grew, with its box unchanged', () => {
                const batch = createBatch();
                expect(paint(batch, 1)).toEqual(AT_RATIO_1);

                batch.resize(1);
                expect(paint(batch, 2)).toEqual(AT_RATIO_2.slice(0, 1));
                batch.resize(BOXES.length);
                writeBoxes(batch);
                expect(paint(batch, 2)).toEqual(AT_RATIO_2);
            });

            it('realigns the cells when they move', async () => {
                await create();
                const align = vi.spyOn(HeatmapCellBatch.prototype, 'alignCell');

                await deproxy(chart).publicApi!.update({ ...options(), width: 420, height: 260 });
                await waitForChartStability(chart);
                expect(align).toHaveBeenCalled();
            });
        });

        describe('switching representation', () => {
            it('moves every cell to Rects while a selection strokes one, and back when it is removed', async () => {
                const selection = {
                    ...SELECTION,
                    selectedItem: { stroke: 'black', strokeWidth: 3 },
                };
                await create({ selection, tooltip: { enabled: false } });
                expect(isBatched(chart)).toBe(true);
                const plain = ctx.snapshot();
                expectNonBlank(plain);

                await select(5);
                expect(isBatched(chart)).toBe(false);
                expect(rectCellCount(chart)).toBe(GRID.length);
                expect(cellShapes(chart).filter((shape) => shape.strokeWidth === 3)).toHaveLength(1);

                deproxy(chart).publicApi!.setSelection([]);
                await waitForChartStability(chart);
                expect(isBatched(chart)).toBe(true);
                expect(rectCellCount(chart)).toBe(0);
                expect(cellShapes(chart).filter((shape) => shape.strokeWidth > 0)).toHaveLength(0);
                expect(ctx.snapshot()).toMatchImage(plain);
            });

            it('keeps no cell or datum in the hidden batch while the cells are Rects', async () => {
                const selection = { ...SELECTION, selectedItem: { stroke: 'black', strokeWidth: 3 } };
                await create({ selection, tooltip: { enabled: false } });
                expect(hiddenBatchSizes(chart)).toEqual({ cells: GRID.length, datums: GRID.length });

                await select(5);
                expect(isBatched(chart)).toBe(false);
                expect(hiddenBatchSizes(chart)).toEqual({ cells: 0, datums: 0 });

                // Replacing the data while the batch is hidden must not bring the old node data back into it.
                void deproxy(chart).publicApi!.updateDelta({ data: GRID.slice(1) });
                await waitForChartStability(chart);
                expect(hiddenBatchSizes(chart)).toEqual({ cells: 0, datums: 0 });

                deproxy(chart).publicApi!.setSelection([]);
                await waitForChartStability(chart);
                expect(isBatched(chart)).toBe(true);
                expect(hiddenBatchSizes(chart)).toEqual({ cells: GRID.length - 1, datums: GRID.length - 1 });
            });

            it('releases the datums of a plain heatmap when corner radius replaces its data and takes it to Rects', async () => {
                await create({ tooltip: { enabled: false } });
                expect(hiddenBatchSizes(chart).datums).toBe(GRID.length);

                const next = options({ tooltip: { enabled: false }, cornerRadius: 2 }, GRID.slice(2));
                void deproxy(chart).publicApi!.update(next);
                await waitForChartStability(chart);

                expect(isBatched(chart)).toBe(false);
                expect(hiddenBatchSizes(chart)).toEqual({ cells: 0, datums: 0 });
            });

            it('moves every cell to Rects while a selection adds a gradient fill, and back when it is removed', async () => {
                const gradient = { type: 'gradient', colorStops: [{ color: 'white' }, { color: 'black' }] };
                const selectedItem = { fill: gradient, strokeWidth: 0 };
                await create({ selection: { ...SELECTION, selectedItem }, tooltip: { enabled: false } });
                expect(isBatched(chart)).toBe(true);
                const plain = ctx.snapshot();
                expectNonBlank(plain);

                await select(5);
                expect(isBatched(chart)).toBe(false);
                expect(rectCellCount(chart)).toBe(GRID.length);
                expect(cellShapes(chart).filter((shape) => typeof shape.fill !== 'string')).toHaveLength(1);

                deproxy(chart).publicApi!.setSelection([]);
                await waitForChartStability(chart);
                expect(isBatched(chart)).toBe(true);
                expect(rectCellCount(chart)).toBe(0);
                expect(cellShapes(chart).every((shape) => typeof shape.fill === 'string')).toBe(true);
                expect(ctx.snapshot()).toMatchImage(plain);
            });

            it('batches a selection that only changes fill and opacity', async () => {
                const selectedItem = { fill: 'lime', strokeWidth: 0 };
                await create({ selection: { ...SELECTION, selectedItem }, tooltip: { enabled: false } });
                await select(5);

                expect(isBatched(chart)).toBe(true);
                expect(cellFills(chart)[5]).toBe('lime');
                expect(cellShapes(chart).filter((shape) => shape.fillOpacity === 0.3)).toHaveLength(GRID.length - 1);
            });

            it('moves every cell to Rects while an itemStyler strokes cells on hover, and back after', async () => {
                const itemStyler = ({ highlightState }: { highlightState: string }) =>
                    highlightState === 'unhighlighted-item' ? { stroke: 'black', strokeWidth: 2 } : {};
                await create({ itemStyler, tooltip: { enabled: false } });
                expect(isBatched(chart)).toBe(true);
                const plain = ctx.snapshot();

                await hoverDatumByIndex(chart, 0, 0);
                expect(isBatched(chart)).toBe(false);
                expect(rectCellCount(chart)).toBe(GRID.length);

                await hoverAction(1, 1)(chart);
                await waitForChartStability(chart, MIN_TOOLTIP_HIDE_DELAY);
                expect(isBatched(chart)).toBe(true);
                expect(rectCellCount(chart)).toBe(0);
                expect(ctx.snapshot()).toMatchImage(plain);
            });

            it('follows a transaction after a switch, with no stale cells', async () => {
                await create({ selection: { ...SELECTION, selectedItem: { stroke: 'black', strokeWidth: 3 } } });
                await select(5);
                deproxy(chart).publicApi!.setSelection([]);
                await waitForChartStability(chart);
                expect(isBatched(chart)).toBe(true);

                const UPDATED = GRID.map((cell) => (cell.id === '1:1' ? { ...cell, v: 9 } : cell));
                await deproxy(chart).publicApi!.applyTransaction({ update: [{ id: '1:1', x: 'X1', y: 'Y1', v: 9 }] });
                await waitForChartStability(chart);

                const fresh = deproxy(await createEnterpriseChart(options({}, UPDATED)));
                const expected = cellFills(fresh);
                fresh.destroy();
                expect(cellFills(chart)).toEqual(expected);
            });

            it('switches between representations when an option is updated', async () => {
                await create();
                expect(isBatched(chart)).toBe(true);

                await update({ cornerRadius: 2 }, GRID, false);
                expect(isBatched(chart)).toBe(false);
                expect(rectCellCount(chart)).toBe(GRID.length);
                expect(cellShapes(chart)).toHaveLength(GRID.length);

                await update({}, GRID, false);
                expect(isBatched(chart)).toBe(true);
                expect(rectCellCount(chart)).toBe(0);
                expect(cellShapes(chart)).toHaveLength(GRID.length);
            });
        });

        describe('interaction', () => {
            const highlightedIndex = (c: ChartOrProxy<any>) =>
                deproxy(c).ctx.highlightManager.getActiveHighlight()?.datumIndex;

            it('shows the tooltip and highlights the hovered cell', async () => {
                await create();
                expect(isBatched(chart)).toBe(true);

                for (const datumIndex of [0, 7, GRID.length - 1]) {
                    await hoverDatumByIndex(chart, 0, datumIndex);
                    expect(isTooltipVisible(deproxy(chart))).toBe(true);
                    expect(highlightedIndex(chart)).toBe(datumIndex);
                    const highlighted = collectShapes(heatmap(chart).highlightNodeGroup).filter(
                        (shape) => shape.visible
                    );
                    expect(highlighted).toHaveLength(1);
                    expect(highlighted[0].fill).toBe(cellFills(chart)[datumIndex]);
                }
            });

            it('dims the cells as the Rects do while a cell is highlighted, and restores them after', async () => {
                const series = { highlight: { unhighlightedItem: { opacity: 0.4 } }, tooltip: { enabled: false } };
                const hoverOpacities = async () => {
                    await hoverDatumByIndex(chart, 0, 3);
                    return cellShapes(chart).map((shape) => shape.fillOpacity);
                };

                await create(series);
                expect(isBatched(chart)).toBe(true);
                const batched = await hoverOpacities();
                expect(batched).toContain(0.4);

                await hoverAction(1, 1)(chart);
                await waitForChartStability(chart, MIN_TOOLTIP_HIDE_DELAY);
                expect(cellShapes(chart).map((shape) => shape.fillOpacity)).toEqual(Array(GRID.length).fill(1));

                const asRects = { ...series, ...AS_RECTS };
                await update(asRects, GRID, false);
                expect(isBatched(chart)).toBe(false);
                expect(await hoverOpacities()).toEqual(batched);
            });

            it('picks the same cell as the Rects at cell centres, corners and outside the cells', async () => {
                const data = GRID.map((cell, i) => (i === 9 ? { ...cell, v: null } : cell));
                await create({}, data);
                const series = heatmap(chart);
                const { width, height } = series.getNodeData()![9];
                const points = [
                    ...[0, 5, 9, 14, GRID.length - 1].map((index) => ({
                        dx: 0,
                        dy: 0,
                        datum: series.getNodeData()![index],
                    })),
                    { dx: width / 2 - 1, dy: height / 2 - 1, datum: series.getNodeData()![9] },
                    { dx: -width / 2 + 1, dy: -height / 2 + 1, datum: series.getNodeData()![9] },
                    { dx: 0, dy: -height * 20, datum: series.getNodeData()![9] },
                ];

                const pick = async () => {
                    const picks: (number | undefined)[] = [];
                    for (const { dx, dy, datum } of points) {
                        const { canvasX, canvasY } = Transformable.toCanvasPoint(
                            series.contentGroup,
                            datum.point.x + dx,
                            datum.point.y + dy
                        );
                        await hoverAction(canvasX, canvasY)(chart);
                        await waitForChartStability(chart, MIN_TOOLTIP_HIDE_DELAY);
                        picks.push(highlightedIndex(chart));
                    }
                    return picks;
                };

                expect(isBatched(chart)).toBe(true);
                const batched = await pick();
                await update({}, data, true);
                expect(isBatched(chart)).toBe(false);
                const rects = await pick();

                expect(batched).toEqual(rects);
                expect(batched.slice(0, 5).filter((index) => index != null).length).toBeGreaterThan(0);
            });

            it('emits seriesNodeClick for the clicked cell', async () => {
                const seriesNodeClick = vi.fn();
                await create({ listeners: { seriesNodeClick } });
                expect(isBatched(chart)).toBe(true);
                const series = heatmap(chart);
                const datum = series.getNodeData()![7];
                const { canvasX, canvasY } = Transformable.toCanvasPoint(
                    series.contentGroup,
                    datum.point.x,
                    datum.point.y
                );

                await clickAction(canvasX, canvasY)(chart);
                await waitForChartStability(chart);

                expect(seriesNodeClick).toHaveBeenCalledTimes(1);
                expect(seriesNodeClick.mock.calls[0][0].datum).toMatchObject({ id: GRID[7].id });
            });

            it('moves the keyboard focus across batched cells', async () => {
                await create({ label: { enabled: true } });
                expect(isBatched(chart)).toBe(true);

                await tabIntoChart(chart);
                await pressKey(chart, 'ArrowRight');
                const first = highlightedIndex(chart);
                await pressKey(chart, 'ArrowRight');
                const second = highlightedIndex(chart);

                expect(first).toBeDefined();
                expect(second).toBeDefined();
                expect(second).not.toBe(first);
                expect(isTooltipVisible(deproxy(chart))).toBe(true);
            });
        });

        describe('scene output', () => {
            const SVG_IDS = /id="[^"]*"|url\(#[^)]*\)/g;
            const toSvg = (c: ChartOrProxy<any>) => deproxy(c).ctx.scene.toSVG()!.replace(SVG_IDS, '');

            it('collects one shape per cell of a batch too large to pass as call arguments', () => {
                const CELLS = 250_000;
                const batch = new HeatmapCellBatch();
                batch.resize(CELLS);
                for (let index = 0; index < CELLS; index++) batch.set(index, index, 0, 1, 1, 'red', 1, 1, undefined);
                batch.commit();
                const root = new Group();
                root.appendChild(batch);

                expect(collectShapes(root)).toHaveLength(CELLS);
            });

            it('serialises to the same SVG as the Rects', async () => {
                const itemStyler = ({ datum }: { datum: GridCell }) => ({
                    fillOpacity: (datum.v ?? 0) % 2 === 1 ? 0.4 : 1,
                });
                await create({ itemStyler });
                expect(isBatched(chart)).toBe(true);
                const batched = toSvg(chart);

                await update({ itemStyler }, GRID, true);
                expect(isBatched(chart)).toBe(false);

                expect(toSvg(chart)).toBe(batched);
                expect(batched.match(/<path /g)!.length).toBeGreaterThanOrEqual(GRID.length);
            });

            it('reports one scene geometry entry per cell, as the Rects do', async () => {
                // The `Rect` path also keeps hidden rects for highlights, whose keys are not the cells' keys.
                const visibleCells = () =>
                    [...createSceneGeometrySampler(chart)()]
                        .filter(([key, props]) => key.startsWith('series[0]/rect[') && props.visible === 1)
                        .map(([, { x, y, width, height }]) => JSON.stringify({ x, y, width, height }))
                        .sort((a, b) => a.localeCompare(b));

                await create();
                const batched = visibleCells();
                expect(isBatched(chart)).toBe(true);
                expect(batched).toHaveLength(GRID.length);

                await update({}, GRID, true);
                expect(isBatched(chart)).toBe(false);
                expect(visibleCells()).toEqual(batched);
            });
        });
    });
});
