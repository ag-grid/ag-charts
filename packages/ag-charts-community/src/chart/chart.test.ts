import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';

import { ChartAxisDirection, ChartUpdateType, ambientLogger } from 'ag-charts-core';
import { Caster, classCast, testLogger } from 'ag-charts-test';
import type {
    AgCartesianChartOptions,
    AgChartValidationsOptions,
    AgLineSeriesOptions,
    AgPolarChartOptions,
    InteractionRange,
} from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import { BBox } from '../scene/bbox';
import type { Node } from '../scene/node';
import { Selection } from '../scene/selection';
import { Rect } from '../scene/shape/rect';
import { Sector } from '../scene/shape/sector';
import { Transformable } from '../scene/transformable';
import type { Chart } from './chart';
import type { AgChartProxy } from './chartProxy';
import { DataSet } from './data/dataSet';
import { Marker } from './marker/marker';
import { LineSeries } from './series/cartesian/lineSeries';
import {
    MIN_TOOLTIP_HIDE_DELAY,
    clickAction,
    createChart,
    deproxy,
    doubleClickAction,
    expectWarningsCalls,
    hoverAction,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';

describe('Chart', () => {
    setupMockConsole();

    let chart: Chart;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    setupMockCanvas();

    describe('DataSet logger threading', () => {
        it('routes DataSet validation warnings through the chart-scoped logger, not the module fallback', async () => {
            const chartProxy = AgCharts.create(
                prepareTestOptions({
                    data: [],
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                } as AgCartesianChartOptions)
            );
            chart = deproxy(chartProxy);
            await waitForChartStability(chart);

            // updateDelta re-creates chart.data via createDataSet, wiring the chart's ctx.logger into the DataSet.
            await chartProxy.updateDelta({
                data: [
                    { x: 'a', y: 1 },
                    { x: 'b', y: 2 },
                ],
            });
            await waitForChartStability(chart);

            const scopedWarnOnce = vi.spyOn(chart.ctx.logger, 'warnOnce').mockImplementation(() => {});
            const fallbackWarnOnce = vi.spyOn(ambientLogger, 'warnOnce').mockImplementation(() => {});

            chart.data.addTransaction({ remove: [{ x: 'not-present', y: 9 }] });
            chart.data.commitPendingTransactions(undefined);

            expect(scopedWarnOnce).toHaveBeenCalledWith(
                'applyTransaction() remove includes items not present in current data; ignoring missing items.'
            );
            expect(fallbackWarnOnce).not.toHaveBeenCalled();
        });

        it('keeps a single Logger across a chart-type switch', async () => {
            const chartProxy = AgCharts.create(
                prepareTestOptions({ series: [{ type: 'bar', xKey: 'x', yKey: 'y' }], data: [{ x: 'a', y: 1 }] })
            ) as unknown as AgChartProxy;
            chart = deproxy(chartProxy);
            await waitForChartStability(chart);

            await chartProxy.update(
                prepareTestOptions({ series: [{ type: 'line', xKey: 'x', yKey: 'y' }], data: [{ x: 'a', y: 1 }] })
            );
            chart = deproxy(chartProxy);
            await waitForChartStability(chart);

            // The options carry the Logger that validation reported through; the chart owns the one
            // everything else uses. A pooled instance arrives with its own, so these can diverge.
            expect(chart.getChartOptions().logger).toBe(chart.ctx.logger);
        });
    });

    const datasets = {
        economy: {
            data: [
                { year: '2018', gdp: 12000, gnp: 10000 },
                { year: '2019', gdp: 18000, gnp: 16000 },
                { year: '2020', gdp: 20000, gnp: 18000 },
            ],
            valueKey: 'gdp',
            valueKey2: 'gnp',
            categoryKey: 'year',
        },
        food: {
            data: {
                name: 'Food',
                children: [
                    {
                        name: 'Fruits',
                        children: [
                            { name: 'Banana', count: 10 },
                            { name: 'Apple', count: 5 },
                        ],
                    },
                    {
                        name: 'Vegetables',
                        children: [{ name: 'Cucumber', count: 2 }],
                    },
                ],
            },
            valueKey: 'count',
            labelKey: 'name',
        },
    };

    const testPointerEvents = (testParams: {
        seriesOptions: any;
        chartOptions?: any;
        getNodeData: (series: any) => any[];
        getNodePoint: (nodeItem: any) => [number, number];
        getNodeExitPoint: (nodeItem: any) => [number, number];
        getDatumValues: (datum: any, series: any) => any[];
        getTooltipRenderedValues: (tooltipRendererParams: any) => any[];
        getHighlightNode: (chart: any, series: any) => any;
    }) => {
        const format = (...values: any[]) => values.join(' ');

        const createChartPreset = async (params: {
            hasTooltip: boolean;
            onNodeClick?: () => void;
            nodeClickRange?: InteractionRange;
        }): Promise<Chart> => {
            const tooltip = params.hasTooltip
                ? {
                      ...(testParams.seriesOptions.tooltip ?? {}),
                      renderer(rParams: any) {
                          const values = testParams.getTooltipRenderedValues(rParams);
                          return format(...values);
                      },
                  }
                : { enabled: false };

            const listeners = params.onNodeClick ? { seriesNodeClick: params.onNodeClick } : undefined;
            const nodeClickRangeParams = params.nodeClickRange ? { nodeClickRange: params.nodeClickRange } : {};
            const options: AgCartesianChartOptions | AgPolarChartOptions = {
                container: document.body,
                series: [
                    {
                        tooltip,
                        highlight: { highlightedItem: { fill: 'lime' } },
                        listeners,
                        ...nodeClickRangeParams,
                        ...testParams.seriesOptions,
                    },
                ],
                ...(testParams.chartOptions ?? {}),
            };
            return createChart(options);
        };

        const hoverChartNodes = async (
            chartInstance: Chart,
            iterator: (params: { series: any; item: any; x: number; y: number }) => Promise<void> | void
        ) => {
            for (const series of chartInstance.series) {
                const nodeData = testParams.getNodeData(series);
                expect(nodeData.length).toBeGreaterThan(0);
                for (const item of nodeData) {
                    const itemPoint = testParams.getNodePoint(item);
                    const { canvasX: x, canvasY: y } = Transformable.toCanvasPoint(
                        series.contentGroup,
                        itemPoint[0],
                        itemPoint[1]
                    );
                    await hoverAction(x, y)(chartInstance);
                    await waitForChartStability(chartInstance);
                    await iterator({ series, item, x, y });
                }
            }
        };

        const checkHighlight = async (chartInstance: Chart) => {
            await hoverChartNodes(chartInstance, ({ series }) => {
                const highlightNode = testParams.getHighlightNode(chartInstance, series);
                expect(highlightNode).toBeDefined();
                expect(highlightNode.fill).toEqual('lime');
            });
        };

        const checkNodeClick = async (
            chartInstance: Chart,
            onNodeClick: () => void,
            offsetX?: boolean,
            offsetY?: boolean
        ) => {
            await hoverChartNodes(chartInstance, async ({ x, y }) => {
                const seriesAreaCenter = (chartInstance as any).seriesRect.computeCenter();

                if (offsetX) {
                    x += x < seriesAreaCenter.x ? 5 : -5;
                }
                if (offsetY) {
                    y += y < seriesAreaCenter.y ? 5 : -5;
                }
                await clickAction(x, y)(chartInstance);
                await waitForChartStability(chartInstance);
            });

            const nodeCount = chartInstance.series.reduce(
                (sum, series) => sum + testParams.getNodeData(series).length,
                0
            );
            expect(onNodeClick).toHaveBeenCalledTimes(nodeCount);
        };

        const checkMouseUpOnlyClick = async (
            chartInstance: Chart,
            onNodeClick: () => void,
            nodeExit: (item: any) => [number, number]
        ) => {
            await hoverChartNodes(chartInstance, async ({ item, x, y }) => {
                const [downX, downY] = nodeExit(item);
                await clickAction(x, y, { mousedown: { offsetX: downX, offsetY: downY } })(chartInstance);
                await waitForChartStability(chartInstance);
            });

            expect(onNodeClick).toHaveBeenCalledTimes(0);
        };

        it(`should render tooltip correctly`, async () => {
            chart = await createChartPreset({ hasTooltip: true });
            await hoverChartNodes(chart, ({ series, item }) => {
                const tooltip = document.querySelector('.ag-charts-tooltip');
                expect(tooltip).toBeInstanceOf(HTMLElement);
                expect(!tooltip?.hasAttribute('data-presented-as-popover')).toBe(false);

                const values = testParams.getDatumValues(item, series);
                expect(tooltip?.textContent).toEqual(format(...values));
            });

            // Check the tooltip is hidden (wait for delayed removal to complete)
            await hoverAction(0, 0)(chart);
            await waitForChartStability(chart, MIN_TOOLTIP_HIDE_DELAY);
            const tooltip = document.querySelector('.ag-charts-tooltip');
            expect(!tooltip?.hasAttribute('data-presented-as-popover')).toBe(true);
        });

        it(`should highlight hovered items`, async () => {
            chart = await createChartPreset({ hasTooltip: true });
            await checkHighlight(chart);
        });

        it(`should handle nodeClick event`, async () => {
            const onNodeClick = vi.fn();
            chart = await createChartPreset({ hasTooltip: true, onNodeClick });
            await checkNodeClick(chart, onNodeClick);
        });

        it(`should highlight hovered items when tooltip is disabled`, async () => {
            chart = await createChartPreset({ hasTooltip: false });
            await checkHighlight(chart);
        });

        it(`should handle nodeClick event when tooltip is disabled`, async () => {
            const onNodeClick = vi.fn();
            chart = await createChartPreset({ hasTooltip: false, onNodeClick });
            await checkNodeClick(chart, onNodeClick);
        });

        it(`should handle nodeClick event with offset click when range is 'nearest'`, async () => {
            const onNodeClick = vi.fn();
            chart = await createChartPreset({ hasTooltip: true, onNodeClick, nodeClickRange: 'nearest' });
            await checkNodeClick(chart, onNodeClick, true, true);
        });

        it(`should handle nodeClick event with offset click when range is within pixel distance`, async () => {
            const onNodeClick = vi.fn();
            chart = await createChartPreset({ hasTooltip: true, onNodeClick, nodeClickRange: 6 });
            await waitForChartStability(chart);
            await checkNodeClick(chart, onNodeClick, false, true);
        });

        it(`should trigger nodeClick event only on mousedown and mouseup`, async () => {
            const onNodeClick = vi.fn();
            chart = await createChartPreset({ hasTooltip: true });
            await waitForChartStability(chart);
            await checkMouseUpOnlyClick(chart, onNodeClick, testParams.getNodeExitPoint);
        });
    };

    const cartesianTestParams = {
        getNodeData: (series) => series.contextNodeData?.nodeData ?? [],
        getTooltipRenderedValues: (params) => [params.datum[params.xKey], params.datum[params.yKey]],
        // Returns a highlighted marker
        getHighlightNode: (_, series) => series.highlightNodeGroup.children().next().value,
    } as Parameters<typeof testPointerEvents>[0];

    describe(`Line Series Pointer Events`, () => {
        testPointerEvents({
            ...cartesianTestParams,
            seriesOptions: {
                type: 'line',
                data: datasets.economy.data,
                xKey: datasets.economy.categoryKey,
                yKey: datasets.economy.valueKey,
            },
            getNodePoint: (item) => [item.point.x, item.point.y],
            getNodeExitPoint: (item) => [item.point.x, item.point.y + 8],
            getDatumValues: (item, series) => {
                const xValue = item.datum[series.properties['xKey']];
                const yValue = item.datum[series.properties['yKey']];
                return [xValue, yValue];
            },
        });
    });

    // A markerless series' node is the point on the line where the marker would have been.
    describe(`Markerless Line Series node interactions (AG-10226)`, () => {
        const createMarkerlessLineChart = async (listeners: any) =>
            createChart({
                container: document.body,
                data: datasets.economy.data,
                series: [
                    {
                        type: 'line',
                        xKey: datasets.economy.categoryKey,
                        yKey: datasets.economy.valueKey,
                        marker: { enabled: false },
                        listeners,
                    },
                ],
            } as AgCartesianChartOptions);

        const nodeCanvasPoint = (chartInstance: Chart, datumIndex: number) => {
            const series = chartInstance.series[0] as any;
            const item = series.contextNodeData.nodeData[datumIndex];
            expect(item).toBeDefined();
            return Transformable.toCanvasPoint(series.contentGroup, item.point.x, item.point.y);
        };

        it(`should handle nodeClick event at a datum's notional marker position`, async () => {
            const seriesNodeClick = vi.fn();
            chart = await createMarkerlessLineChart({ seriesNodeClick });

            const { canvasX, canvasY } = nodeCanvasPoint(chart, 1);
            await clickAction(canvasX, canvasY)(chart);
            await waitForChartStability(chart);

            expect(seriesNodeClick).toHaveBeenCalledTimes(1);
            expect(seriesNodeClick.mock.calls[0][0].datum).toEqual(datasets.economy.data[1]);
        });

        it(`should not handle nodeClick event well outside the markerless pick range`, async () => {
            const seriesNodeClick = vi.fn();
            chart = await createMarkerlessLineChart({ seriesNodeClick });

            const { canvasX, canvasY } = nodeCanvasPoint(chart, 1);
            await clickAction(canvasX, canvasY + 60)(chart);
            await waitForChartStability(chart);

            expect(seriesNodeClick).not.toHaveBeenCalled();
        });

        it(`should handle nodeDoubleClick event at a datum's notional marker position`, async () => {
            const seriesNodeDoubleClick = vi.fn();
            chart = await createMarkerlessLineChart({ seriesNodeDoubleClick });

            const { canvasX, canvasY } = nodeCanvasPoint(chart, 1);
            await doubleClickAction(canvasX, canvasY)(chart);
            await waitForChartStability(chart);

            expect(seriesNodeDoubleClick).toHaveBeenCalledTimes(1);
            expect(seriesNodeDoubleClick.mock.calls[0][0].datum).toEqual(datasets.economy.data[1]);
        });

        it(`should not handle nodeDoubleClick event well outside the markerless pick range`, async () => {
            const seriesNodeDoubleClick = vi.fn();
            chart = await createMarkerlessLineChart({ seriesNodeDoubleClick });

            const { canvasX, canvasY } = nodeCanvasPoint(chart, 1);
            await doubleClickAction(canvasX, canvasY + 60)(chart);
            await waitForChartStability(chart);

            expect(seriesNodeDoubleClick).not.toHaveBeenCalled();
        });
    });

    describe(`Markerless Area Series node interactions (AG-10226)`, () => {
        const createMarkerlessAreaChart = async (listeners: any) =>
            createChart({
                container: document.body,
                data: datasets.economy.data,
                series: [
                    {
                        type: 'area',
                        xKey: datasets.economy.categoryKey,
                        yKey: datasets.economy.valueKey,
                        marker: { enabled: false },
                        listeners,
                    },
                ],
            } as AgCartesianChartOptions);

        const nodeCanvasPoint = (chartInstance: Chart, datumIndex: number) => {
            const series = chartInstance.series[0] as any;
            const item = series.contextNodeData.nodeData[datumIndex];
            expect(item).toBeDefined();
            return Transformable.toCanvasPoint(series.contentGroup, item.point.x, item.point.y);
        };

        it(`should handle nodeClick event at a datum's notional marker position`, async () => {
            const seriesNodeClick = vi.fn();
            chart = await createMarkerlessAreaChart({ seriesNodeClick });

            const { canvasX, canvasY } = nodeCanvasPoint(chart, 1);
            await clickAction(canvasX, canvasY)(chart);
            await waitForChartStability(chart);

            expect(seriesNodeClick).toHaveBeenCalledTimes(1);
            expect(seriesNodeClick.mock.calls[0][0].datum).toEqual(datasets.economy.data[1]);
        });

        it(`should not handle nodeClick event elsewhere in the series fill`, async () => {
            const seriesNodeClick = vi.fn();
            chart = await createMarkerlessAreaChart({ seriesNodeClick });

            const { canvasX, canvasY } = nodeCanvasPoint(chart, 1);
            await clickAction(canvasX, canvasY + 60)(chart);
            await waitForChartStability(chart);

            expect(seriesNodeClick).not.toHaveBeenCalled();
        });
    });

    describe(`Area Series Pointer Events`, () => {
        testPointerEvents({
            ...cartesianTestParams,
            seriesOptions: {
                type: 'area',
                data: datasets.economy.data,
                xKey: datasets.economy.categoryKey,
                yKey: datasets.economy.valueKey,
                marker: {
                    enabled: true,
                },
            },
            getNodePoint: (item) => [item.point.x, item.point.y],
            getNodeExitPoint: (item) => [item.point.x, item.point.y + 8],
            getDatumValues: (item, series) => {
                const xValue = item.datum[series.properties.xKey];
                const yValue = item.datum[series.properties.yKey];
                return [xValue, yValue];
            },
        });
    });

    describe(`Scatter Series Pointer Events`, () => {
        testPointerEvents({
            ...cartesianTestParams,
            seriesOptions: {
                type: 'scatter',
                data: datasets.economy.data,
                xKey: datasets.economy.categoryKey,
                yKey: datasets.economy.valueKey,
            },
            chartOptions: {
                axes: {
                    y: { type: 'number', position: 'left' },
                    x: { type: 'category', position: 'bottom' },
                },
            },
            getNodePoint: (item) => [item.point.x, item.point.y],
            getNodeExitPoint: (item) => [item.point.x, item.point.y + 8],
            getDatumValues: (item, series) => {
                const xValue = item.datum[series.properties['xKey']];
                const yValue = item.datum[series.properties['yKey']];
                return [xValue, yValue];
            },
        });
    });

    describe(`Bar Series Pointer Events`, () => {
        testPointerEvents({
            ...cartesianTestParams,
            seriesOptions: {
                type: 'bar',
                data: datasets.economy.data,
                xKey: datasets.economy.categoryKey,
                yKey: datasets.economy.valueKey,
                tooltip: { enabled: true },
            },
            chartOptions: {
                tooltip: { enabled: false },
            },
            getNodePoint: (item) => [item.x + item.width / 2, item.y + item.height / 2],
            getNodeExitPoint: (item) => [item.x + item.width / 2, item.y + item.height + 8],
            getDatumValues: (item, series) => {
                const xValue = item.datum[series.properties.xKey];
                const yValue = item.datum[series.properties.yKey];
                return [xValue, yValue];
            },
        });
    });

    describe(`Pie Series Pointer Events`, () => {
        testPointerEvents({
            seriesOptions: {
                type: 'pie',
                data: datasets.economy.data,
                angleKey: datasets.economy.valueKey,
                sectorLabelKey: datasets.economy.categoryKey,
            },
            getNodeData: (series) => series.labelSelection.nodes(),
            getNodePoint: (item) => [item.x, item.y],
            getNodeExitPoint: (_item) => [20, 20],
            getDatumValues: (item, series) => {
                const category = item.datum.datum[series.properties.sectorLabelKey];
                const value = item.datum.datum[series.properties.angleKey];
                return [category, value];
            },
            getTooltipRenderedValues: (params) => [params.datum[params.sectorLabelKey], params.datum[params.angleKey]],
            getHighlightNode: (chartInstance, series) => {
                // Returns a highlighted sector
                const highlightedDatum = chartInstance.ctx.highlightManager.getActiveHighlight();
                for (const child of series.highlightNodeGroup.children()) {
                    if (child.datum?.itemId === highlightedDatum.itemId) {
                        return child;
                    }
                }
            },
        });
    });

    describe('Chart data change', () => {
        const testDataUpdate = async (testOptions: { seriesOptions: any; getNodes: (chart: Chart) => Node[] }) => {
            const chartOptions = prepareTestOptions<{
                data: { year: string; gdp: number; gnp: number }[];
                series: any[];
            }>({
                data: [],
                series: [testOptions.seriesOptions],
            });
            const chartProxy = AgCharts.create(chartOptions);
            chart = deproxy(chartProxy);
            await waitForChartStability(chart);
            expect(testOptions.getNodes(chart).length).toEqual(0);

            await chartProxy.updateDelta({
                data: datasets.economy.data,
            });
            await waitForChartStability(chart);
            expect(testOptions.getNodes(chart).length).toEqual(3);

            await chartProxy.updateDelta({
                data: datasets.economy.data.slice(0, 2),
            });
            await waitForChartStability(chart);
            expect(testOptions.getNodes(chart).length).toEqual(2);

            await chartProxy.updateDelta({
                data: datasets.economy.data,
            });
            await waitForChartStability(chart);
            expect(testOptions.getNodes(chart).length).toEqual(3);
        };

        it('Line Chart should render correctly after update', async () => {
            await testDataUpdate({
                seriesOptions: {
                    type: 'line',
                    xKey: datasets.economy.categoryKey,
                    yKey: datasets.economy.valueKey,
                },
                getNodes: (chartInstance) => Selection.selectByClass(chartInstance.series[0].contentGroup, Marker),
            });
        });

        it('Column Chart should render correctly after update', async () => {
            await testDataUpdate({
                seriesOptions: {
                    type: 'bar',
                    xKey: datasets.economy.categoryKey,
                    yKey: datasets.economy.valueKey,
                },
                getNodes: (chartInstance) => Selection.selectByClass(chartInstance.series[0].contentGroup, Rect),
            });
        });

        it('Area Chart should render correctly after update', async () => {
            await testDataUpdate({
                seriesOptions: {
                    type: 'area',
                    xKey: datasets.economy.categoryKey,
                    yKey: datasets.economy.valueKey,
                    marker: {
                        enabled: true,
                    },
                },
                getNodes: (chartInstance) => Selection.selectByClass(chartInstance.series[0].contentGroup, Marker),
            });
        });

        it('Scatter Chart should render correctly after update', async () => {
            await testDataUpdate({
                seriesOptions: {
                    type: 'scatter',
                    xKey: datasets.economy.valueKey,
                    yKey: datasets.economy.valueKey,
                },
                getNodes: (chartInstance) => Selection.selectByClass(chartInstance.series[0].contentGroup, Marker),
            });
        });

        it('Pie Chart should render correctly after update', async () => {
            await testDataUpdate({
                seriesOptions: {
                    type: 'pie',
                    calloutLabelKey: datasets.economy.categoryKey,
                    angleKey: datasets.economy.valueKey,
                },
                getNodes: (chartInstance) => Selection.selectByClass(chartInstance.series[0].contentGroup, Sector),
            });
        });

        it('should clone supplied data array when using updateDelta()', async () => {
            const chartOptions = prepareTestOptions<{
                data: { year: string; gdp: number }[];
                series: any[];
            }>({
                data: [],
                series: [
                    {
                        type: 'line',
                        xKey: 'year',
                        yKey: 'gdp',
                    },
                ],
            });

            const chartProxy = AgCharts.create(chartOptions);
            chart = deproxy(chartProxy);
            await waitForChartStability(chart);

            const sourceData = [
                { year: '2018', gdp: 10 },
                { year: '2019', gdp: 20 },
            ];

            await chartProxy.updateDelta({ data: sourceData });
            await waitForChartStability(chart);

            expect(chart.data.data).not.toBe(sourceData);
            const lengthBeforeMutation = chart.data.data.length;

            sourceData.push({ year: '2020', gdp: 30 });

            expect(chart.data.data.length).toBe(lengthBeforeMutation);
        });

        // updateDelta must not reset data accumulated via applyTransaction.
        it('should preserve applyTransaction data when updateDelta changes series options', async () => {
            const initialData = [
                { x: 0, y: 10 },
                { x: 1, y: 20 },
            ];

            const options = prepareTestOptions<{
                data: { x: number; y: number }[];
                series: any[];
            }>({
                data: initialData,
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        connectMissingData: false,
                    },
                ],
            });

            const chartProxy = AgCharts.create(options);
            chart = deproxy(chartProxy);
            await waitForChartStability(chart);
            expect(chart.data.data.length).toBe(2);

            await chartProxy.updateDelta({
                data: [
                    { x: 0, y: 10 },
                    { x: 1, y: 20 },
                    { x: 2, y: 30 },
                ],
            });
            await waitForChartStability(chart);
            expect(chart.data.data.length).toBe(3);

            await chartProxy.updateDelta({ data: initialData });
            await waitForChartStability(chart);
            expect(chart.data.data.length).toBe(2);

            // At this point, DataSet.data and userOptions.data may have different references
            await chartProxy.applyTransaction({
                add: [
                    { x: 2, y: 30 },
                    { x: 3, y: 40 },
                ],
            });
            await waitForChartStability(chart);
            expect(chart.data.data.length).toBe(4);

            await chartProxy.updateDelta({
                series: options.series.map((s) => ({ ...s, connectMissingData: true })),
            });
            await waitForChartStability(chart);

            // Data should still have 4 items (not reset to initial 2)
            expect(chart.data.data.length).toBe(4);
            expect(chart.data.data).toEqual([
                { x: 0, y: 10 },
                { x: 1, y: 20 },
                { x: 2, y: 30 },
                { x: 3, y: 40 },
            ]);
        });
    });

    describe('Chart data inherited by Series', () => {
        async function createSeriesTestChart(options: object) {
            const chartOptions = prepareTestOptions(options);
            const chartProxy = AgCharts.create(chartOptions) as AgChartProxy;
            chart = deproxy(chartProxy);
            await waitForChartStability(chart);
            return { chartProxy, chartOptions };
        }

        async function updateChart(chartProxy: AgChartProxy, options: object) {
            const chartOptions = prepareTestOptions(options);
            await chartProxy.update(chartOptions);
            await waitForChartStability(deproxy(chartProxy));
        }

        it('Chart data inherited only when Series data is not defined ', async () => {
            const moreData = datasets.economy.data;
            const lessData = datasets.economy.data.slice(0, 2);
            const { chartProxy } = await createSeriesTestChart({
                data: moreData,
                series: [
                    {
                        type: 'line',
                        xKey: datasets.economy.categoryKey,
                        yKey: datasets.economy.valueKey,
                    },
                    {
                        type: 'line',
                        data: lessData,
                        xKey: datasets.economy.categoryKey,
                        yKey: datasets.economy.valueKey2,
                    },
                ],
            });
            expect(chart.data).toEqual(DataSet.wrap(moreData, testLogger));
            expect(chart.series[0].data).toEqual(DataSet.wrap(moreData, testLogger));
            expect(chart.series[1].data).toEqual(DataSet.wrap(lessData, testLogger));

            await updateChart(chartProxy, {
                data: moreData,
                series: [
                    {
                        type: 'line',
                        data: lessData,
                        xKey: datasets.economy.categoryKey,
                        yKey: datasets.economy.valueKey,
                    },
                    {
                        type: 'line',
                        xKey: datasets.economy.categoryKey,
                        yKey: datasets.economy.valueKey2,
                    },
                ],
            });

            expect(chart.data).toEqual(DataSet.wrap(moreData, testLogger));
            expect(chart.series[0].data).toEqual(DataSet.wrap(lessData, testLogger));
            expect(chart.series[1].data).toEqual(DataSet.wrap(moreData, testLogger));

            await updateChart(chartProxy, {
                data: moreData,
                series: [
                    {
                        type: 'line',
                        xKey: datasets.economy.categoryKey,
                        yKey: datasets.economy.valueKey,
                    },
                    {
                        type: 'line',
                        xKey: datasets.economy.categoryKey,
                        yKey: datasets.economy.valueKey2,
                    },
                ],
            });

            expect(chart.series[0].data).toEqual(chart.data);
            expect(chart.series[1].data).toEqual(chart.data);
        });
    });

    describe('preSeriesUpdate', () => {
        const baseOptions: AgCartesianChartOptions = {
            container: document.body,
            data: datasets.economy.data,
            series: [
                {
                    type: 'line',
                    xKey: datasets.economy.categoryKey,
                    yKey: datasets.economy.valueKey,
                },
            ],
        };

        it('dispatches required range ratio based on seriesRect and direction', async () => {
            chart = await createChart(baseOptions);
            const chartAny = chart as any;
            let capturedEvent: { requiredRangeRatio: number; requiredRangeDirection: ChartAxisDirection } | undefined;

            chartAny.ctx.eventsHub.on('update:pre-series', (event: any) => {
                capturedEvent = event;
            });

            chartAny.seriesRect = new BBox(0, 0, 200, 100);
            chartAny._requiredRange = 50;
            chartAny._requiredRangeDirection = ChartAxisDirection.Y;

            chartAny.preSeriesUpdate();

            expect(capturedEvent).toBeDefined();
            expect(capturedEvent?.requiredRangeDirection).toBe(ChartAxisDirection.Y);
            expect(capturedEvent?.requiredRangeRatio).toBeCloseTo(0.5, 5);
        });

        it('falls back to 0 when the ratio is NaN', async () => {
            chart = await createChart(baseOptions);
            const chartAny = chart as any;
            let capturedEvent: { requiredRangeRatio: number } | undefined;

            chartAny.ctx.eventsHub.on('update:pre-series', (event: any) => {
                capturedEvent = event;
            });

            chartAny.seriesRect = new BBox(0, 0, 0, 0);
            chartAny._requiredRange = 0;
            chartAny._requiredRangeDirection = ChartAxisDirection.X;

            chartAny.preSeriesUpdate();

            expect(capturedEvent?.requiredRangeRatio).toBe(0);
        });
    });

    describe('Chart lifecycle', () => {
        let agChartInstance: AgChartProxy;

        beforeEach(async () => {
            const options: AgCartesianChartOptions | AgPolarChartOptions = prepareTestOptions({
                container: document.body,
                series: [
                    {
                        type: 'line',
                        data: datasets.economy.data,
                        xKey: datasets.economy.categoryKey,
                        yKey: datasets.economy.valueKey,
                    },
                ],
            });
            agChartInstance = AgCharts.create(options) as AgChartProxy;
            chart = deproxy(agChartInstance);
            await waitForChartStability(chart);
        });

        afterEach(() => {
            agChartInstance = undefined as any;
        });

        it('should setup DOM on create', () => {
            const elements = document.querySelectorAll('.ag-charts-wrapper');
            expect(elements.length).toEqual(1);

            expect(elements[0].querySelectorAll('canvas')).toHaveLength(1);
            expect(elements[0].querySelectorAll('.ag-charts-focus-indicator')).toHaveLength(1);
        });

        it('should cleanup DOM on destroy()', () => {
            agChartInstance.destroy();

            const elements = document.querySelectorAll('.ag-charts-wrapper');
            expect(elements.length).toEqual(0);

            expect(document.querySelectorAll('canvas')).toHaveLength(0);
            expect(document.querySelectorAll('.ag-charts-focus-indicator')).toHaveLength(0);
            expect(document.querySelectorAll('div')).toHaveLength(0);
        });

        it('should cleanup DOM on chart-type switch', async () => {
            const options: AgCartesianChartOptions | AgPolarChartOptions = prepareTestOptions({
                container: document.body,
                series: [
                    {
                        type: 'pie',
                        data: datasets.economy.data,
                        calloutLabelKey: datasets.economy.categoryKey,
                        angleKey: datasets.economy.valueKey,
                    },
                ],
            });
            await agChartInstance.update(options);
            await waitForChartStability(agChartInstance);

            const elements = document.querySelectorAll('.ag-charts-wrapper');
            expect(elements).toHaveLength(1);

            expect(elements[0].querySelectorAll('canvas')).toHaveLength(1);
            expect(elements[0].querySelectorAll('.ag-charts-focus-indicator')).toHaveLength(1);
            expect(elements[0].querySelectorAll('.ag-charts-toolbar')).toHaveLength(0);
        });
    });

    describe('chart-type switch DOM handover', () => {
        it('detaches the outgoing element before the replacement attaches', async () => {
            const container = document.createElement('div');
            document.body.appendChild(container);

            const lineOptions: AgCartesianChartOptions = prepareTestOptions(
                {
                    series: [
                        {
                            type: 'line',
                            data: datasets.economy.data,
                            xKey: datasets.economy.categoryKey,
                            yKey: datasets.economy.valueKey,
                        },
                    ],
                },
                container
            );
            const agChartInstance = AgCharts.create(lineOptions) as AgChartProxy;
            chart = deproxy(agChartInstance);
            await waitForChartStability(chart);

            const pieOptions: AgPolarChartOptions = prepareTestOptions(
                {
                    series: [
                        {
                            type: 'pie',
                            data: datasets.economy.data,
                            calloutLabelKey: datasets.economy.categoryKey,
                            angleKey: datasets.economy.valueKey,
                        },
                    ],
                },
                container
            );
            const updated = agChartInstance.update(pieOptions);

            // The replacement attaches its element synchronously, so an outgoing element left in the
            // container's flow would displace it until the queued teardown runs.
            expect(container.querySelectorAll('.ag-charts-wrapper')).toHaveLength(1);

            await updated;
            chart = deproxy(agChartInstance);
            await waitForChartStability(chart);
            expect(container.querySelectorAll('.ag-charts-wrapper')).toHaveLength(1);

            container.remove();
        });
    });

    describe('Combo chart series visibility updates (AG-13393)', () => {
        let agChartInstance: AgChartProxy;
        let options: AgCartesianChartOptions;

        beforeEach(async () => {
            options = prepareTestOptions({
                series: [
                    {
                        type: 'bubble',
                        visible: true,
                        data: [
                            {
                                yValue: 1.9137,
                                xValue: 2.25051335,
                                sizeValue: 2250000,
                            },
                        ],
                        xKey: 'xValue',
                        yKey: 'yValue',
                        sizeKey: 'sizeValue',
                        yName: 'Bubble 1',
                    },
                    {
                        type: 'line',
                        data: [
                            {
                                x: 2.1505133499999998,
                                y: 3.500666667451469,
                            },
                            {
                                x: 2.25051335,
                                y: 3.5414529542644857,
                            },
                        ],
                        xKey: 'x',
                        yKey: 'y',
                        visible: true,
                    },
                    {
                        type: 'bubble',
                        data: [
                            {
                                yValue: 59.9805,
                                xValue: 2.84736482,
                                sizeValue: 491000,
                            },
                        ],
                        xKey: 'xValue',
                        yKey: 'yValue',
                        sizeKey: 'sizeValue',
                        visible: true,
                        yName: 'Bubble 2',
                    },
                ],
            });
            agChartInstance = AgCharts.create(options) as AgChartProxy;
            chart = deproxy(agChartInstance);
            await waitForChartStability(chart);
        });

        it('should allow visibility toggling of the first series', async () => {
            options.series![0].visible = false;
            await agChartInstance.update(options);
            await waitForChartStability(chart);

            expect(chart.series.map((s) => s.id)).toEqual(['BubbleSeries-1', 'LineSeries-1', 'BubbleSeries-2']);
            expect(chart.series.map((s) => s.type)).toEqual(['bubble', 'line', 'bubble']);
            expect(chart.series.map((s) => s.visible)).toEqual([false, true, true]);
        });

        it('should allow visibility double toggling of the first series', async () => {
            options.series![0].visible = false;
            await agChartInstance.update(options);
            await waitForChartStability(chart);
            options.series![0].visible = true;
            await agChartInstance.update(options);
            await waitForChartStability(chart);

            expect(chart.series.map((s) => s.id)).toEqual(['BubbleSeries-1', 'LineSeries-1', 'BubbleSeries-2']);
            expect(chart.series.map((s) => s.type)).toEqual(['bubble', 'line', 'bubble']);
            expect(chart.series.map((s) => s.visible)).toEqual([true, true, true]);
        });
    });

    describe('node click event types', () => {
        it('has correct types for click events', async () => {
            const nodeClick = vi.fn();
            const nodeDoubleClick = vi.fn();
            const seriesNodeClick = vi.fn();
            const seriesNodeDoubleClick = vi.fn();
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: [
                    {
                        xValue: 'category',
                        yValue: 1,
                    },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'xValue',
                        yKey: 'yValue',
                        listeners: {
                            seriesNodeClick: nodeClick,
                            seriesNodeDoubleClick: nodeDoubleClick,
                        },
                    },
                ],
                listeners: {
                    seriesNodeClick,
                    seriesNodeDoubleClick,
                },
            });
            const agChartInstance = AgCharts.create(options) as AgChartProxy;
            chart = deproxy(agChartInstance);
            await waitForChartStability(chart);

            await clickAction(200, 200)(agChartInstance);

            expect(nodeClick).toHaveBeenCalledTimes(1);
            expect(seriesNodeClick).toHaveBeenCalledTimes(1);
            expect(nodeDoubleClick).toHaveBeenCalledTimes(0);
            expect(seriesNodeDoubleClick).toHaveBeenCalledTimes(0);

            expect(nodeClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'seriesNodeClick' }));
            expect(seriesNodeClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'seriesNodeClick' }));

            // A 1:1 series exposes the single row as `datum` and leaves `datums` undefined.
            const barClickEvent = nodeClick.mock.calls[0][0];
            expect(barClickEvent.datum).toEqual({ xValue: 'category', yValue: 1 });
            expect(barClickEvent.datums).toBeUndefined();

            await doubleClickAction(200, 200)(agChartInstance);

            expect(nodeDoubleClick).toHaveBeenCalledTimes(1);
            expect(seriesNodeDoubleClick).toHaveBeenCalledTimes(1);

            expect(nodeDoubleClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'seriesNodeDoubleClick' }));
            expect(seriesNodeDoubleClick).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'seriesNodeDoubleClick' })
            );
        });
    });

    // AG-8173 — clicking a node's stroke must fire seriesNodeClick. Replicates the reporter's repro:
    // a line marker of size 20 (pick radius 10) whose highlighted state draws a 10px stroke, so the
    // drawn outer radius is 15 and a point 12px from the centre lies in the stroke band.
    describe('AG-8173 node stroke click detection', () => {
        const highlightedStroke: Partial<AgLineSeriesOptions> = {
            highlight: { highlightedItem: { fill: 'orange', stroke: 'blue', strokeWidth: 10 } },
        };

        const createOptions = (
            seriesNodeClick: () => void,
            overrides: Partial<AgLineSeriesOptions> = highlightedStroke
        ): AgCartesianChartOptions => ({
            data: [
                { year: '2015', spending: 35 },
                { year: '2016', spending: 40 },
                { year: '2017', spending: 43 },
                { year: '2018', spending: 44 },
            ],
            series: [
                {
                    type: 'line',
                    xKey: 'year',
                    yKey: 'spending',
                    marker: { size: 20 },
                    listeners: { seriesNodeClick },
                    ...overrides,
                },
            ],
        });

        const createMarkerChart = async (options: AgCartesianChartOptions) => {
            chart = deproxy(AgCharts.create(prepareTestOptions(options)));
            await waitForChartStability(chart);

            const [node] = classCast(chart.series[0], LineSeries).contextNodeData?.nodeData ?? [];
            expect(node).toBeDefined();

            const seriesRect = new Caster(chart.seriesRect).cast(BBox).value;
            return { cx: seriesRect.x + node.point.x, cy: seriesRect.y + node.point.y };
        };

        it('fires seriesNodeClick when clicking within the highlighted stroke of a marker', async () => {
            const seriesNodeClick = vi.fn();
            const { cx, cy } = await createMarkerChart(createOptions(seriesNodeClick));

            // Hover the marker centre so it highlights and draws the 10px blue stroke.
            await hoverAction(cx, cy)(chart);
            await waitForChartStability(chart);

            // 12px from the centre is outside the size / 2 = 10 pick radius, inside the drawn 15.
            await hoverAction(cx + 12, cy)(chart);
            await waitForChartStability(chart);
            await clickAction(cx + 12, cy)(chart);
            await waitForChartStability(chart);

            expect(seriesNodeClick).toHaveBeenCalledTimes(1);
        });

        // Control: proves the harness reaches the real click path in jsdom, so a failure above is the
        // missing stroke hit region and not a broken fixture.
        it('control — fires seriesNodeClick when clicking the marker centre', async () => {
            const seriesNodeClick = vi.fn();
            const { cx, cy } = await createMarkerChart(createOptions(seriesNodeClick));

            await hoverAction(cx, cy)(chart);
            await waitForChartStability(chart);
            await clickAction(cx, cy)(chart);
            await waitForChartStability(chart);

            expect(seriesNodeClick).toHaveBeenCalledTimes(1);
        });

        it('does not widen the hit region when no stroke is drawn', async () => {
            const seriesNodeClick = vi.fn();
            // A strokeWidth without a stroke colour draws nothing, so nothing may be inflated.
            const { cx, cy } = await createMarkerChart(
                createOptions(seriesNodeClick, {
                    marker: { size: 20, stroke: 'none', strokeWidth: 0 },
                    highlight: { highlightedItem: { fill: 'orange', strokeWidth: 10 } },
                })
            );

            await hoverAction(cx, cy)(chart);
            await waitForChartStability(chart);
            await hoverAction(cx + 12, cy)(chart);
            await waitForChartStability(chart);
            await clickAction(cx + 12, cy)(chart);
            await waitForChartStability(chart);

            expect(seriesNodeClick).not.toHaveBeenCalled();
        });

        // An `itemStyler` can widen a single datum's stroke, and that width is not visible in
        // `contextNodeData.styles`. No highlight override here, so the styler is the only source.
        it('fires seriesNodeClick when clicking a stroke widened only by marker.itemStyler', async () => {
            const seriesNodeClick = vi.fn();
            const { cx, cy } = await createMarkerChart(
                createOptions(seriesNodeClick, {
                    marker: { size: 20, itemStyler: () => ({ stroke: 'blue', strokeWidth: 10 }) },
                })
            );

            await hoverAction(cx + 12, cy)(chart);
            await waitForChartStability(chart);
            await clickAction(cx + 12, cy)(chart);
            await waitForChartStability(chart);

            expect(seriesNodeClick).toHaveBeenCalledTimes(1);
        });
    });

    describe('click event coordinates', () => {
        const CATEGORY_DATA = [
            { category: 'A', value: 1 },
            { category: 'B', value: 2 },
            { category: 'C', value: 3 },
        ];
        const NUMERIC_DATA = [
            { x: 1, y: 10 },
            { x: 2, y: 100 },
            { x: 3, y: 1000 },
        ];
        const TIME_DATA = [
            { date: new Date('2024-01-01T00:00:00Z'), value: 1 },
            { date: new Date('2024-01-02T00:00:00Z'), value: 2 },
        ];

        let click: Mock;
        let chartInstance: AgChartProxy;

        async function createChartWithClickListener(options: AgCartesianChartOptions) {
            click = vi.fn();
            chartInstance = AgCharts.create(
                prepareTestOptions<AgCartesianChartOptions>({ ...options, listeners: { click } })
            ) as AgChartProxy;
            chart = deproxy(chartInstance);
            await waitForChartStability(chart);
        }

        /**
         * Clicks the point an annotation placed at `{ value, groupPercentage: fraction }` would occupy,
         * offsetting from the band the same way the annotation options do, so that what the listener
         * reports back can be compared against the fraction that was aimed at.
         */
        async function clickAtBandFraction(value: string, fraction: number) {
            const xAxis = (chart as any).axes.find((axis: any) => axis.direction === ChartAxisDirection.X);
            const { scale } = xAxis;
            const bandWidth = scale.bandwidth === 0 ? scale.step : scale.bandwidth;
            const canvasX = xAxis.getLayoutTranslation().x + scale.convert(value) + bandWidth * fraction;
            await clickAtEmptyPlot(canvasX);
        }

        /** Clicks clear of every mark, so the click reaches the chart listener rather than a series node. */
        async function clickAtEmptyPlot(canvasX?: number) {
            const { x, y, width } = (chart as any).seriesRect;
            await clickAction(canvasX ?? x + width / 2, y + 5)(chartInstance);
        }

        function popClickEvents() {
            const events = click.mock.calls.map(([event]) => event);
            click.mockClear();
            return events;
        }

        // A click placed a known fraction into a category band must report that fraction back, so a
        // consumer can hand `{ value, groupPercentage }` to an annotation and land under the pointer.
        describe.each([false, true])('category axis (reverse: %s)', (reverse) => {
            beforeEach(async () => {
                await createChartWithClickListener({
                    data: CATEGORY_DATA,
                    axes: {
                        x: { type: 'category', position: 'bottom', reverse },
                        y: { type: 'number', position: 'left' },
                    },
                    series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
                });
            });

            it.each([0, 0.25, 0.5, 0.75])('reports a click %s of the way into the band', async (fraction) => {
                await clickAtBandFraction('B', fraction);

                expect(popClickEvents()).toMatchObject([
                    { coordinates: { x: { value: 'B', groupPercentage: expect.closeTo(fraction, 3) } } },
                ]);
            });

            it('reports no groupPercentage for the continuous y axis', async () => {
                await clickAtBandFraction('B', 0.5);

                const [{ coordinates }] = popClickEvents();
                expect(coordinates.y.value).toBeDefined();
                expect(coordinates.y.groupPercentage).toBeUndefined();
            });
        });

        const continuousAxes: [string, AgCartesianChartOptions][] = [
            [
                'number',
                {
                    data: NUMERIC_DATA,
                    axes: { x: { type: 'number', position: 'bottom' }, y: { type: 'number', position: 'left' } },
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                },
            ],
            [
                'log',
                {
                    data: NUMERIC_DATA,
                    axes: { x: { type: 'log', position: 'bottom' }, y: { type: 'number', position: 'left' } },
                    series: [{ type: 'line', xKey: 'y', yKey: 'x' }],
                },
            ],
            [
                'time',
                {
                    data: TIME_DATA,
                    axes: { x: { type: 'time', position: 'bottom' }, y: { type: 'number', position: 'left' } },
                    series: [{ type: 'line', xKey: 'date', yKey: 'value' }],
                },
            ],
        ];

        it.each(continuousAxes)('reports no groupPercentage on a %s axis', async (_name, options) => {
            await createChartWithClickListener(options);
            await clickAtEmptyPlot();

            const [{ coordinates }] = popClickEvents();
            expect(coordinates.x.value).toBeDefined();
            expect(coordinates.x.groupPercentage).toBeUndefined();
        });
    });

    describe('AG-16337 listeners undefined update', () => {
        it('should handle chart-level listeners set to undefined', async () => {
            const chartClick = vi.fn();
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: [
                    {
                        xValue: 'category',
                        yValue: 1,
                    },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'xValue',
                        yKey: 'yValue',
                    },
                ],
                listeners: {
                    click: chartClick,
                },
            });
            const agChartInstance = AgCharts.create(options) as AgChartProxy;
            chart = deproxy(agChartInstance);
            await waitForChartStability(chart);

            expect(chart.listeners.click).toBeDefined();

            chartClick.mockClear();

            await agChartInstance.update({
                ...options,
                listeners: undefined,
            });
            await waitForChartStability(chart);

            expect(chart.listeners.click).toBeUndefined();

            await clickAction(100, 100)(agChartInstance);
            await waitForChartStability(chart);
            expect(chartClick).not.toHaveBeenCalled();
        });

        it('should handle series-level listeners set to undefined', async () => {
            const seriesNodeClick = vi.fn();
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: [
                    {
                        xValue: 'category',
                        yValue: 1,
                    },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'xValue',
                        yKey: 'yValue',
                        listeners: {
                            seriesNodeClick: seriesNodeClick,
                        },
                    },
                ],
            });
            const agChartInstance = AgCharts.create(options) as AgChartProxy;
            chart = deproxy(agChartInstance);
            await waitForChartStability(chart);

            expect(chart.series[0].properties.listeners?.seriesNodeClick).toBeDefined();

            await agChartInstance.update({
                ...options,
                series: [
                    {
                        ...options.series![0],
                        listeners: undefined,
                    },
                ],
            });
            await waitForChartStability(chart);

            expect(chart.series[0].properties.listeners?.seriesNodeClick).toBeUndefined();
        });

        it('should handle both chart and series listeners set to undefined', async () => {
            const chartClick = vi.fn();
            const seriesNodeClick = vi.fn();
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: [
                    {
                        xValue: 'category',
                        yValue: 1,
                    },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'xValue',
                        yKey: 'yValue',
                        listeners: {
                            seriesNodeClick: seriesNodeClick,
                        },
                    },
                ],
                listeners: {
                    click: chartClick,
                },
            });
            const agChartInstance = AgCharts.create(options) as AgChartProxy;
            chart = deproxy(agChartInstance);
            await waitForChartStability(chart);

            expect(chart.listeners.click).toBeDefined();
            expect(chart.series[0].properties.listeners?.seriesNodeClick).toBeDefined();

            chartClick.mockClear();
            seriesNodeClick.mockClear();

            await agChartInstance.update({
                ...options,
                listeners: undefined,
                series: [
                    {
                        ...options.series![0],
                        listeners: undefined,
                    },
                ],
            });
            await waitForChartStability(chart);

            expect(chart.listeners.click).toBeUndefined();
            expect(chart.series[0].properties.listeners?.seriesNodeClick).toBeUndefined();

            await clickAction(200, 200)(agChartInstance);
            await waitForChartStability(chart);
            expect(chartClick).not.toHaveBeenCalled();
            expect(seriesNodeClick).not.toHaveBeenCalled();
        });

        it('should drop non-function listeners when options are applied', async () => {
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: [{ xValue: 'category', yValue: 1 }],
                series: [
                    {
                        type: 'bar',
                        xKey: 'xValue',
                        yKey: 'yValue',
                        listeners: { seriesNodeClick: 'not-a-function' as never },
                    },
                ],
                listeners: { click: 'not-a-function' as never, doubleClick: undefined },
            });
            const agChartInstance = AgCharts.create(options) as AgChartProxy;
            chart = deproxy(agChartInstance);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
              [
                [
                  "AG Charts - Option \`series[0].listeners.seriesNodeClick\` cannot be set to \`"not-a-function"\`; expecting a function, ignoring.",
                ],
                [
                  "AG Charts - Option \`listeners.click\` cannot be set to \`"not-a-function"\`; expecting a function, ignoring.",
                ],
              ]
            `);

            expect(chart.listeners.click).toBeUndefined();
            expect(chart.series[0].properties.listeners?.seriesNodeClick).toBeUndefined();
        });

        it('should keep firing chart-level listeners after clearing user series listeners', async () => {
            const seriesNodeClick = vi.fn();
            const seriesVisibilityChange = vi.fn();
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: [
                    {
                        xValue: 'category',
                        yValue: 1,
                    },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'xValue',
                        yKey: 'yValue',
                        listeners: {
                            seriesNodeClick: seriesNodeClick,
                        },
                    },
                ],
                listeners: {
                    seriesVisibilityChange: seriesVisibilityChange,
                },
            });
            const agChartInstance = AgCharts.create(options) as AgChartProxy;
            chart = deproxy(agChartInstance);
            await waitForChartStability(chart);

            expect(chart.series[0].properties.listeners?.seriesNodeClick).toBeDefined();
            expect(chart.listeners.seriesVisibilityChange).toBeDefined();

            await agChartInstance.update({
                ...options,
                series: [
                    {
                        ...options.series![0],
                        listeners: undefined,
                    },
                ],
            });
            await waitForChartStability(chart);

            expect(chart.series[0].properties.listeners?.seriesNodeClick).toBeUndefined();

            // Clearing the series listeners must not disturb the chart-level ones.
            expect(chart.listeners.seriesVisibilityChange).toBe(seriesVisibilityChange);
        });
    });

    describe('Transaction validation', () => {
        let chartProxy: AgChartProxy;

        beforeEach(async () => {
            const chartOptions = prepareTestOptions<{
                data: { x: number; y: number }[];
                series: any[];
            }>({
                data: [
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                    { x: 3, y: 30 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                    },
                ],
            });

            chartProxy = AgCharts.create(chartOptions);
            chart = deproxy(chartProxy);
            await waitForChartStability(chart);
        });

        describe('addIndex validation', () => {
            it('should throw synchronously for unsafe integers beyond MAX_SAFE_INTEGER', () => {
                expect(() =>
                    chartProxy.applyTransaction({
                        add: [{ x: 4, y: 40 }],
                        addIndex: Number.MAX_SAFE_INTEGER + 1,
                    })
                ).toThrow('safe non-negative integer');
            });

            it('should throw synchronously for extremely large numbers', () => {
                expect(() =>
                    chartProxy.applyTransaction({
                        add: [{ x: 4, y: 40 }],
                        addIndex: 1e100,
                    })
                ).toThrow('safe non-negative integer');
            });

            it('should throw synchronously for NaN', () => {
                expect(() =>
                    chartProxy.applyTransaction({
                        add: [{ x: 4, y: 40 }],
                        addIndex: Number.NaN,
                    })
                ).toThrow('safe non-negative integer');
            });

            it('should throw synchronously for Infinity', () => {
                expect(() =>
                    chartProxy.applyTransaction({
                        add: [{ x: 4, y: 40 }],
                        addIndex: Infinity,
                    })
                ).toThrow('safe non-negative integer');
            });

            it('should throw synchronously for negative Infinity', () => {
                expect(() =>
                    chartProxy.applyTransaction({
                        add: [{ x: 4, y: 40 }],
                        addIndex: -Infinity,
                    })
                ).toThrow('safe non-negative integer');
            });

            it('should throw synchronously for negative numbers', () => {
                expect(() =>
                    chartProxy.applyTransaction({
                        add: [{ x: 4, y: 40 }],
                        addIndex: -1,
                    })
                ).toThrow('safe non-negative integer');
            });

            it('should throw synchronously for decimal numbers', () => {
                expect(() =>
                    chartProxy.applyTransaction({
                        add: [{ x: 4, y: 40 }],
                        addIndex: 1.5,
                    })
                ).toThrow('safe non-negative integer');
            });

            it('should throw synchronously for addIndex without add array', () => {
                expect(() => chartProxy.applyTransaction({ addIndex: 5 })).toThrow('requires a non-empty "add" array');
            });

            it('should throw synchronously for addIndex with null add array', () => {
                expect(() =>
                    chartProxy.applyTransaction({
                        add: null as any,
                        addIndex: 5,
                    })
                ).toThrow('requires a non-empty "add" array');
            });

            it('should throw synchronously for addIndex with empty add array', () => {
                expect(() =>
                    chartProxy.applyTransaction({
                        add: [],
                        addIndex: 5,
                    })
                ).toThrow('requires a non-empty "add" array');
            });

            it('should accept MAX_SAFE_INTEGER', async () => {
                // Should not throw - will append since way beyond data length
                await expect(
                    chartProxy.applyTransaction({
                        add: [{ x: 4, y: 40 }],
                        addIndex: Number.MAX_SAFE_INTEGER,
                    })
                ).resolves.not.toThrow();
                await waitForChartStability(chart);

                expect(chart.data.data).toHaveLength(4);
                expect(chart.data.data[3]).toEqual({ x: 4, y: 40 });
            });

            it('should accept valid addIndex at beginning', async () => {
                await expect(
                    chartProxy.applyTransaction({
                        add: [{ x: 0, y: 0 }],
                        addIndex: 0,
                    })
                ).resolves.not.toThrow();
                await waitForChartStability(chart);

                expect(chart.data.data).toHaveLength(4);
                expect(chart.data.data[0]).toEqual({ x: 0, y: 0 });
            });

            it('should accept valid addIndex in middle', async () => {
                await expect(
                    chartProxy.applyTransaction({
                        add: [{ x: 1.5, y: 15 }],
                        addIndex: 1,
                    })
                ).resolves.not.toThrow();
                await waitForChartStability(chart);

                expect(chart.data.data).toHaveLength(4);
                expect(chart.data.data[1]).toEqual({ x: 1.5, y: 15 });
            });

            it('should accept valid addIndex at end (append)', async () => {
                await expect(
                    chartProxy.applyTransaction({
                        add: [{ x: 4, y: 40 }],
                        addIndex: 3,
                    })
                ).resolves.not.toThrow();
                await waitForChartStability(chart);

                expect(chart.data.data).toHaveLength(4);
                expect(chart.data.data[3]).toEqual({ x: 4, y: 40 });
            });

            it('should accept addIndex beyond data length (append)', async () => {
                await expect(
                    chartProxy.applyTransaction({
                        add: [{ x: 4, y: 40 }],
                        addIndex: 100,
                    })
                ).resolves.not.toThrow();
                await waitForChartStability(chart);

                expect(chart.data.data).toHaveLength(4);
                expect(chart.data.data[3]).toEqual({ x: 4, y: 40 });
            });
        });

        describe('other transaction validation', () => {
            it('should throw synchronously for non-object transaction', () => {
                expect(() => chartProxy.applyTransaction(null as any)).toThrow(
                    'applyTransaction expects a transaction object'
                );
            });

            it('should throw synchronously for non-array add', () => {
                expect(() =>
                    chartProxy.applyTransaction({
                        add: { x: 4, y: 40 } as any,
                    })
                ).toThrow('"add" must be an array');
            });

            it('should throw synchronously for non-array remove', () => {
                expect(() =>
                    chartProxy.applyTransaction({
                        remove: { x: 1, y: 10 } as any,
                    })
                ).toThrow('"remove" must be an array');
            });

            it('should throw synchronously for non-array update', () => {
                expect(() =>
                    chartProxy.applyTransaction({
                        update: { x: 1, y: 10 } as any,
                    })
                ).toThrow('"update" must be an array');
            });

            it('should throw synchronously for invalid addIndex', () => {
                expect(() =>
                    chartProxy.applyTransaction({
                        add: [{ x: 4, y: 40 }],
                        addIndex: -1,
                    })
                ).toThrow('"addIndex" must be a safe non-negative integer');
            });

            it('should throw synchronously for addIndex without add', () => {
                expect(() =>
                    chartProxy.applyTransaction({
                        addIndex: 0,
                    })
                ).toThrow('"addIndex" requires a non-empty "add" array');
            });

            it('should accept empty update array', async () => {
                await expect(
                    chartProxy.applyTransaction({
                        update: [],
                    })
                ).resolves.not.toThrow();
                await waitForChartStability(chart);

                expect(chart.data.data).toHaveLength(3);
            });

            it('should accept empty transaction', async () => {
                // Empty transaction is allowed but does nothing
                await expect(chartProxy.applyTransaction({})).resolves.not.toThrow();
                await waitForChartStability(chart);

                expect(chart.data.data).toHaveLength(3);
            });
        });

        describe('getOptions data synchronization', () => {
            it('should return updated data in getOptions after add transaction', async () => {
                const initialOptions = chartProxy.getOptions();
                expect(initialOptions.data).toHaveLength(3);

                await chartProxy.applyTransaction({
                    add: [{ x: 4, y: 40 }],
                });
                await waitForChartStability(chart);

                const updatedOptions = chartProxy.getOptions();
                expect(updatedOptions.data).toBeDefined();
                expect(updatedOptions.data!).toHaveLength(4);
                expect(updatedOptions.data![3]).toEqual({ x: 4, y: 40 });
            });

            it('should return updated data in getOptions after remove transaction', async () => {
                const initialData = chartProxy.getOptions().data!;
                const itemToRemove = initialData[0];

                await chartProxy.applyTransaction({
                    remove: [itemToRemove],
                });
                await waitForChartStability(chart);

                const updatedOptions = chartProxy.getOptions();
                expect(updatedOptions.data).toBeDefined();
                expect(updatedOptions.data!).toHaveLength(2);
                expect(updatedOptions.data!).not.toContainEqual(itemToRemove);
            });

            it('should return updated data in getOptions after update transaction', async () => {
                const initialData = chartProxy.getOptions().data!;
                const itemToUpdate = initialData[1];
                itemToUpdate.y = 25;

                await chartProxy.applyTransaction({
                    update: [itemToUpdate],
                });
                await waitForChartStability(chart);

                const updatedOptions = chartProxy.getOptions();
                expect(updatedOptions.data).toBeDefined();
                expect(updatedOptions.data!).toHaveLength(3);
                expect(updatedOptions.data![1].y).toBe(25);
            });

            it('should return updated data in getOptions after combined transaction', async () => {
                const initialData = chartProxy.getOptions().data!;
                const itemToRemove = initialData[0];
                const itemToUpdate = initialData[1];
                itemToUpdate.y = 25;

                await chartProxy.applyTransaction({
                    remove: [itemToRemove],
                    update: [itemToUpdate],
                    add: [{ x: 4, y: 40 }],
                });
                await waitForChartStability(chart);

                const updatedOptions = chartProxy.getOptions();
                expect(updatedOptions.data).toBeDefined();
                expect(updatedOptions.data!).toHaveLength(3);
                expect(updatedOptions.data!).not.toContainEqual(itemToRemove);
                expect(updatedOptions.data![0].y).toBe(25);
                expect(updatedOptions.data![2]).toEqual({ x: 4, y: 40 });
            });
        });

        describe('pie chart transactions', () => {
            let pieChartProxy: AgChartProxy;
            let pieChart: Chart;

            beforeEach(async () => {
                const pieChartOptions = prepareTestOptions<{
                    data: { category: string; value: number }[];
                    series: any[];
                }>({
                    data: [
                        { category: 'A', value: 10 },
                        { category: 'B', value: 20 },
                        { category: 'C', value: 30 },
                    ],
                    series: [
                        {
                            type: 'pie',
                            angleKey: 'value',
                            calloutLabelKey: 'category',
                        },
                    ],
                });

                pieChartProxy = AgCharts.create(pieChartOptions);
                pieChart = deproxy(pieChartProxy);
                await waitForChartStability(pieChart);
            });

            afterEach(() => {
                if (pieChartProxy) {
                    pieChartProxy.destroy();
                }
            });

            it('should update pie chart data with add transaction', async () => {
                const initialOptions = pieChartProxy.getOptions();
                expect(initialOptions.data).toHaveLength(3);

                await pieChartProxy.applyTransaction({
                    add: [{ category: 'D', value: 40 }],
                });
                await waitForChartStability(pieChart);

                const updatedOptions = pieChartProxy.getOptions();
                expect(updatedOptions.data).toBeDefined();
                expect(updatedOptions.data!).toHaveLength(4);
                expect(updatedOptions.data![3]).toEqual({ category: 'D', value: 40 });
            });

            it('should update pie chart data with remove transaction', async () => {
                const initialData = pieChartProxy.getOptions().data!;
                const itemToRemove = initialData[0];

                await pieChartProxy.applyTransaction({
                    remove: [itemToRemove],
                });
                await waitForChartStability(pieChart);

                const updatedOptions = pieChartProxy.getOptions();
                expect(updatedOptions.data).toBeDefined();
                expect(updatedOptions.data!).toHaveLength(2);
                expect(updatedOptions.data!).not.toContainEqual(itemToRemove);
            });

            it('should update pie chart data with update transaction', async () => {
                const initialData = pieChartProxy.getOptions().data!;
                const itemToUpdate = initialData[1];
                itemToUpdate.value = 25;

                await pieChartProxy.applyTransaction({
                    update: [itemToUpdate],
                });
                await waitForChartStability(pieChart);

                const updatedOptions = pieChartProxy.getOptions();
                expect(updatedOptions.data).toBeDefined();
                expect(updatedOptions.data!).toHaveLength(3);
                expect(updatedOptions.data![1].value).toBe(25);
            });

            it('should not add empty segments when adding valid data', async () => {
                const initialOptions = pieChartProxy.getOptions();
                expect(initialOptions.data).toHaveLength(3);

                await pieChartProxy.applyTransaction({
                    add: [{ category: 'D', value: 40 }],
                });
                await waitForChartStability(pieChart);

                const updatedOptions = pieChartProxy.getOptions();
                expect(updatedOptions.data).toBeDefined();
                expect(updatedOptions.data!).toHaveLength(4);

                for (const item of updatedOptions.data!) {
                    expect(item.value).toBeGreaterThan(0);
                }
            });
        });
    });

    describe('displayNullData option', () => {
        it('should not generate warnings when using displayNullData', async () => {
            const options: AgCartesianChartOptions = {
                container: document.body,
                data: [
                    { x: null, y: 1 },
                    { x: 'a', y: 2 },
                ],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
                displayNullData: true,
            } as any;

            chart = await createChart(options);
            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
        });
    });
});

describe('Chart destroy() / performUpdate() race condition', () => {
    setupMockConsole();
    setupMockCanvas();

    const data = [
        { x: 'A', y: 10 },
        { x: 'B', y: 20 },
        { x: 'C', y: 30 },
    ];

    async function testDestroyRace(seriesType: 'bar' | 'area' | 'line') {
        const proxy = AgCharts.create({
            container: document.body,
            data,
            series: [{ type: seriesType, xKey: 'x', yKey: 'y' }],
        }) as AgChartProxy;
        const innerChart = deproxy(proxy);
        await waitForChartStability(innerChart);

        // Spy on the prototype so vitest can restore it after the test even if the chart
        // instance gets frozen by Object.freeze(this) inside performTeardown.
        const chartProto = Object.getPrototypeOf(innerChart);
        const origProcessData = chartProto.processData;
        vi.spyOn(chartProto, 'processData').mockImplementationOnce(function (this: any) {
            // Fire destroy() while the pipeline is paused on the processData await.
            innerChart.destroy();
            return origProcessData.call(this) as Promise<void>;
        });

        innerChart.update(ChartUpdateType.FULL);

        // waitForChartStability returns as soon as `destroyed` is true; the deferred
        // performTeardown (queued behind the mutex by destroy()) still needs to drain.
        await waitForChartStability(innerChart);
        await (innerChart as any).updateMutex.waitForClearAcquireQueue();

        // Implicit assertion: a TypeError from a cleared series would reach Logger.error, and
        // setupMockConsole's afterEach fails on any unexpected console.error.
    }

    it.each(['bar', 'area', 'line'] as const)(
        'does not throw TypeError when destroy() races with a %s series update',
        testDestroyRace
    );
});

describe('validations.throwOn — runtime errors', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;
    afterEach(() => {
        vi.restoreAllMocks();
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const RUNTIME_ERROR_MESSAGE = 'chart.test.ts runtime boom';

    const INITIAL_DATA = [
        { x: 'A', y: 10 },
        { x: 'B', y: 20 },
    ];
    const UPDATED_DATA = [
        { x: 'A', y: 30 },
        { x: 'B', y: 40 },
    ];

    function throwOnOptions(validations?: AgChartValidationsOptions, data = INITIAL_DATA) {
        return prepareTestOptions({
            width: 400,
            height: 300,
            data,
            series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            ...(validations == null ? {} : { validations }),
        } as AgCartesianChartOptions);
    }

    // Throws from inside tryPerformUpdate's try block, the one path that reaches its catch rather
    // than the swallowed-callback safeCall path.
    function armProcessDataThrow(target: Chart) {
        const proto = Object.getPrototypeOf(target);
        return vi.spyOn(proto, 'processData').mockImplementationOnce(() => {
            throw new Error(RUNTIME_ERROR_MESSAGE);
        });
    }

    // setupMockConsole()'s afterEach fails the test if console.error was left with unread calls,
    // so every case that provokes one must drain it before finishing.
    function drainErrorLog() {
        const mock = console.error as Mock;
        const calls = mock.mock.calls;
        mock.mockClear();
        return calls;
    }

    it('throwOn: error rejects both waitForUpdate() and update() with the caught runtime error', async () => {
        const proxy = AgCharts.create(throwOnOptions({ throwOn: 'error' })) as AgChartProxy;
        chart = deproxy(proxy);
        armProcessDataThrow(chart);

        await expect(proxy.waitForUpdate()).rejects.toThrow(RUNTIME_ERROR_MESSAGE);
        expect(drainErrorLog()).toHaveLength(1);

        armProcessDataThrow(chart);
        await expect(proxy.update(throwOnOptions({ throwOn: 'error' }, UPDATED_DATA))).rejects.toThrow(
            RUNTIME_ERROR_MESSAGE
        );
        expect(drainErrorLog()).toHaveLength(1);
    });

    it('writes the console record and records the overlay issue before rejecting — fail-fast suppresses nothing', async () => {
        const proxy = AgCharts.create(throwOnOptions({ throwOn: 'error', overlayLevel: 'error' })) as AgChartProxy;
        chart = deproxy(proxy);
        armProcessDataThrow(chart);

        await expect(proxy.waitForUpdate()).rejects.toThrow(RUNTIME_ERROR_MESSAGE);

        const errorCalls = drainErrorLog();
        expect(errorCalls).toHaveLength(1);
        expect(String(errorCalls[0][0])).toContain('update error');

        expect(chart.validationCollector.hasVisibleIssues()).toBe(true);
        const visible = chart.validationCollector.getVisibleIssues();
        expect(visible.error.some((issue) => issue.message.includes(RUNTIME_ERROR_MESSAGE))).toBe(true);
    });

    it('leaves default (none) behaviour unchanged — waitForUpdate() resolves through a caught runtime error', async () => {
        const proxy = AgCharts.create(throwOnOptions()) as AgChartProxy;
        chart = deproxy(proxy);
        armProcessDataThrow(chart);

        await expect(proxy.waitForUpdate()).resolves.toBeUndefined();
        expect(drainErrorLog()).toHaveLength(1);
    });

    it('does not re-throw a stale fail-fast error on a later successful update', async () => {
        const proxy = AgCharts.create(throwOnOptions({ throwOn: 'error' })) as AgChartProxy;
        chart = deproxy(proxy);
        armProcessDataThrow(chart);

        await expect(proxy.waitForUpdate()).rejects.toThrow(RUNTIME_ERROR_MESSAGE);
        drainErrorLog();

        // processData is left unmocked for this pass, so it succeeds and takeFailFastError() must
        // find nothing left to deliver.
        await expect(proxy.update(throwOnOptions({ throwOn: 'error' }, UPDATED_DATA))).resolves.toBeUndefined();
    });

    it('leaves internal awaiters of Chart.waitForUpdate unaffected by a pending fail-fast error', async () => {
        const proxy = AgCharts.create(throwOnOptions({ throwOn: 'error' })) as AgChartProxy;
        chart = deproxy(proxy);
        armProcessDataThrow(chart);

        // Drive the failing pass to completion via the chart's own waitForUpdate, exactly like the
        // internal awaiters under test, so the pending fail-fast error is armed but unconsumed here.
        await chart.waitForUpdate();
        drainErrorLog();

        // Chart.applyTransaction and AgChartInstanceProxy.setState both await Chart.waitForUpdate()
        // directly, never AgChartInstanceProxy's fail-fast-aware wrapper.
        await expect(chart.applyTransaction({ update: [{ x: 'A', y: 99 }] })).resolves.toBeUndefined();
        await expect(proxy.setState(proxy.getState())).resolves.toBeUndefined();
    });

    // AG-17831 TC1 (QA repro T17d): arming `throwOn` forces the slow option-processing path, so a
    // datum that throws while being read escapes `new ChartOptions()` synchronously — before the
    // update loop's catch. That escape must still write the console record and carry the prefix.
    it('prefixes and logs an error that escapes option processing on a warm updateDelta', async () => {
        let boom = false;
        const rows = [
            { x: 'A', y: 10 },
            {
                x: 'B',
                get y() {
                    if (boom) throw new Error(RUNTIME_ERROR_MESSAGE);
                    return 20;
                },
            },
        ];

        const proxy = AgCharts.create(throwOnOptions({ throwOn: 'error' }, rows)) as AgChartProxy;
        chart = deproxy(proxy);
        await proxy.waitForUpdate();
        drainErrorLog();

        boom = true;
        await expect(proxy.updateDelta({ data: rows.slice() })).rejects.toThrow(
            /^AG Charts - validations\.throwOn: error - /
        );
        boom = false;

        const errorCalls = drainErrorLog();
        expect(errorCalls.length).toBeGreaterThan(0);
        expect(errorCalls.some((call) => call.some((arg) => String(arg).includes(RUNTIME_ERROR_MESSAGE)))).toBe(true);
    });
});

describe('validations.onDiagnosticRaised', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;
    afterEach(() => {
        chart?.destroy();
    });

    it('fires for a runtime error caught in tryPerformUpdate(), regardless of consoleLogLevel/overlayLevel', async () => {
        const onDiagnosticRaised = vi.fn();
        const thrownError = new Error('processData boom');

        const proxy = AgCharts.create({
            container: document.body,
            data: [
                { x: 'A', y: 10 },
                { x: 'B', y: 20 },
            ],
            series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            validations: {
                consoleLogLevel: 'none',
                overlayLevel: 'none',
                onDiagnosticRaised,
            },
        }) as AgChartProxy;
        chart = deproxy(proxy);
        await waitForChartStability(chart);

        const chartProto = Object.getPrototypeOf(chart);
        vi.spyOn(chartProto, 'processData').mockImplementationOnce(() => {
            throw thrownError;
        });

        chart.update(ChartUpdateType.FULL);
        await waitForChartStability(chart);

        expect(onDiagnosticRaised).toHaveBeenCalledWith({ level: 'error', message: thrownError.message });
    });
});

describe('AG-17830 QA — validations.onDiagnosticRaised', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;
    afterEach(() => {
        chart?.destroy();
        (chart as unknown) = undefined;
    });

    // AC 3: the listener is never gated by a severity threshold, and `throwOn` is one. The throw
    // unwinds out of `new ChartOptions()`, so the chart never adopts the issues that caused it.
    it('fires on create() for an issue that also trips throwOn', () => {
        const onDiagnosticRaised = vi.fn();

        expect(() =>
            AgCharts.create({
                container: document.body,
                data: [{ x: 'A', y: 10 }],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y', strokeWidth: 'thick' as any }],
                validations: { throwOn: 'warning', onDiagnosticRaised },
            })
        ).toThrow(/validations.throwOn: warning/);

        expect(onDiagnosticRaised).toHaveBeenCalledWith({
            level: 'warning',
            message: expect.stringContaining('series[0].strokeWidth'),
        });
        expectWarningsCalls().toHaveLength(1);
    });

    // The dropped-module issue is reported to the console by `processModuleOptions`, so it never
    // enters `validationIssues` — the throw path has to dispatch the issue that tripped it.
    it('fires for a dropped-module error that trips throwOn', () => {
        const onDiagnosticRaised = vi.fn();

        expect(() =>
            AgCharts.create({
                container: document.body,
                data: [{ x: 'A', y: 10 }],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
                zoom: { enabled: true },
                validations: { throwOn: 'error', onDiagnosticRaised },
            })
        ).toThrow(/validations.throwOn: error/);

        const errorMock = console.error as Mock;
        expect(onDiagnosticRaised).toHaveBeenCalledWith({
            level: 'error',
            message: expect.stringContaining('required modules are not registered'),
        });
        expect(errorMock).toHaveBeenCalledTimes(1);
        errorMock.mockClear();
    });

    it('fires on update() for an issue that also trips throwOn', async () => {
        const onDiagnosticRaised = vi.fn();
        const options: AgCartesianChartOptions = {
            container: document.body,
            data: [{ x: 'A', y: 10 }],
            series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            validations: { throwOn: 'warning', onDiagnosticRaised },
        };
        const proxy = AgCharts.create(options) as AgChartProxy;
        chart = deproxy(proxy);
        await waitForChartStability(chart);
        onDiagnosticRaised.mockClear();

        await expect(
            proxy.update({
                ...options,
                series: [{ type: 'bar', xKey: 'x', yKey: 'y', strokeWidth: 'thick' as any }],
            })
        ).rejects.toThrow(/validations.throwOn: warning/);

        expect(onDiagnosticRaised).toHaveBeenCalledWith({
            level: 'warning',
            message: expect.stringContaining('series[0].strokeWidth'),
        });
        expectWarningsCalls().toHaveLength(1);
    });

    it('a throwing consumer callback does not displace the fail-fast error', () => {
        const onDiagnosticRaised = vi.fn(() => {
            throw new Error('consumer boom');
        });

        expect(() =>
            AgCharts.create({
                container: document.body,
                data: [{ x: 'A', y: 10 }],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y', strokeWidth: 'thick' as any }],
                validations: { throwOn: 'warning', onDiagnosticRaised },
            })
        ).toThrow(/validations.throwOn: warning/);

        expect(onDiagnosticRaised).toHaveBeenCalled();
        expectWarningsCalls().toHaveLength(1);
        const errorMock = console.error as Mock;
        expect(errorMock).toHaveBeenCalledWith(
            'AG Charts - validations.onDiagnosticRaised threw an error',
            expect.any(Error)
        );
        errorMock.mockClear();
    });

    // A second chart is a separate listener registration, so it must still be told about its own
    // issues while the first chart's listener is on the stack.
    it('reports to a second chart listener from inside the first listener', () => {
        const innerListener = vi.fn();
        const outerListener = vi.fn(() => {
            AgCharts.create({
                container: document.body,
                data: [{ x: 'A', y: 10 }],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y', strokeWidth: 'thick' as any }],
                validations: { throwOn: 'warning', onDiagnosticRaised: innerListener },
            });
        });

        expect(() =>
            AgCharts.create({
                container: document.body,
                data: [{ x: 'A', y: 10 }],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y', strokeWidth: 'thick' as any }],
                validations: { throwOn: 'warning', onDiagnosticRaised: outerListener },
            })
        ).toThrow(/validations.throwOn: warning/);

        expect(outerListener).toHaveBeenCalledTimes(1);
        expect(innerListener).toHaveBeenCalledWith({
            level: 'warning',
            message: expect.stringContaining('series[0].strokeWidth'),
        });
        expectWarningsCalls().toHaveLength(2);
        // The inner chart's own fail-fast error unwinds through the outer listener.
        const errorMock = console.error as Mock;
        expect(errorMock).toHaveBeenCalledWith(
            'AG Charts - validations.onDiagnosticRaised threw an error',
            expect.any(Error)
        );
        errorMock.mockClear();
    });

    // The same listener re-entering is the runaway case the guard exists for: one dispatch only.
    it('does not recurse when the listener re-applies the same failing options', () => {
        const failingOptions = () => ({
            container: document.body,
            data: [{ x: 'A', y: 10 }],
            series: [{ type: 'bar' as const, xKey: 'x', yKey: 'y', strokeWidth: 'thick' as any }],
            validations: { throwOn: 'warning' as const, onDiagnosticRaised },
        });
        const onDiagnosticRaised = vi.fn(() => {
            AgCharts.create(failingOptions());
        });

        expect(() => AgCharts.create(failingOptions())).toThrow(/validations.throwOn: warning/);

        expect(onDiagnosticRaised).toHaveBeenCalledTimes(1);
        expectWarningsCalls().toHaveLength(2);
        (console.error as Mock).mockClear();
    });

    // The Angular wrapper hands a freshly bound listener to every options pass, so listener identity
    // alone cannot bound the recursion.
    it('stops recursion from a listener whose identity changes on every pass', () => {
        const calls: unknown[] = [];
        const create = () =>
            AgCharts.create({
                container: document.body,
                data: [{ x: 'A', y: 10 }],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y', strokeWidth: 'thick' as any }],
                validations: {
                    throwOn: 'warning',
                    onDiagnosticRaised: (event) => {
                        calls.push(event);
                        create();
                    },
                },
            });

        expect(create).toThrow(/validations.throwOn: warning/);

        // A fresh closure per pass defeats the listener-identity guard, so this case falls to the depth
        // backstop. Asserted as a bound rather than a count: the exact value is a safety limit, not a
        // contract, and the point is that it terminates well short of the stack.
        expect(calls.length).toBeGreaterThan(1);
        expect(calls.length).toBeLessThanOrEqual(32);
        expectWarningsCalls().toHaveLength(calls.length + 1);
        (console.error as Mock).mockClear();
    });

    // The merge of AG-17831 added a second fail-fast exit — an error escaping option processing — that
    // bypasses `Chart.tryPerformUpdate()`'s catch, so nothing else can tell the listener about it.
    it('reports an error that escapes option processing under an armed throwOn', async () => {
        const onDiagnosticRaised = vi.fn();
        let boom = false;
        const rows = [
            { x: 'A', y: 10 },
            {
                x: 'B',
                get y() {
                    if (boom) throw new Error('datum exploded');
                    return 20;
                },
            },
        ];
        const options = () => ({
            container: document.body,
            width: 400,
            height: 300,
            data: rows.slice(),
            series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            validations: { throwOn: 'error', onDiagnosticRaised },
        });

        const proxy = AgCharts.create(options() as any) as AgChartProxy;
        await proxy.waitForUpdate();
        onDiagnosticRaised.mockClear();
        (console.error as Mock).mockClear();

        boom = true;
        await expect(proxy.updateDelta({ data: rows.slice() })).rejects.toThrow(
            /validations\.throwOn: error - datum exploded/
        );
        boom = false;

        expect(onDiagnosticRaised).toHaveBeenCalledWith({ level: 'error', message: 'datum exploded' });
        (console.error as Mock).mockClear();
    });

    // The callbacks run in the render pass that a first-render update-type shortcut restarted, which
    // no longer counts as re-evaluating them — so the buffered error was never committed.
    it('reports a callback that throws on the first render to both the overlay and the listener', async () => {
        const onDiagnosticRaised = vi.fn();

        const proxy = AgCharts.create({
            container: document.body,
            data: [
                { x: 'A', y: 10 },
                { x: 'B', y: 20 },
            ],
            series: [
                {
                    type: 'bar',
                    xKey: 'x',
                    yKey: 'y',
                    itemStyler: () => {
                        throw new Error('itemStyler boom');
                    },
                },
            ],
            validations: { overlayLevel: 'error', onDiagnosticRaised },
        }) as AgChartProxy;
        chart = deproxy(proxy);
        await waitForChartStability(chart);

        expect(onDiagnosticRaised).toHaveBeenCalledWith({
            level: 'error',
            message: expect.stringContaining('itemStyler boom'),
        });
        expect(chart.validationCollector.hasVisibleIssues()).toBe(true);
        expectWarningsCalls().toHaveLength(1);
    });
});
