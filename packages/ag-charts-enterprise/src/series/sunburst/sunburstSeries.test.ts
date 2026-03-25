import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { MatchImageSnapshotOptions } from 'jest-image-snapshot';

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
    SUNBURST_SERIES_LABELS,
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
import type { SunburstSeries } from './sunburstSeries';

describe('SunburstSeries', () => {
    setupMockConsole();
    let chart: any;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async (opts: MatchImageSnapshotOptions = IMAGE_SNAPSHOT_DEFAULTS) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(opts);
    };

    describe('Series Highlighting', () => {
        const SIMPLIFIED_EXAMPLE = {
            ...GALLERY_EXAMPLES.SIMPLE_SUNBURST_EXAMPLE.options,
        };

        it('should render a complex chart', async () => {
            const options: AgChartOptions = { ...SIMPLIFIED_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });

        const childAtDepth = [0, 0, 0, 0];
        it.each([0, 1, 2, 3])(`should render highlight at depth %s`, async (depth) => {
            const options: AgChartOptions = { ...SIMPLIFIED_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const seriesImpl = chart.series[0] as SunburstSeries;
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
            SUNBURST_SERIES_LABELS: {
                options: SUNBURST_SERIES_LABELS,
                assertions: hierarchyChartAssertions({ seriesTypes: ['sunburst'] }),
            },
        };

        for (const [exampleName, example] of Object.entries(examples)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                const options: AgChartOptions = { ...example.options };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                const options: AgChartOptions = { ...example.options };
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
                        name: 'Solar',
                        children: [
                            { name: 'Earth', size: 60 },
                            { name: 'Mars', size: 20 },
                        ],
                    },
                    {
                        name: 'Gas Giants',
                        children: [{ name: 'Jupiter', size: 80 }],
                    },
                ],
                series: [
                    {
                        type: 'sunburst',
                        labelKey: 'name',
                        sizeKey: 'size',
                        label: {
                            itemStyler: () => ({ color: 'lime' }),
                        },
                    },
                ],
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

    describe(`Sunburst Series Pointer Events`, () => {
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
                type: 'sunburst',
                labelKey: datasets.labelKey,
                sizeKey: datasets.valueKey,
                colorKey: undefined,
            },
            chartOptions: {
                data: datasets.data,
            },
            getNodeData: (series) => {
                const nodes = Array.from(series.sectorGroup.children());
                const maxDepth = Math.max(...nodes.map((n: any) => n.datum.depth ?? -1));
                return nodes.filter((node: any) => node.datum.depth === maxDepth);
            },
            getNodePoint: (item) => {
                const { centerX, centerY, innerRadius, outerRadius, startAngle, endAngle } = item;
                const r = (innerRadius + outerRadius) / 2;
                const theta = (startAngle + endAngle) / 2;
                return [centerX + r * Math.cos(theta), centerY + r * Math.sin(theta)];
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
        it('should render sunburst series with a default gradient fill', async () => {
            const options = {
                ...GALLERY_EXAMPLES.SIMPLE_SUNBURST_EXAMPLE.options,
                series: [
                    {
                        type: 'sunburst',
                        labelKey: 'name',
                        secondaryLabelKey: 'capacity',
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

        it('should render sunburst series with a gradient fill', async () => {
            const options = {
                ...GALLERY_EXAMPLES.SIMPLE_SUNBURST_EXAMPLE.options,
                series: [
                    {
                        type: 'sunburst',
                        labelKey: 'name',
                        secondaryLabelKey: 'capacity',
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

        it('should render sunburst series with a mix of gradient and string fills', async () => {
            const options = {
                ...GALLERY_EXAMPLES.SIMPLE_SUNBURST_EXAMPLE.options,
                series: [
                    {
                        type: 'sunburst',
                        labelKey: 'name',
                        secondaryLabelKey: 'capacity',
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

        it('should render sunburst series with an item bound gradient fill', async () => {
            const options = {
                ...GALLERY_EXAMPLES.SIMPLE_SUNBURST_EXAMPLE.options,
                series: [
                    {
                        type: 'sunburst',
                        labelKey: 'name',
                        secondaryLabelKey: 'capacity',
                        fills: [
                            {
                                type: 'gradient',
                                bounds: 'item',
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

        it('should render sunburst series with a linear gradient fill', async () => {
            const options = {
                ...GALLERY_EXAMPLES.SIMPLE_SUNBURST_EXAMPLE.options,
                series: [
                    {
                        type: 'sunburst',
                        labelKey: 'name',
                        secondaryLabelKey: 'capacity',
                        fills: [
                            {
                                type: 'gradient',
                                gradient: 'linear',
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

        it('should render sunburst series with an item bound linear gradient fill', async () => {
            const options = {
                ...GALLERY_EXAMPLES.SIMPLE_SUNBURST_EXAMPLE.options,
                series: [
                    {
                        type: 'sunburst',
                        labelKey: 'name',
                        secondaryLabelKey: 'capacity',
                        fills: [
                            {
                                type: 'gradient',
                                gradient: 'linear',
                                bounds: 'item',
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

    describe('colorScale', () => {
        const COLOR_SUNBURST_DATA = [
            {
                name: 'Americas',
                children: [
                    { name: 'United States', gdp: 26.9, change: 6 },
                    { name: 'Canada', gdp: 2.1, change: 0 },
                    { name: 'Brazil', gdp: 2.1, change: 11 },
                ],
            },
            {
                name: 'Asia',
                children: [
                    { name: 'China', gdp: 17.7, change: 0 },
                    { name: 'Japan', gdp: 4.2, change: -1 },
                    { name: 'India', gdp: 4, change: 20 },
                ],
            },
            {
                name: 'Europe',
                children: [
                    { name: 'Germany', gdp: 4.4, change: 9 },
                    { name: 'France', gdp: 3, change: 10 },
                    { name: 'UK', gdp: 3.3, change: 9 },
                ],
            },
        ];

        const COLOR_SUNBURST_BASE: AgChartOptions = {
            data: COLOR_SUNBURST_DATA,
            series: [
                {
                    type: 'sunburst',
                    labelKey: 'name',
                    sizeKey: 'gdp',
                    colorKey: 'change',
                },
            ],
        };

        it('should render with continuous colorScale', async () => {
            const options: AgChartOptions = {
                ...COLOR_SUNBURST_BASE,
                series: [
                    {
                        type: 'sunburst',
                        labelKey: 'name',
                        sizeKey: 'gdp',
                        colorKey: 'change',
                        colorScale: {
                            fills: [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }],
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });

        it('should render with discrete colorScale', async () => {
            const options: AgChartOptions = {
                ...COLOR_SUNBURST_BASE,
                series: [
                    {
                        type: 'sunburst',
                        labelKey: 'name',
                        sizeKey: 'gdp',
                        colorKey: 'change',
                        colorScale: {
                            fills: [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }],
                            mode: 'discrete' as const,
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });

        it('should render with explicit domain colorScale', async () => {
            const options: AgChartOptions = {
                ...COLOR_SUNBURST_BASE,
                series: [
                    {
                        type: 'sunburst',
                        labelKey: 'name',
                        sizeKey: 'gdp',
                        colorKey: 'change',
                        colorScale: {
                            fills: [{ color: 'green' }, { color: 'white' }, { color: 'purple' }],
                            domain: [-10, 25] as [number, number],
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });

        it('should render with discrete named stops colorScale', async () => {
            const options: AgChartOptions = {
                ...COLOR_SUNBURST_BASE,
                series: [
                    {
                        type: 'sunburst',
                        labelKey: 'name',
                        sizeKey: 'gdp',
                        colorKey: 'change',
                        colorScale: {
                            fills: [
                                { color: 'red', stop: 0, name: 'Decline' },
                                { color: 'yellow', stop: 10, name: 'Stable' },
                                { color: 'green', name: 'Growth' },
                            ],
                            mode: 'discrete' as const,
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });
    });

    describe('AG-15448', () => {
        const DATA1 = [
            { type: 'Fruits', category: 'Citrus', item: 'Orange', count: 10, status: 1 },
            { type: 'Fruits', category: 'Citrus', item: 'Lemon', count: 8, status: 1 },
            { type: 'Fruits', category: 'Berries', item: 'Strawberry', count: 15, status: 1 },
            { type: 'Fruits', category: 'Berries', item: 'Blueberry', count: 12, status: 2 },
            { type: 'Vegetables', category: 'Leafy', item: 'Spinach', count: 7, status: 2 }, // This overlaps with the DATA2 dataset and can render in the wrong color.
            { type: 'Vegetables', category: 'Root', item: 'Carrot', count: 9, status: 1 },
        ];

        const DATA2 = [
            { type: 'Vegetables', category: 'Leafy', item: 'Lettuce (green)', count: 6, status: 2 },
            { type: 'Vegetables', category: 'Leafy', item: 'Spinach (green)', count: 7, status: 2 },
            { type: 'Dairy', category: 'Cheese', item: 'Cheddar (orange)', count: 5, status: 1 },
        ];

        const EXAMPLE_OPTIONS: AgChartOptions = {
            context: { colors: { 1: 'orange', 2: 'green' } },
            data: DATA1,
            series: [
                {
                    type: 'sunburst',
                    labelKey: 'item',
                    sizeKey: 'count',
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

    describe('AG-8917', () => {
        const data = [
            {
                name: 'Americas',
                children: [
                    { name: 'United States', gdp: 26.949, gdpChange: 0.06 },
                    { name: 'Canada', gdp: 2.117, gdpChange: 0 },
                    { name: 'Brazil', gdp: 2.126, gdpChange: 0.11 },
                ],
                gdpChange: 0.09,
            },
            {
                name: 'Asia',
                children: [
                    { name: 'China', gdp: 17.7, gdpChange: 0 },
                    { name: 'Japan', gdp: 4.23, gdpChange: 0 },
                    { name: 'India', gdp: 4, gdpChange: 0.2 },
                ],
                gdpChange: 0.05,
            },
            {
                name: 'Europe',
                children: [
                    {
                        name: 'EU',
                        children: [
                            { name: 'Germany', gdp: 4.429, gdpChange: 0.09 },
                            { name: 'France', gdp: 3.049, gdpChange: 0.1 },
                            { name: 'Italy', gdp: 2.186, gdpChange: 0.09 },
                        ],
                        gdpChange: 0.08,
                    },
                    { name: 'United Kingdom', gdp: 3.332, gdpChange: 0.09 },
                ],
                gdpChange: 0.08,
            },
        ];

        test('static label styles', async () => {
            const options = prepareEnterpriseTestOptions({
                data,
                series: [
                    {
                        type: 'sunburst',
                        labelKey: 'name',
                        sizeKey: 'gdp',
                        secondaryLabelKey: 'gdpChange',
                        label: { fill: 'olive', border: { stroke: 'lime' } },
                        secondaryLabel: { fill: 'blue' },
                    },
                ],
            });
            chart = AgCharts.create(options);
            await compare({ customSnapshotIdentifier: 'AG-8917-label-boxing-styles' });
        });

        test('dynamic label styles', async () => {
            const options = prepareEnterpriseTestOptions({
                data,
                series: [
                    {
                        type: 'sunburst',
                        labelKey: 'name',
                        sizeKey: 'gdp',
                        secondaryLabelKey: 'gdpChange',
                        label: {
                            itemStyler: () => {
                                return { fill: 'olive', border: { stroke: 'lime' } };
                            },
                        },
                        secondaryLabel: {
                            itemStyler: () => {
                                return { fill: 'blue' };
                            },
                        },
                    },
                ],
            });
            chart = AgCharts.create(options);
            await compare({ customSnapshotIdentifier: 'AG-8917-label-boxing-styles' });
        });
    });
});
