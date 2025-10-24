import { afterEach, describe, expect, it, jest } from '@jest/globals';

import type {
    AgCartesianChartOptions,
    AgChartOptions,
    AgPolarChartOptions,
    AgSankeySeriesLinkItemStylerParams,
    AgSankeySeriesNodeItemStylerParams,
    AgStandaloneChartOptions,
    InteractionRange,
} from 'ag-charts-community';
import { AgCharts, _ModuleSupport } from 'ag-charts-community';
import {
    Chart,
    GALLERY_EXAMPLES,
    IMAGE_SNAPSHOT_DEFAULTS,
    clickAction,
    deproxy,
    extractImageData,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';
import { FlowProportionDatumType } from '../flow-proportion/flowProportionSeries';

describe('SankeySeries', () => {
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

    describe('layout', () => {
        const layoutScenarios = {
            ghosts: [
                { from: 'Les Saintes', to: 'Total', size: 3 },
                { from: 'Tynemouth', to: 'Total', size: 3 },
                { from: 'Ellerton Lake', to: 'Total', size: 1 },
                { from: 'Tenerife', to: 'Total', size: 1 },
                { from: 'Hyers Islands', to: 'Total', size: 1 },
                { from: 'Banyuls-sur-Mer', to: 'Total', size: 1 },
                { from: 'Orpheus Island Resort', to: 'Australia 1999', size: 6 },
                { from: 'Lizard Island', to: 'Australia 1999', size: 1 },
                { from: 'Northern Ribbon Reefs', to: 'Australia 1999', size: 2 },
                { from: 'Australia 1999', to: 'Total', size: 9 },
                { from: 'Sharm El Sheikh', to: 'Red Sea Advanced PADI', size: 13 },
                { from: 'Red Sea Advanced PADI', to: 'Total', size: 13 },
                { from: 'Mahe', to: 'Seychelles', size: 8 },
                { from: 'Praslin', to: 'Seychelles', size: 4 },
                { from: 'Seychelles', to: 'Total', size: 12 },
                { from: 'Bonaire', to: 'Total', size: 19 },
                { from: 'Faafu Atoll', to: 'Maldives', size: 11 },
                { from: 'Maldives', to: 'Total', size: 11 },
                { from: 'Palau', to: 'Total', size: 19 },
                { from: 'El Quseir', to: 'Roots Red Sea', size: 19 },
                { from: 'Safaga', to: 'Roots Red Sea', size: 2 },
                { from: 'Roots Red Sea', to: 'Total', size: 21 },
            ],
            crossoverAvoidance: [
                { from: 'Netherlands', to: 'European Union', size: 798744 },
                { from: 'Germany', to: 'European Union', size: 1468990 },
                { from: 'European Union', to: 'France', size: 745931 },
                { from: 'European Union', to: 'United States', size: 660541 },
                { from: 'Canada', to: 'United States', size: 594546 },
                { from: 'Belgium', to: 'European Union', size: 628796 },
                { from: 'China', to: 'Hong Kong', size: 400571 },
                { from: 'China', to: 'United States', size: 526454 },
                { from: 'European Union', to: 'United Kingdom', size: 520318 },
                { from: 'China', to: 'European Union', size: 560536 },
                { from: 'Italy', to: 'European Union', size: 539556 },
                { from: 'Mexico', to: 'United States', size: 492715 },
                { from: 'Russia', to: 'European Union', size: 385778 },
                { from: 'Spain', to: 'European Union', size: 365191 },
                { from: 'China', to: 'Japan', size: 312062 },
                { from: 'European Union', to: 'Switzerland', size: 328609 },
                { from: 'South Korea', to: 'China', size: 229073 },
                { from: 'European Union', to: 'Austria', size: 244913 },
                { from: 'Japan', to: 'United States', size: 206091 },
                { from: 'European Union', to: 'Sweden', size: 204849 },
                { from: 'Germany', to: 'United States', size: 184287 },
            ],
            complex: [
                { from: 'Footwear', to: 'North America', size: 2245 },
                { from: 'Footwear', to: 'Europe, Middle East & Africa', size: 1419 },
                { from: 'Footwear', to: 'Greater China', size: 1022 },
                { from: 'Footwear', to: 'Asia Pacific & Latin America', size: 879 },
                { from: 'Apparel', to: 'North America', size: 1405 },
                { from: 'Apparel', to: 'Europe, Middle East & Africa', size: 794 },
                { from: 'Apparel', to: 'Asia Pacific & Latin America', size: 360 },
                { from: 'Apparel', to: 'Greater China', size: 490 },
                { from: 'Equipment', to: 'North America', size: 132 },
                { from: 'Equipment', to: 'Europe, Middle East & Africa', size: 100 },
                { from: 'Equipment', to: 'Greater China', size: 32 },
                { from: 'Equipment', to: 'Asia Pacific & Latin America', size: 59 },
                { from: 'North America', to: 'NIKE Brand', size: 3782 },
                { from: 'Europe, Middle East & Africa', to: 'NIKE Brand', size: 2313 },
                { from: 'Greater China', to: 'NIKE Brand', size: 1544 },
                { from: 'Asia Pacific & Latin America', to: 'NIKE Brand', size: 1298 },
                { from: 'Global Brand Divisions', to: 'NIKE Brand', size: 9 },
                { from: 'NIKE Brand', to: 'Revenues', size: 8946 },
                { from: 'Converse', to: 'Revenues', size: 425 },
                { from: 'Corporate', to: 'Revenues', size: 3 },
                { from: 'Revenues', to: 'Cost of sales', size: 5269 },
                { from: 'Revenues', to: 'Gross profit', size: 4105 },
                { from: 'Gross profit', to: 'Selling and administrative expense', size: 3142 },
                { from: 'Gross profit', to: 'Interest expense', size: 14 },
                { from: 'Gross profit', to: 'Income before taxes', size: 949 },
                { from: 'Other income', to: 'Income before taxes', size: 48 },
                { from: 'Selling and administrative expense', to: 'Demand creation expense', size: 910 },
                { from: 'Selling and administrative expense', to: 'Operating overhead expense', size: 2232 },
                { from: 'Income before taxes', to: 'Tax expense', size: 150 },
                { from: 'Income before taxes', to: 'Net income', size: 847 },
            ],
        };

        const layoutOptions = {
            left: { node: { alignment: 'left' as const } },
            right: { node: { alignment: 'right' as const } },
            center: { node: { alignment: 'center' as const } },
            justify: { node: { alignment: 'justify' as const } },
        };

        describe.each(Object.entries(layoutScenarios))('%s', (_scenario, data) => {
            it.each(Object.entries(layoutOptions))('%s', async (_layout, defaultOptions) => {
                const options: AgStandaloneChartOptions = {
                    data,
                    series: [
                        {
                            ...defaultOptions,
                            type: 'sankey',
                            fromKey: 'from',
                            toKey: 'to',
                            sizeKey: 'size',
                            label: { enabled: false },
                            link: { strokeWidth: 1 },
                        },
                    ],
                };

                prepareEnterpriseTestOptions(options);

                chart = deproxy(AgCharts.create(options));
                await compare();
            });
        });
    });

    describe('label placement', () => {
        const placementOptions = {
            default: { label: { placement: undefined, edgePlacement: undefined } },
            left: { label: { placement: 'left' as const, edgePlacement: undefined } },
            right: { label: { placement: 'right' as const, edgePlacement: undefined } },
            center: { label: { placement: 'center' as const, edgePlacement: undefined } },
            inside: { label: { placement: 'right' as const, edgePlacement: 'inside' as const } },
            outside: { label: { placement: 'right' as const, edgePlacement: 'outside' as const } },
        };

        it.each(Object.entries(placementOptions))('%s', async (_placement, defaultOptions) => {
            const options: AgStandaloneChartOptions = {
                data: [
                    { from: 'one', to: 'two', size: 10 },
                    { from: 'two', to: 'three', size: 10 },
                ],
                series: [
                    {
                        ...defaultOptions,
                        type: 'sankey',
                        fromKey: 'from',
                        toKey: 'to',
                        sizeKey: 'size',
                        link: { strokeWidth: 1 },
                    },
                ],
            };

            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });
    });

    describe('Series Highlighting', () => {
        const SIMPLIFIED_EXAMPLE = {
            ...GALLERY_EXAMPLES.SIMPLE_SANKEY_EXAMPLE.options,
        };

        it('should render a complex chart', async () => {
            const options: AgChartOptions = { ...SIMPLIFIED_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });

        it('should render highlight of node', async () => {
            const options: AgChartOptions = { ...SIMPLIFIED_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const node = chart.series[0].contextNodeData.nodeData.find(
                (n: any) => n.type === FlowProportionDatumType.Node
            );

            const highlightManager = (chart as Chart).ctx.highlightManager;
            highlightManager.updateHighlight(chart.id, node);
            await compare();
        });

        it('should render highlight of link', async () => {
            const options: AgChartOptions = { ...SIMPLIFIED_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const node = chart.series[0].contextNodeData.nodeData.find(
                (n: any) => n.type === FlowProportionDatumType.Link
            );

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
                            enabled: true,
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
            await waitForChartStability(chart);
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

    describe(`Sankey Series Pointer Events`, () => {
        const datasets = {
            data: [
                {
                    from: 'a',
                    to: 'b',
                },
            ],
            fromKey: 'from',
            toKey: 'to',
        };

        const cartesianTestParams = {
            getNodeData: (series) => series.contextNodeData?.nodeData ?? [],
            getTooltipRenderedValues: (params) => [params.xValue, params.yValue],
            // Returns a highlighted marker
            getHighlightNode: (_, series) => series.highlightGroup.children().next().value,
        } as Parameters<typeof testPointerEvents>[0];

        testPointerEvents({
            ...cartesianTestParams,
            seriesOptions: {
                type: 'sankey',
                fromKey: datasets.fromKey,
                toKey: datasets.toKey,
            },
            chartOptions: {
                data: datasets.data,
            },
            getNodeData: (series) => series.contextNodeData?.nodeData ?? [],
            getNodePoint: (item) => [item.midPoint.x, item.midPoint.y],
            getDatumValues: (item) => {
                return item.type === FlowProportionDatumType.Link
                    ? [item.fromNode.id, item.toNode.id, item.size]
                    : ['(node)'];
            },
            getTooltipRenderedValues: (params) => {
                const { datum } = params;
                return datum == null ? ['(node)'] : [datum[params.fromKey], datum[params.toKey], 1];
            },
            getHighlightNode: (chartInstance, series) => {
                const highlightedDatum = chartInstance.ctx.highlightManager.getActiveHighlight();
                return [...series.highlightLinkGroup.children(), ...series.highlightNodeGroup.children()].find(
                    (child: any) => child.datum.id === highlightedDatum.id
                );
            },
        });
    });

    describe('gradient fill', () => {
        it('should render sankey series with a default gradient fill', async () => {
            const options = {
                ...GALLERY_EXAMPLES.SIMPLE_SANKEY_EXAMPLE.options,
                series: [
                    {
                        type: 'sankey',
                        fromKey: 'from',
                        toKey: 'to',
                        sizeKey: 'sales',
                        sizeName: 'Sales',
                        node: {
                            alignment: 'center',
                        },
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

        it('should render sankey series with a default node gradient fill', async () => {
            const options = {
                ...GALLERY_EXAMPLES.SIMPLE_SANKEY_EXAMPLE.options,
                series: [
                    {
                        type: 'sankey',
                        fromKey: 'from',
                        toKey: 'to',
                        sizeKey: 'sales',
                        sizeName: 'Sales',
                        node: {
                            alignment: 'center',
                            fill: {
                                type: 'gradient',
                            },
                        },
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

        it('should render sankey series with a gradient fill', async () => {
            const options = {
                ...GALLERY_EXAMPLES.SIMPLE_SANKEY_EXAMPLE.options,
                series: [
                    {
                        type: 'sankey',
                        fromKey: 'from',
                        toKey: 'to',
                        sizeKey: 'sales',
                        sizeName: 'Sales',
                        node: {
                            alignment: 'center',
                        },
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

        it('should render sankey series with a series bound gradient fill', async () => {
            const options = {
                ...GALLERY_EXAMPLES.SIMPLE_SANKEY_EXAMPLE.options,
                series: [
                    {
                        type: 'sankey',
                        fromKey: 'from',
                        toKey: 'to',
                        sizeKey: 'sales',
                        sizeName: 'Sales',
                        node: {
                            alignment: 'center',
                        },
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

        it('should render sankey series with a mix of gradient and string fills', async () => {
            const options = {
                ...GALLERY_EXAMPLES.SIMPLE_SANKEY_EXAMPLE.options,
                series: [
                    {
                        type: 'sankey',
                        fromKey: 'from',
                        toKey: 'to',
                        sizeKey: 'sales',
                        sizeName: 'Sales',
                        node: {
                            alignment: 'center',
                        },
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

    it('AG-15669 - should correctly invoke itemStyler and apply result to node', async () => {
        const options = {
            title: {
                text: 'itemStyler test',
            },
            subtitle: {
                text: 'If you can see gray, something went wrong!',
            },
            data: [
                { from: 'Nuclear (red)', to: 'Renewables (green)', size: 38 },
                { from: 'Renewables (green)', to: 'Total (green)', size: 147 },
            ],
            series: [
                {
                    type: 'sankey',
                    fromKey: 'from',
                    toKey: 'to',
                    sizeKey: 'size',
                    sizeName: 'Total (GWh)',
                    node: {
                        fill: 'gray',
                        itemStyler: (p: AgSankeySeriesNodeItemStylerParams<unknown, unknown>) => {
                            const { label } = p;
                            if (label === 'Nuclear (red)') {
                                return { fill: 'red' };
                            }

                            return { fill: 'green' };
                        },
                    },
                    link: {
                        fill: 'gray',
                        itemStyler: (p: AgSankeySeriesLinkItemStylerParams<{ from: string }, unknown>) => {
                            const { from } = p.datum;
                            if (from === 'Nuclear (red)') {
                                return { fill: 'red' };
                            }

                            return { fill: 'green' };
                        },
                    },
                },
            ],
        };
        prepareEnterpriseTestOptions(options as AgChartOptions);

        chart = deproxy(AgCharts.create(options as AgChartOptions));
        await compare();
    });
});
