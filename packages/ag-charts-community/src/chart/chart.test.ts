import { afterEach, describe, expect, it, jest } from '@jest/globals';

import type { AgCartesianChartOptions, AgPolarChartOptions, InteractionRange } from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import type { Node } from '../scene/node';
import { Selection } from '../scene/selection';
import { Rect } from '../scene/shape/rect';
import { Sector } from '../scene/shape/sector';
import { Transformable } from '../scene/transformable';
import type { Chart } from './chart';
import type { AgChartProxy } from './chartProxy';
import { DataSet } from './data/dataSet';
import { Marker } from './marker/marker';
import {
    MIN_TOOLTIP_HIDE_DELAY,
    clickAction,
    createChart,
    deproxy,
    doubleClickAction,
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
                    const { x, y } = Transformable.toCanvasPoint(series.contentGroup, itemPoint[0], itemPoint[1]);
                    await hoverAction(x, y)(chartInstance);
                    await waitForChartStability(chartInstance);
                    await iterator({ series, item, x, y });
                }
            }
        };

        const checkHighlight = async (chartInstance: Chart) => {
            await hoverChartNodes(chartInstance, ({ series }) => {
                // Check the highlighted marker
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
                // Perform click
                await clickAction(x, y)(chartInstance);
                await waitForChartStability(chartInstance);
            });

            // Check click handler
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
                // Perform click
                const [downX, downY] = nodeExit(item);
                await clickAction(x, y, { mousedown: { offsetX: downX, offsetY: downY } })(chartInstance);
                await waitForChartStability(chartInstance);
            });

            // Check click handler
            expect(onNodeClick).toHaveBeenCalledTimes(0);
        };

        it(`should render tooltip correctly`, async () => {
            chart = await createChartPreset({ hasTooltip: true });
            await hoverChartNodes(chart, ({ series, item }) => {
                // Check the tooltip is shown
                const tooltip = document.querySelector('.ag-charts-tooltip');
                expect(tooltip).toBeInstanceOf(HTMLElement);
                expect(!tooltip?.hasAttribute('data-presented-as-popover')).toBe(false);

                // Check the tooltip text
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
            const onNodeClick = jest.fn();
            chart = await createChartPreset({ hasTooltip: true, onNodeClick });
            await checkNodeClick(chart, onNodeClick);
        });

        it(`should highlight hovered items when tooltip is disabled`, async () => {
            chart = await createChartPreset({ hasTooltip: false });
            await checkHighlight(chart);
        });

        it(`should handle nodeClick event when tooltip is disabled`, async () => {
            const onNodeClick = jest.fn();
            chart = await createChartPreset({ hasTooltip: false, onNodeClick });
            await checkNodeClick(chart, onNodeClick);
        });

        it(`should handle nodeClick event with offset click when range is 'nearest'`, async () => {
            const onNodeClick = jest.fn();
            chart = await createChartPreset({ hasTooltip: true, onNodeClick, nodeClickRange: 'nearest' });
            await checkNodeClick(chart, onNodeClick, true, true);
        });

        it(`should handle nodeClick event with offset click when range is within pixel distance`, async () => {
            const onNodeClick = jest.fn();
            chart = await createChartPreset({ hasTooltip: true, onNodeClick, nodeClickRange: 6 });
            await waitForChartStability(chart);
            await checkNodeClick(chart, onNodeClick, false, true);
        });

        it(`should trigger nodeClick event only on mousedown and mouseup`, async () => {
            const onNodeClick = jest.fn();
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

        // AG-16389: updateDelta should not reset data accumulated via applyTransaction
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

            // Step 1: Create chart with initial data
            const chartProxy = AgCharts.create(options);
            chart = deproxy(chartProxy);
            await waitForChartStability(chart);
            expect(chart.data.data.length).toBe(2);

            // Step 2: updateDelta with increasing length data-set (simulates loading data)
            await chartProxy.updateDelta({
                data: [
                    { x: 0, y: 10 },
                    { x: 1, y: 20 },
                    { x: 2, y: 30 },
                ],
            });
            await waitForChartStability(chart);
            expect(chart.data.data.length).toBe(3);

            // Step 3: Full update back to initialData (simulates user action that resets data)
            await chartProxy.updateDelta({ data: initialData });
            await waitForChartStability(chart);
            expect(chart.data.data.length).toBe(2);

            // At this point, DataSet.data and userOptions.data may have different references
            // Step 4: Use applyTransaction to add more data (streaming scenario)
            await chartProxy.applyTransaction({
                add: [
                    { x: 2, y: 30 },
                    { x: 3, y: 40 },
                ],
            });
            await waitForChartStability(chart);
            expect(chart.data.data.length).toBe(4);

            // Step 5: Toggle series option - this should NOT reset the data
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
            expect(chart.data).toEqual(DataSet.wrap(moreData));
            expect(chart.series[0].data).toEqual(DataSet.wrap(moreData));
            expect(chart.series[1].data).toEqual(DataSet.wrap(lessData));

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

            expect(chart.data).toEqual(DataSet.wrap(moreData));
            expect(chart.series[0].data).toEqual(DataSet.wrap(lessData));
            expect(chart.series[1].data).toEqual(DataSet.wrap(moreData));

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
            const nodeClick = jest.fn();
            const nodeDoubleClick = jest.fn();
            const seriesNodeClick = jest.fn();
            const seriesNodeDoubleClick = jest.fn();
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

            await doubleClickAction(200, 200)(agChartInstance);

            expect(nodeDoubleClick).toHaveBeenCalledTimes(1);
            expect(seriesNodeDoubleClick).toHaveBeenCalledTimes(1);

            expect(nodeDoubleClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'seriesNodeDoubleClick' }));
            expect(seriesNodeDoubleClick).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'seriesNodeDoubleClick' })
            );
        });
    });

    describe('AG-16337 listeners undefined update', () => {
        it('should handle chart-level listeners set to undefined', async () => {
            const chartClick = jest.fn();
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

            // Verify listener is registered
            expect(chart.hasEventListener('click')).toBe(true);

            // Reset mock call count before clearing
            chartClick.mockClear();

            // Update with listeners: undefined
            await agChartInstance.update({
                ...options,
                listeners: undefined,
            });
            await waitForChartStability(chart);

            // Verify listener is cleared
            expect(chart.hasEventListener('click')).toBe(false);

            // Trigger a click event and verify the cleared listener is not called
            await clickAction(100, 100)(agChartInstance);
            await waitForChartStability(chart);
            expect(chartClick).not.toHaveBeenCalled();
        });

        it('should handle series-level listeners set to undefined', async () => {
            const seriesNodeClick = jest.fn();
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

            // Verify listener is registered
            expect(chart.series[0].hasEventListener('seriesNodeClick')).toBe(true);

            // Update with series listeners: undefined
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

            // Verify listener is cleared
            expect(chart.series[0].hasEventListener('seriesNodeClick')).toBe(false);
        });

        it('should handle both chart and series listeners set to undefined', async () => {
            const chartClick = jest.fn();
            const seriesNodeClick = jest.fn();
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

            // Verify listeners are registered
            expect(chart.hasEventListener('click')).toBe(true);
            expect(chart.series[0].hasEventListener('seriesNodeClick')).toBe(true);

            // Reset mock call counts before clearing
            chartClick.mockClear();
            seriesNodeClick.mockClear();

            // Update with both listeners: undefined
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

            // Verify listeners are cleared
            expect(chart.hasEventListener('click')).toBe(false);
            expect(chart.series[0].hasEventListener('seriesNodeClick')).toBe(false);

            // Trigger click events and verify cleared listeners are not called
            await clickAction(200, 200)(agChartInstance);
            await waitForChartStability(chart);
            expect(chartClick).not.toHaveBeenCalled();
            expect(seriesNodeClick).not.toHaveBeenCalled();
        });

        it('should preserve internal listeners after clearing user series listeners', async () => {
            const seriesNodeClick = jest.fn();
            const seriesVisibilityChange = jest.fn();
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

            // Verify user listener is registered
            expect(chart.series[0].hasEventListener('seriesNodeClick')).toBe(true);
            // Verify internal listeners are registered
            expect(chart.series[0].hasEventListener('groupingChanged')).toBe(true);
            expect(chart.series[0].hasEventListener('seriesVisibilityChange')).toBe(true);

            // Update with series listeners: undefined
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

            // Verify user listener is cleared
            expect(chart.series[0].hasEventListener('seriesNodeClick')).toBe(false);
            // Verify internal listeners are still registered
            expect(chart.series[0].hasEventListener('groupingChanged')).toBe(true);
            expect(chart.series[0].hasEventListener('seriesVisibilityChange')).toBe(true);
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

                // Verify it was appended
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

                // Data unchanged
                expect(chart.data.data).toHaveLength(3);
            });

            it('should accept empty transaction', async () => {
                // Empty transaction is allowed but does nothing
                await expect(chartProxy.applyTransaction({})).resolves.not.toThrow();
                await waitForChartStability(chart);

                // Data unchanged
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

                // Verify all data items have valid values (non-zero)
                for (const item of updatedOptions.data!) {
                    expect(item.value).toBeGreaterThan(0);
                }
            });
        });
    });
});
