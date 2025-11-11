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

describe('ChordSeries', () => {
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

    describe('Series', () => {
        it('should render tension', async () => {
            const options: AgChartOptions = {
                ...GALLERY_EXAMPLES.SIMPLE_CHORD_EXAMPLE.options,
                series: [
                    {
                        ...(GALLERY_EXAMPLES.SIMPLE_CHORD_EXAMPLE.options.series![0] as any),
                        type: 'chord',
                        link: {
                            tension: 0.5,
                        },
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
            ...GALLERY_EXAMPLES.SIMPLE_CHORD_EXAMPLE.options,
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
            await checkNodeClick(chart, onNodeClick, { x: 2, y: 2 });
        });

        it(`should handle nodeClick event with offset click when range is within pixel distance`, async () => {
            const onNodeClick = jest.fn();
            chart = await createChart({ hasTooltip: true, onNodeClick, nodeClickRange: 6 });
            await checkNodeClick(chart, onNodeClick, { x: 0, y: 5 });
        });
    };

    describe(`Chord Series Pointer Events`, () => {
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
            getHighlightNode: (_, series) => series.highlightNodeGroup.children().next().value,
        } as Parameters<typeof testPointerEvents>[0];

        testPointerEvents({
            ...cartesianTestParams,
            seriesOptions: {
                type: 'chord',
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
        it('should render chord series with a default gradient fill', async () => {
            const options = {
                ...GALLERY_EXAMPLES.SIMPLE_CHORD_EXAMPLE.options,
                series: [
                    {
                        type: 'chord',
                        fromKey: 'from',
                        toKey: 'to',
                        sizeKey: 'sales',
                        sizeName: 'Sales',
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

        it('should render chord series with a mix of gradient and string fills', async () => {
            const options = {
                ...GALLERY_EXAMPLES.SIMPLE_CHORD_EXAMPLE.options,
                series: [
                    {
                        type: 'chord',
                        fromKey: 'from',
                        toKey: 'to',
                        sizeKey: 'sales',
                        sizeName: 'Sales',
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

        it('should render chord series with a gradient fill', async () => {
            const options = {
                ...GALLERY_EXAMPLES.SIMPLE_CHORD_EXAMPLE.options,
                series: [
                    {
                        type: 'chord',
                        fromKey: 'from',
                        toKey: 'to',
                        sizeKey: 'sales',
                        sizeName: 'Sales',
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

        it('should render chord series with a series  bound link gradient fill', async () => {
            const options = {
                ...GALLERY_EXAMPLES.SIMPLE_CHORD_EXAMPLE.options,
                series: [
                    {
                        type: 'chord',
                        fromKey: 'from',
                        toKey: 'to',
                        sizeKey: 'sales',
                        sizeName: 'Sales',
                        link: {
                            fill: {
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
                        },
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
            data: [
                { from: 'Asia', to: 'Europe', size: 20 },
                { from: 'Asia', to: 'Americas', size: 19 },
                { from: 'Asia', to: 'Africa', size: 4 },
                { from: 'Asia', to: 'Oceania', size: 8 },
                { from: 'Europe', to: 'Asia', size: 5 },
                { from: 'Europe', to: 'Americas', size: 5 },
                { from: 'Europe', to: 'Africa', size: 3 },
                { from: 'Europe', to: 'Oceania', size: 2 },
                { from: 'Americas', to: 'Asia', size: 4 },
                { from: 'Americas', to: 'Europe', size: 5 },
                { from: 'Americas', to: 'Africa', size: 11 },
                { from: 'Americas', to: 'Oceania', size: 6 },
                { from: 'Africa', to: 'Asia', size: 3 },
                { from: 'Africa', to: 'Europe', size: 9 },
                { from: 'Africa', to: 'Americas', size: 3 },
                { from: 'Oceania', to: 'Asia', size: 1 },
                { from: 'Oceania', to: 'Europe', size: 1 },
                { from: 'Oceania', to: 'Americas', size: 1 },
            ],
            series: [
                {
                    type: 'chord',
                    fromKey: 'from',
                    toKey: 'to',
                    sizeKey: 'size',
                    label: {
                        color: 'green',
                        fill: 'pink',
                        padding: 20,
                        cornerRadius: 15,
                        border: { stroke: 'red', strokeWidth: 3 },
                    },
                },
            ],
        });

        chart = deproxy(AgCharts.create(options));
        await compare();
    });
});
