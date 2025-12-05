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
    GALLERY_EXAMPLES,
    IMAGE_SNAPSHOT_DEFAULTS,
    MIN_TOOLTIP_HIDE_DELAY,
    TREEMAP_SERIES_LABELS,
    clickAction,
    deproxy,
    extractImageData,
    hierarchyChartAssertions,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';
import type { TreemapSeries } from './treemapSeries';

describe('TreemapSeries', () => {
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
        const SIMPLIFIED_EXAMPLE = {
            ...GALLERY_EXAMPLES.TREEMAP_WITH_COLOR_RANGE_EXAMPLE.options,
            data: GALLERY_EXAMPLES.TREEMAP_WITH_COLOR_RANGE_EXAMPLE.options.data?.slice(0, 1),
        };

        it('should render a complex chart', async () => {
            const options: AgChartOptions = {
                ...SIMPLIFIED_EXAMPLE,
                animation: { enabled: false },
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });

        const childAtDepth = [0, 0, 0, 0];
        it.each([0, 1, 2, 3])(`should render highlight at depth %s`, async (depth) => {
            const options: AgChartOptions = {
                ...SIMPLIFIED_EXAMPLE,
                animation: { enabled: false },
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const seriesImpl = chart.series[0] as TreemapSeries;
            let node = seriesImpl.rootNode;
            const childIndexes = [...childAtDepth];
            while (depth > 0 && node) {
                node = node.children[childIndexes.shift() ?? 0];
                depth--;
            }

            const highlightManager = (chart as Chart).ctx.highlightManager;
            highlightManager.updateHighlight(chart.id, node as any);
            await compare();
        });
    });

    describe('Series Labels', () => {
        const examples = {
            TREEMAP_SERIES_LABELS: {
                options: TREEMAP_SERIES_LABELS,
                assertions: hierarchyChartAssertions({ seriesTypes: ['treemap'] }),
            },
        };

        for (const [exampleName, example] of Object.entries(examples)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                const options: AgChartOptions = {
                    ...example.options,
                    animation: { enabled: false },
                };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                const options: AgChartOptions = {
                    ...example.options,
                    animation: { enabled: false },
                };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await compare();
            });
        }
    });

    describe('Label itemStyler', () => {
        it('should style labels via itemStyler', async () => {
            const options: AgChartOptions = {
                data: [
                    {
                        name: 'Group',
                        children: [
                            { name: 'Alpha', size: 6 },
                            { name: 'Beta', size: 4 },
                        ],
                    },
                ],
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'size',
                        tile: {
                            label: {
                                enabled: true,
                                itemStyler: () => ({ color: 'lime' }),
                            },
                        },
                        group: {
                            label: {
                                enabled: true,
                                itemStyler: () => ({ color: 'lime' }),
                            },
                        },
                    },
                ],
                animation: { enabled: false },
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
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
                tooltip: { range: 'exact' },
                series: [
                    {
                        tooltip,
                        tile: {
                            highlight: {
                                highlightedItem: { fill: 'lime' },
                            },
                        },
                        group: {
                            highlight: {
                                highlightedItem: { fill: 'lime' },
                            },
                        },
                        listeners,
                        ...nodeClickRangeParams,
                        ...testParams.seriesOptions,
                    },
                ],
                ...(testParams.chartOptions ?? {}),
                animation: { enabled: false },
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
                // Check the highlighted marker
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

        it(`should handle nodeClick event with offset click when range is within pixel distance`, async () => {
            const onNodeClick = jest.fn();
            chart = await createChart({ hasTooltip: true, onNodeClick, nodeClickRange: 6 });
            await checkNodeClick(chart, onNodeClick, { x: 0, y: 5 });
        });
    };

    describe(`Treemap Series Pointer Events`, () => {
        const datasets = {
            data: [
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
            valueKey: 'count',
            labelKey: 'name',
        };

        const cartesianTestParams = {
            getNodeData: (series) => series.contextNodeData?.nodeData ?? [],
            getTooltipRenderedValues: (params) => [params.xValue, params.yValue],
            // Returns a highlighted marker
            getHighlightNode: (_, series) => series.highlightNodeGroup.children().next().value,
        } as Parameters<typeof testPointerEvents>[0];

        testPointerEvents({
            ...cartesianTestParams,
            seriesOptions: {
                type: 'treemap',
                labelKey: datasets.labelKey,
                sizeKey: datasets.valueKey,
                colorKey: undefined,
            },
            chartOptions: {
                data: datasets.data,
            },
            getNodeData: (series) => {
                const nodes = Array.from(series.datumSelection.nodes());
                const maxDepth = Math.max(...nodes.map((n: any) => n.datum.depth ?? -1));
                return nodes.filter((node: any) => node.datum.depth === maxDepth);
            },
            getNodePoint: (item) => {
                const { x, y, width, height } = item.clipBBox ?? item;
                return [x + width / 2, y + height / 2];
            },
            getDatumValues: (item, series) => {
                const { datum } = item.datum;
                return [datum[series.properties.labelKey], datum[series.properties.sizeKey]];
            },
            getTooltipRenderedValues: (params) => {
                const { datum } = params;
                return [datum[params.labelKey], datum[params.sizeKey]];
            },
            getHighlightNode: (_chartInstance, series) => {
                return Array.from(series.highlightSelection.nodes())[0];
            },
        });
    });

    describe('gradient fill', () => {
        it('should render treemap series with a default gradient fill', async () => {
            const options = {
                ...GALLERY_EXAMPLES.TREEMAP_WITH_COLOR_RANGE_EXAMPLE.options,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        secondaryLabelKey: 'change',
                        sizeName: 'Valuation',
                        sizeKey: 'valuation',
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

        it('should render treemap series with a gradient fill', async () => {
            const options = {
                ...GALLERY_EXAMPLES.TREEMAP_WITH_COLOR_RANGE_EXAMPLE.options,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        secondaryLabelKey: 'change',
                        sizeName: 'Valuation',
                        sizeKey: 'valuation',
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

        it('should render treemap series with a mix of gradient and string fills', async () => {
            const options = {
                ...GALLERY_EXAMPLES.TREEMAP_WITH_COLOR_RANGE_EXAMPLE.options,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        secondaryLabelKey: 'change',
                        sizeName: 'Valuation',
                        sizeKey: 'valuation',
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
    });

    test('AG-8290 label boxing', async () => {
        const options = prepareEnterpriseTestOptions({
            ...GALLERY_EXAMPLES.TREEMAP_WITH_COLOR_RANGE_EXAMPLE.options,
            series: [
                {
                    type: 'treemap',
                    labelKey: 'name',
                    secondaryLabelKey: 'change',
                    sizeName: 'Valuation',
                    sizeKey: 'valuation',
                    group: {
                        label: {
                            fontSize: 18,
                            spacing: 2,
                            fill: 'pink',
                            border: { stroke: 'black', strokeWidth: 1 },
                        },
                    },
                    tile: {
                        label: {
                            fontSize: 24,
                            minimumFontSize: 9,
                            spacing: 8,
                            fill: 'pink',
                            border: { stroke: 'black', strokeWidth: 1 },
                        },
                        secondaryLabel: {
                            formatter: (params) => `£${params.value.toFixed(1)}bn`,
                            fill: 'lime',
                            color: 'blue',
                            border: { stroke: 'olive', strokeWidth: 3 },
                        },
                    },
                },
            ],
        });

        chart = deproxy(AgCharts.create(options));
        await compare();
    });

    describe('AG-15448', () => {
        const DATA1 = [
            { type: 'Electronics', category: 'Phones', product: 'iPhone', value: 100, status: 1 },
            { type: 'Electronics', category: 'Phones', product: 'Samsung', value: 80, status: 1 },
            { type: 'Electronics', category: 'Laptops', product: 'MacBook', value: 150, status: 1 },
            { type: 'Electronics', category: 'Laptops', product: 'Dell', value: 120, status: 2 },
            { type: 'Furniture', category: 'Chairs', product: 'Office Chair', value: 70, status: 2 }, // This overlaps with the DATA2 dataset and can render in the wrong color.
            { type: 'Furniture', category: 'Tables', product: 'Desk', value: 90, status: 1 },
        ];

        const DATA2 = [
            { type: 'Furniture', category: 'Chairs', product: 'Office Chair (green)', value: 70, status: 2 },
            { type: 'Furniture', category: 'Chairs', product: 'Gaming Chair (green)', value: 60, status: 2 },
            { type: 'Appliances', category: 'Kitchen', product: 'Microwave (orange)', value: 50, status: 1 },
        ];

        const EXAMPLE_OPTIONS: AgChartOptions = {
            context: { colors: { 1: 'orange', 2: 'green' } },
            data: DATA1,
            series: [
                {
                    type: 'treemap',
                    labelKey: 'product',
                    sizeKey: 'value',
                    itemStyler: ({ datum, context }: any) => ({
                        fill: context?.colors[datum.status] ?? 'none',
                    }),
                },
            ],
        };

        it('should render updated data in the itemStyler specified colors', async () => {
            const options = { ...EXAMPLE_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            await chart.updateDelta({ data: DATA2 });
            await compare();
        });
    });
});
