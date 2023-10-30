import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type {
    AgCartesianChartOptions,
    AgChartOptions,
    AgPolarChartOptions,
    InteractionRange,
} from 'ag-charts-community';
import {
    GALLERY_EXAMPLES,
    IMAGE_SNAPSHOT_DEFAULTS,
    TREEMAP_SERIES_LABELS,
    clickAction,
    deproxy,
    extractImageData,
    hierarchyChartAssertions,
    hoverAction,
    setupMockCanvas,
    waitForChartStability,
} from 'ag-charts-community-test';

import { AgEnterpriseCharts } from '../../main';
import { prepareEnterpriseTestOptions } from '../../test/utils';
import type { TreemapSeries } from './treemapSeries';

describe('HierarchyChart', () => {
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
        beforeEach(() => {
            console.warn = jest.fn();
        });

        afterEach(() => {
            expect(console.warn).not.toBeCalled();
        });

        const SIMPLIFIED_EXAMPLE = {
            ...GALLERY_EXAMPLES.MARKET_INDEX_TREEMAP_GRAPH_EXAMPLE.options,
            data: [
                {
                    ...GALLERY_EXAMPLES.MARKET_INDEX_TREEMAP_GRAPH_EXAMPLE.options.data[0],
                    children: GALLERY_EXAMPLES.MARKET_INDEX_TREEMAP_GRAPH_EXAMPLE.options.data[0].children.slice(0, 1),
                },
            ],
        };

        it('should render a complex chart', async () => {
            const options: AgChartOptions = { ...SIMPLIFIED_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgEnterpriseCharts.create(options));
            await compare();
        });

        const childAtDepth = [0, 0, 0, 0];
        it.each([0, 1, 2, 3])(`should render highlight at depth %s`, async (depth) => {
            const options: AgChartOptions = { ...SIMPLIFIED_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgEnterpriseCharts.create(options));
            await waitForChartStability(chart);

            const seriesImpl = chart.series[0] as TreemapSeries;
            let node = seriesImpl['dataRoot'];
            const childIndexes = [...childAtDepth];
            while (depth > 0 && node) {
                node = node.children![childIndexes.shift() ?? 0];
                depth--;
            }

            const highlightManager = (chart as any).highlightManager;
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
                const options: AgChartOptions = { ...example.options };
                prepareEnterpriseTestOptions(options);

                chart = AgEnterpriseCharts.create(options);
                await waitForChartStability(chart);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                const options: AgChartOptions = { ...example.options };
                prepareEnterpriseTestOptions(options);

                chart = AgEnterpriseCharts.create(options);
                await compare();
            });
        }
    });

    const testPointerEvents = (testParams: {
        seriesOptions: any;
        chartOptions?: any;
        getNodeData: (series: any) => any[];
        getNodePoint: (nodeItem: any) => [number, number];
        getDatumValues: (datum: any, series: any) => any[];
        getTooltipRenderedValues: (tooltipRendererParams: any) => any[];
        getHighlightNode: (series: any) => any;
    }) => {
        const format = (...values: any[]) => values.join(': ');

        const createChart = async (params: {
            hasTooltip: boolean;
            onNodeClick?: () => void;
            nodeClickRange?: InteractionRange;
        }): Promise<any> => {
            const tooltip = params.hasTooltip
                ? {
                      renderer(params: any) {
                          const values = testParams.getTooltipRenderedValues(params);
                          return format(...values);
                      },
                  }
                : { enabled: false };

            const listeners = params.onNodeClick ? { nodeClick: params.onNodeClick } : undefined;
            const nodeClickRangeParams = params.nodeClickRange ? { nodeClickRange: params.nodeClickRange } : {};
            const options: AgCartesianChartOptions | AgPolarChartOptions = {
                container: document.body,
                autoSize: false,
                series: [
                    {
                        tooltip,
                        highlightStyle: { item: { fill: 'lime' } },
                        listeners,
                        ...nodeClickRangeParams,
                        ...testParams.seriesOptions,
                    },
                ],
                ...(testParams.chartOptions ?? {}),
            };
            prepareEnterpriseTestOptions(options);
            const chart = deproxy(AgEnterpriseCharts.create(options));
            await waitForChartStability(chart);
            return chart;
        };

        const hoverChartNodes = async (
            chart: any,
            iterator: (params: { series: any; item: any; x: number; y: number }) => Promise<void>
        ) => {
            for (const series of chart.series) {
                const nodeData = testParams.getNodeData(series);
                expect(nodeData.length).toBeGreaterThan(0);
                for (const item of nodeData) {
                    const itemPoint = testParams.getNodePoint(item);
                    const { x, y } = series.contentGroup.inverseTransformPoint(itemPoint[0], itemPoint[1]);
                    await hoverAction(x, y)(chart);
                    await waitForChartStability(chart);
                    await iterator({ series, item, x, y });
                }
            }
        };

        const checkHighlight = async (chart: any) => {
            await hoverChartNodes(chart, async ({ series }) => {
                // Check the highlighted marker
                const highlightNode = testParams.getHighlightNode(series);
                expect(highlightNode).toBeDefined();
                expect(highlightNode.fill).toEqual('lime');
            });
        };

        const checkNodeClick = async (chart: any, onNodeClick: () => void, offset?: { x: number; y: number }) => {
            await hoverChartNodes(chart, async ({ x, y }) => {
                // Perform click
                await clickAction(x + (offset?.x ?? 0), y + (offset?.y ?? 0))(chart);
                await waitForChartStability(chart);
            });

            // Check click handler
            const nodeCount = chart.series.reduce((sum, series) => sum + testParams.getNodeData(series).length, 0);
            expect(onNodeClick).toBeCalledTimes(nodeCount);
        };

        it(`should render tooltip correctly`, async () => {
            chart = await createChart({ hasTooltip: true });
            await hoverChartNodes(chart, async ({ series, item, x, y }) => {
                // Check the tooltip is shown
                const tooltip = document.querySelector('.ag-chart-tooltip');
                expect(tooltip).toBeInstanceOf(HTMLElement);
                expect(tooltip?.classList.contains('ag-chart-tooltip-hidden')).toBe(false);

                // Check the tooltip position
                const transformMatch = (tooltip as HTMLElement).style.transform.match(/translate\((.*?)px, (.*?)px\)/);
                if (transformMatch == null) fail('transformMatch not found');

                const [, translateX, translateY] = Array.from(transformMatch).map((s) => parseFloat(s));
                expect(translateX).toEqual(Math.round(x));
                expect(translateY).toEqual(Math.round(y - 8));

                // Check the tooltip text
                const values = testParams.getDatumValues(item, series);
                expect(tooltip?.textContent).toEqual(format(...values));
            });

            // Check the tooltip is hidden
            await hoverAction(0, 0)(chart);
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
                data: [
                    {
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
                ],
                valueKey: 'count',
                labelKey: 'name',
            },
        };

        const cartesianTestParams = {
            getNodeData: (series) => series.contextNodeData[0].nodeData,
            getTooltipRenderedValues: (params) => [params.xValue, params.yValue],
            // Returns a highlighted marker
            getHighlightNode: (series) => series.highlightNode.children[0],
        } as Parameters<typeof testPointerEvents>[0];

        testPointerEvents({
            ...cartesianTestParams,
            seriesOptions: {
                type: 'treemap',
                labelKey: datasets.food.labelKey,
                sizeKey: datasets.food.valueKey,
                colorKey: undefined,
                gradient: false,
            },
            chartOptions: {
                data: datasets.food.data,
            },
            getNodeData: (series) => {
                const nodes = series.contentGroup.children.map((group) => group.children[0]);
                const maxDepth = Math.max(...nodes.map((n) => n.datum.depth));
                return nodes.filter((node) => node.datum.depth === maxDepth);
            },
            getNodePoint: (item) => [item.x + item.width / 2, item.y + item.height / 2],
            getDatumValues: (item, series) => {
                const { datum } = item.datum;
                return [datum[series.labelKey], datum[series.sizeKey]];
            },
            getTooltipRenderedValues: (params) => {
                const { datum } = params;
                return [datum[params.labelKey], datum[params.sizeKey]];
            },
            getHighlightNode: (series) => {
                const highlightedDatum = series.chart.highlightManager.getActiveHighlight();
                return series.highlightGroup.children.find((child: any) => child?.datum === highlightedDatum)
                    .children[0];
            },
        });
    });
});
