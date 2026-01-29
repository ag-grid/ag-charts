import { afterEach, describe, expect, it, jest } from '@jest/globals';

import type {
    AgCartesianChartOptions,
    AgChartOptions,
    AgPolarChartOptions,
    InteractionRange,
} from 'ag-charts-community';
import { AgCharts, _ModuleSupport } from 'ag-charts-community';
import {
    type Chart,
    IMAGE_SNAPSHOT_DEFAULTS,
    MIN_TOOLTIP_HIDE_DELAY,
    clickAction,
    deproxy,
    expectWarningsCalls,
    extractImageData,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

const PYRAMID_EXAMPLE: AgChartOptions = {
    title: {
        text: 'Revenue Open by Sales Stage',
    },
    data: [
        { group: 'Qualify', value: 7910 },
        { group: 'Develop', value: 8170 },
        { group: 'Propose', value: 7260 },
        { group: 'Close', value: 4460 },
    ],
    series: [
        {
            type: 'pyramid',
            stageKey: 'group',
            valueKey: 'value',
        },
    ],
};

describe('PyramidSeries', () => {
    setupMockConsole();
    let chart: any;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    describe('Series Highlighting', () => {
        it('should render a chart', async () => {
            const options: AgChartOptions = { ...PYRAMID_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });

        it('should render highlight of node', async () => {
            const options: AgChartOptions = { ...PYRAMID_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const node = chart.series[0].contextNodeData.nodeData[0];

            const highlightManager = (chart as Chart).ctx.highlightManager;
            highlightManager.updateHighlight(chart.id, node);
            await compare();
        });
    });

    const testPointerEvents = (testParams: {
        seriesOptions: any;
        chartOptions?: any;
        getNodeData: (series: any) => any[];
        getNodePoint: (nodeItem: any) => [number, number];
        getDatumValues: (datum: any, series: any) => any[];
        getTooltipRenderedValues: (tooltipRendererParams: any) => any[];
        getHighlightNode: (chart: any, series: any) => any;
    }) => {
        const format = (...values: any[]) => values.join(' ');

        const createChart = async (params: {
            hasTooltip: boolean;
            onNodeClick?: () => void;
            nodeClickRange?: InteractionRange;
        }): Promise<any> => {
            const tooltip = params.hasTooltip
                ? {
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
                        highlight: {
                            highlightedItem: {
                                fill: 'lime',
                            },
                        },
                        listeners,
                        ...nodeClickRangeParams,
                        ...testParams.seriesOptions,
                    },
                ],
                ...(testParams.chartOptions ?? {}),
            };
            prepareEnterpriseTestOptions(options);
            const newChart = deproxy(AgCharts.create(options));
            await waitForChartStability(newChart);
            return newChart;
        };

        const hoverChartNodes = async (
            chartInstance: any,
            iterator: (params: { series: any; item: any; x: number; y: number }) => Promise<void> | void
        ) => {
            for (const series of chartInstance.series) {
                const nodeData = testParams.getNodeData(series);
                expect(nodeData.length).toBeGreaterThan(0);
                for (const item of nodeData) {
                    const itemPoint = testParams.getNodePoint(item);
                    const { x, y } = _ModuleSupport.Transformable.toCanvasPoint(
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

        const checkHighlight = async (chartInstance: any) => {
            await hoverChartNodes(chartInstance, ({ series }) => {
                // Check the highlighted node
                const highlightNode = testParams.getHighlightNode(chartInstance, series);
                expect(highlightNode).toBeDefined();
                expect(highlightNode.fill).toEqual('lime');
            });
        };

        const checkNodeClick = async (
            chartInstance: Chart,
            onNodeClick: () => void,
            offset?: { x: number; y: number }
        ) => {
            await hoverChartNodes(chartInstance, async ({ x, y }) => {
                // Perform click
                await clickAction(x + (offset?.x ?? 0), y + (offset?.y ?? 0))(chartInstance);
                await waitForChartStability(chartInstance);
            });

            // Check click handler
            const nodeCount = chartInstance.series.reduce(
                (sum, series) => sum + testParams.getNodeData(series).length,
                0
            );
            expect(onNodeClick).toHaveBeenCalledTimes(nodeCount);
        };

        const checkLegendClick = async (chartInstance: any) => {
            await waitForChartStability(chart);
            for (const { legend } of deproxy(chart).modulesManager.legends()) {
                const markerLabels = (legend as any).itemSelection?._nodes ?? [];
                for (const label of markerLabels) {
                    const { x, y } = _ModuleSupport.Transformable.toCanvas(label).computeCenter();
                    await clickAction(x, y)(chartInstance);
                    await waitForChartStability(chart);
                    await compare();
                }
            }
        };

        it(`should render tooltip correctly`, async () => {
            chart = await createChart({ hasTooltip: true });
            await hoverChartNodes(chart, ({ series, item }) => {
                // Check the tooltip is shown
                const tooltip = document.querySelector('.ag-charts-tooltip');
                expect(tooltip).toBeInstanceOf(HTMLElement);
                expect(!tooltip?.hasAttribute('data-presented-as-popover')).toBe(false);

                // Check the tooltip text
                const values = testParams.getDatumValues(item, series);
                expect(tooltip?.textContent).toEqual(format(...values));
            });

            // Check the tooltip is hidden (hover over top-left corner)
            await hoverAction(8, 8)(chart);
            await waitForChartStability(chart, MIN_TOOLTIP_HIDE_DELAY);
            const tooltip = document.querySelector('.ag-charts-tooltip');
            expect(!tooltip?.hasAttribute('data-presented-as-popover')).toBe(true);
        });

        it(`should highlight hovered items`, async () => {
            chart = await createChart({ hasTooltip: true });
            await checkHighlight(chart);
        });

        it(`should handle nodeClick event`, async () => {
            const onNodeClick = jest.fn();
            chart = await createChart({ hasTooltip: true, onNodeClick });
            await checkNodeClick(chart, onNodeClick);
        });

        it(`should highlight hovered items when tooltip is disabled`, async () => {
            chart = await createChart({ hasTooltip: false });
            await checkHighlight(chart);
        });

        it(`should handle nodeClick event when tooltip is disabled`, async () => {
            const onNodeClick = jest.fn();
            chart = await createChart({ hasTooltip: false, onNodeClick });
            await checkNodeClick(chart, onNodeClick);
        });

        it(`should handle nodeClick event with offset click when range is 'nearest'`, async () => {
            const onNodeClick = jest.fn();
            chart = await createChart({ hasTooltip: true, onNodeClick, nodeClickRange: 'nearest' });
            await checkNodeClick(chart, onNodeClick, { x: 5, y: 5 });
        });

        it(`should handle legendClick event`, async () => {
            const onNodeClick = jest.fn();
            chart = await createChart({ hasTooltip: true, onNodeClick, nodeClickRange: 'nearest' });
            await checkLegendClick(chart);
        });

        it(`should handle nodeClick event with offset click when range is within pixel distance`, async () => {
            const onNodeClick = jest.fn();
            chart = await createChart({ hasTooltip: true, onNodeClick, nodeClickRange: 6 });
            await checkNodeClick(chart, onNodeClick, { x: 0, y: 5 });
        });
    };

    describe(`Pyramid Series Pointer Events`, () => {
        const datasets = {
            data: PYRAMID_EXAMPLE.data,
            stageKey: 'group',
            valueKey: 'value',
        };

        const cartesianTestParams = {
            getNodeData: (series) => series.contextNodeData?.nodeData ?? [],
            getTooltipRenderedValues: (params) => [params.datum[params.stageKey], params.datum[params.valueKey]],
            // Returns a highlighted node
            getHighlightNode: (_, series) => series.highlightNodeGroup.children().next().value,
        } as Parameters<typeof testPointerEvents>[0];

        testPointerEvents({
            ...cartesianTestParams,
            seriesOptions: {
                type: 'pyramid',
                stageKey: datasets.stageKey,
                valueKey: datasets.valueKey,
            },
            chartOptions: {
                data: datasets.data,
            },
            getNodeData: (series) => series.contextNodeData?.nodeData ?? [],
            getNodePoint: (item) => [item.midPoint.x, item.midPoint.y],
            getDatumValues: (item) => {
                const { datum } = item;
                return [datum[datasets.stageKey], datum[datasets.valueKey]];
            },
            getTooltipRenderedValues: (params) => [params.datum[params.stageKey], params.datum[params.valueKey]],
            getHighlightNode: (chartInstance, series) => {
                const highlightedDatum = chartInstance.ctx.highlightManager.getActiveHighlight();
                return [...series.highlightNodeGroup.children()].find(
                    (child: any) => child.datum.id === highlightedDatum.id
                );
            },
        });
    });

    describe('gradient fill', () => {
        it('should render pyramid series with a default gradient fill', async () => {
            const options = {
                ...PYRAMID_EXAMPLE,
                series: [
                    {
                        type: 'pyramid',
                        stageKey: 'group',
                        valueKey: 'value',
                        fills: [
                            {
                                type: 'gradient',
                            },
                        ],
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as AgChartOptions);

            chart = deproxy(AgCharts.create(options as AgChartOptions));
            await compare();
        });

        it('should render pyramid series with a gradient fill', async () => {
            const options = {
                ...PYRAMID_EXAMPLE,
                series: [
                    {
                        type: 'pyramid',
                        stageKey: 'group',
                        valueKey: 'value',
                        fills: [
                            {
                                type: 'gradient',
                                colorStops: [
                                    {
                                        color: 'green',
                                    },
                                    {
                                        color: 'white',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as AgChartOptions);

            chart = deproxy(AgCharts.create(options as AgChartOptions));
            await compare();
        });

        it('should render pyramid series with a mix of gradient and string fills', async () => {
            const options = {
                ...PYRAMID_EXAMPLE,
                series: [
                    {
                        type: 'pyramid',
                        stageKey: 'group',
                        valueKey: 'value',
                        fills: [
                            {
                                type: 'gradient',
                                colorStops: [
                                    {
                                        color: 'green',
                                    },
                                    {
                                        color: 'white',
                                    },
                                ],
                            },
                            'blue',
                        ],
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as AgChartOptions);

            chart = deproxy(AgCharts.create(options as AgChartOptions));
            await compare();
        });

        it('should render pyramid series with a series bound gradient fill', async () => {
            const options = {
                ...PYRAMID_EXAMPLE,
                series: [
                    {
                        type: 'pyramid',
                        stageKey: 'group',
                        valueKey: 'value',
                        fills: [
                            {
                                type: 'gradient',
                                bounds: 'series',
                                colorStops: [
                                    {
                                        color: 'green',
                                    },
                                    {
                                        color: 'white',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as AgChartOptions);

            chart = deproxy(AgCharts.create(options as AgChartOptions));
            await compare();
        });
    });

    describe('null category key', () => {
        it('should render with null category key value', async () => {
            const options: AgChartOptions = {
                data: [
                    { group: 'Qualify', value: 7910 },
                    { group: null, value: 8170 },
                    { group: 'Propose', value: 7260 },
                    { group: 'Close', value: 4460 },
                ],
                series: [
                    {
                        type: 'pyramid',
                        stageKey: 'group',
                        valueKey: 'value',
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [PyramidSeries-1 / xValue] ignored:",
    "[null]",
  ],
]
`);
            await compare();
        });

        it('should filter undefined category key value', async () => {
            const options: AgChartOptions = {
                data: [
                    { group: 'Qualify', value: 7910 },
                    { group: undefined, value: 8170 },
                    { group: 'Propose', value: 7260 },
                    { group: 'Close', value: 4460 },
                ],
                series: [
                    {
                        type: 'pyramid',
                        stageKey: 'group',
                        valueKey: 'value',
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [undefined] for [PyramidSeries-1 / xValue] ignored:",
    "[undefined]",
  ],
]
`);
            await compare();
        });

        it('should accept null category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                data: [
                    { group: 'Qualify', value: 7910 },
                    { group: null, value: 8170 },
                    { group: 'Propose', value: 7260 },
                    { group: 'Close', value: 4460 },
                ],
                series: [
                    {
                        type: 'pyramid',
                        stageKey: 'group',
                        valueKey: 'value',
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            expectWarningsCalls().toEqual([]);
            await compare();
        });

        it('should accept undefined category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                data: [
                    { group: 'Qualify', value: 7910 },
                    { group: undefined, value: 8170 },
                    { group: 'Propose', value: 7260 },
                    { group: 'Close', value: 4460 },
                ],
                series: [
                    {
                        type: 'pyramid',
                        stageKey: 'group',
                        valueKey: 'value',
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            expectWarningsCalls().toEqual([]);
            await compare();
        });

        it('should treat null and undefined as distinct categories', async () => {
            const options: AgChartOptions = {
                data: [
                    { group: 'Qualify', value: 7910 },
                    { group: null, value: 8170 },
                    { group: undefined, value: 7260 },
                    { group: 'Close', value: 4460 },
                ],
                series: [
                    {
                        type: 'pyramid',
                        stageKey: 'group',
                        valueKey: 'value',
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            expectWarningsCalls().toEqual([]);
            await compare();
        });
    });

    test('AG-8290 label boxing', async () => {
        const options = prepareEnterpriseTestOptions({
            data: [
                { group: 'Close', value: 4460 },
                { group: 'Propose', value: 7260 },
                { group: 'Develop', value: 7910 },
                { group: 'Qualify', value: 9170 },
            ],
            series: [
                {
                    type: 'pyramid',
                    stageKey: 'group',
                    valueKey: 'value',
                    label: {
                        fontSize: 24,
                        cornerRadius: 15,
                        padding: 8,
                        color: 'purple',
                        fill: 'pink',
                        border: { stroke: 'black', strokeWidth: 1 },
                    },
                    stageLabel: {
                        fill: 'skyblue',
                        color: 'blue',
                        padding: 6,
                        cornerRadius: 10,
                        border: { stroke: 'olive', strokeWidth: 3 },
                    },
                },
            ],
        });
        chart = deproxy(AgCharts.create(options));
        await compare();
    });
});
