import { afterEach, describe, expect, it, jest } from '@jest/globals';

import type {
    AgCartesianChartOptions,
    AgChartOptions,
    AgPolarChartOptions,
    InteractionRange,
} from 'ag-charts-community';
import { AgCharts, _Scene } from 'ag-charts-community';
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
            highlightManager.updateHighlight(chart.id, node as any);
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
            highlightManager.updateHighlight(chart.id, node as any);
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
        const format = (...values: any[]) => values.join(': ');

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

            const listeners = params.onNodeClick ? { nodeClick: params.onNodeClick } : undefined;
            const nodeClickRangeParams = params.nodeClickRange ? { nodeClickRange: params.nodeClickRange } : {};
            const options: AgCartesianChartOptions | AgPolarChartOptions = {
                container: document.body,
                series: [
                    {
                        tooltip,
                        highlightStyle: {
                            item: {
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
            iterator: (params: { series: any; item: any; x: number; y: number }) => Promise<void>
        ) => {
            for (const series of chartInstance.series) {
                const nodeData = testParams.getNodeData(series);
                expect(nodeData.length).toBeGreaterThan(0);
                for (const item of nodeData) {
                    const itemPoint = testParams.getNodePoint(item);
                    const { x, y } = series.contentGroup.inverseTransformPoint(itemPoint[0], itemPoint[1]);
                    await hoverAction(x, y)(chartInstance);
                    await waitForChartStability(chartInstance);
                    await iterator({ series, item, x, y });
                }
            }
        };

        const checkHighlight = async (chartInstance: any) => {
            await hoverChartNodes(chartInstance, async ({ series }) => {
                // Check the highlighted marker
                const highlightNode = testParams.getHighlightNode(chartInstance, series);
                expect(highlightNode).toBeDefined();
                expect(highlightNode.fill).toEqual('lime');
            });
        };

        const checkNodeClick = async (
            chartInstance: any,
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
            await hoverChartNodes(chart, async ({ series, item }) => {
                // Check the tooltip is shown
                const tooltip = document.querySelector('.ag-chart-tooltip');
                expect(tooltip).toBeInstanceOf(HTMLElement);
                expect(tooltip?.classList.contains('ag-chart-tooltip-hidden')).toBe(false);

                // Check the tooltip text
                const values = testParams.getDatumValues(item, series);
                expect(tooltip?.textContent).toEqual(format(...values));
            });

            // Check the tooltip is hidden (hover over top-left corner)
            await hoverAction(8, 8)(chart);
            await waitForChartStability(chart);
            const tooltip = document.querySelector('.ag-chart-tooltip');
            expect(tooltip?.classList.contains('ag-chart-tooltip-hidden')).toBe(true);
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

        it.skip(`should handle nodeClick event with offset click when range is 'nearest'`, async () => {
            const onNodeClick = jest.fn();
            chart = await createChart({ hasTooltip: true, onNodeClick, nodeClickRange: 'nearest' });
            await checkNodeClick(chart, onNodeClick, { x: 5, y: 5 });
        });

        it.skip(`should handle nodeClick event with offset click when range is within pixel distance`, async () => {
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
            getHighlightNode: (_, series) => series.highlightNode.children[0],
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
            getDatumValues: (item, series) => {
                const { datum } = item;
                return datum != null
                    ? [datum[series.properties.fromKey], datum[series.properties.toKey]]
                    : [item.label];
            },
            getTooltipRenderedValues: (params) => {
                const { datum } = params;
                return datum != null ? [datum[params.fromKey], datum[params.toKey]] : [params.title];
            },
            getHighlightNode: (chartInstance, series) => {
                const highlightedDatum = chartInstance.ctx.highlightManager.getActiveHighlight();
                return [...series.highlightLinkGroup.children, ...series.highlightNodeGroup.children].find(
                    (child: any) => child.datum.id === highlightedDatum.id
                );
            },
        });
    });
});
