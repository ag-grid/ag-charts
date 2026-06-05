import { afterEach, describe, expect, it, vi } from 'vitest';

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
    assertTooltipPresentForAll,
    clickAction,
    deproxy,
    extractImageData,
    hierarchyChartAssertions,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { deepClone } from 'ag-charts-core';

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
            highlightManager.updateHighlight(chart.id, node);
            await compare();
        });
    });

    describe('AG-17377 highlight.enabled', () => {
        const DATA = [
            {
                name: 'Group A',
                children: [
                    { name: 'Tile A1', size: 6 },
                    { name: 'Tile A2', size: 4 },
                ],
            },
            {
                name: 'Group B',
                children: [{ name: 'Tile B1', size: 5 }],
            },
        ];

        const buildOptions = (tileHighlight: any, groupHighlight: any): AgChartOptions => ({
            data: DATA,
            series: [
                {
                    type: 'treemap',
                    labelKey: 'name',
                    sizeKey: 'size',
                    colorKey: undefined,
                    tile: { highlight: { highlightedItem: { fill: 'lime' }, ...tileHighlight } },
                    group: { highlight: { highlightedItem: { fill: 'cyan' }, ...groupHighlight } },
                },
            ],
            animation: { enabled: false },
        });

        const createChart = async (tileHighlight: any, groupHighlight: any) => {
            const options = buildOptions(tileHighlight, groupHighlight);
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            return chart;
        };

        const nodeAtPath = (series: TreemapSeries, path: number[]): any =>
            path.reduce<any>((node, idx) => node?.children[idx], (series as any).rootNode);

        // The highlight selection contains only the active highlight node; its rect fill
        // reflects whatever getItemStyle resolved. 'lime'/'cyan' means the highlight style
        // applied; any other fill means highlighting was suppressed.
        const highlightFill = (series: any): string | undefined => {
            const rect = Array.from(series.highlightSelection.nodes())[0] as any;
            return rect?.fill;
        };

        const highlightNodeAndReadFill = async (series: TreemapSeries, path: number[]): Promise<string | undefined> => {
            const node = nodeAtPath(series, path);
            (chart as Chart).ctx.highlightManager.updateHighlight(chart.id, node);
            await waitForChartStability(chart);
            return highlightFill(series);
        };

        it('highlights a tile on hover by default (control)', async () => {
            await createChart({}, {});
            const series = chart.series[0] as TreemapSeries;
            expect(await highlightNodeAndReadFill(series, [0, 0])).toEqual('lime');
        });

        it('suppresses tile highlighting when tile.highlight.enabled is false', async () => {
            await createChart({ enabled: false }, {});
            const series = chart.series[0] as TreemapSeries;
            expect(await highlightNodeAndReadFill(series, [0, 0])).not.toEqual('lime');
        });

        it('suppresses group highlighting when group.highlight.enabled is false', async () => {
            await createChart({}, { enabled: false });
            const series = chart.series[0] as TreemapSeries;
            expect(await highlightNodeAndReadFill(series, [0])).not.toEqual('cyan');
        });

        it('highlights only groups when tile.highlight.enabled is false and group.highlight.enabled is true', async () => {
            await createChart({ enabled: false }, { enabled: true });
            const series = chart.series[0] as TreemapSeries;
            expect(await highlightNodeAndReadFill(series, [0])).toEqual('cyan');
        });

        it('suppresses all highlighting when both tile and group highlight.enabled are false', async () => {
            await createChart({ enabled: false }, { enabled: false });
            const series = chart.series[0] as TreemapSeries;
            expect(await highlightNodeAndReadFill(series, [0, 0])).not.toEqual('lime');
            expect(await highlightNodeAndReadFill(series, [0])).not.toEqual('cyan');
        });

        const tileEnabled = (series: TreemapSeries) =>
            (series as unknown as { properties: { tile: { highlight: { enabled: boolean } } } }).properties.tile
                .highlight.enabled;
        const groupEnabled = (series: TreemapSeries) =>
            (series as unknown as { properties: { group: { highlight: { enabled: boolean } } } }).properties.group
                .highlight.enabled;

        it('cascades chart-level highlight.enabled = false to tile and group', async () => {
            const options: AgChartOptions = {
                data: DATA,
                highlight: { enabled: false },
                series: [{ type: 'treemap', labelKey: 'name', sizeKey: 'size', colorKey: undefined }],
                animation: { enabled: false },
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            const series = chart.series[0] as TreemapSeries;
            expect(tileEnabled(series)).toBe(false);
            expect(groupEnabled(series)).toBe(false);
        });

        it('lets a series re-enable tile/group highlighting over a disabled chart-level default', async () => {
            const options: AgChartOptions = {
                data: DATA,
                highlight: { enabled: false },
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'size',
                        colorKey: undefined,
                        tile: { highlight: { enabled: true } },
                        group: { highlight: { enabled: true } },
                    },
                ],
                animation: { enabled: false },
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            const series = chart.series[0] as TreemapSeries;
            expect(tileEnabled(series)).toBe(true);
            expect(groupEnabled(series)).toBe(true);
        });

        it('still shows tooltips when highlighting is disabled', async () => {
            const options: AgChartOptions = {
                data: DATA,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'size',
                        colorKey: undefined,
                        tile: { highlight: { enabled: false } },
                        group: { highlight: { enabled: false } },
                        tooltip: { renderer: ({ datum }: any) => datum.name },
                    },
                ],
                tooltip: { range: 'exact' },
                animation: { enabled: false },
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const series = chart.series[0] as TreemapSeries;
            const tileNode = nodeAtPath(series, [0, 0]);
            const { x, y } = _ModuleSupport.Transformable.toCanvasPoint(
                (series as any).contentGroup,
                tileNode.bbox.x + tileNode.bbox.width / 2,
                tileNode.bbox.y + tileNode.bbox.height / 2
            );
            await hoverAction(x, y)(chart);
            await waitForChartStability(chart);

            const tooltip = document.querySelector('.ag-charts-tooltip');
            expect(tooltip).toBeInstanceOf(HTMLElement);
            expect(tooltip?.textContent).toEqual('Tile A1');
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

        it(`for TREEMAP_SERIES_LABELS it should render to canvas with group labels disabled`, async () => {
            const options = deepClone(TREEMAP_SERIES_LABELS);
            (options as any).series[0].group.label = { enabled: false };
            prepareEnterpriseTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });
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
            const onNodeClick = vi.fn();
            chart = await createChart({ hasTooltip: true, onNodeClick });
            await checkNodeClick(chart, onNodeClick);
        });

        it(`should highlight hovered items when tooltip is disabled`, async () => {
            chart = await createChart({ hasTooltip: false });
            await checkHighlight(chart);
        });

        it(`should handle nodeClick event when tooltip is disabled`, async () => {
            const onNodeClick = vi.fn();
            chart = await createChart({ hasTooltip: false, onNodeClick });
            await checkNodeClick(chart, onNodeClick);
        });

        it(`should handle nodeClick event with offset click when range is 'nearest'`, async () => {
            const onNodeClick = vi.fn();
            chart = await createChart({ hasTooltip: true, onNodeClick, nodeClickRange: 'nearest' });
            await checkNodeClick(chart, onNodeClick, { x: 5, y: 5 });
        });

        it(`should handle nodeClick event with offset click when range is within pixel distance`, async () => {
            const onNodeClick = vi.fn();
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

    describe('colorScale', () => {
        const TREEMAP_BASE = {
            ...GALLERY_EXAMPLES.TREEMAP_WITH_COLOR_RANGE_EXAMPLE.options,
            animation: { enabled: false },
        };

        it('should render with continuous colorScale', async () => {
            const options: AgChartOptions = {
                ...TREEMAP_BASE,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'valuation',
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
                ...TREEMAP_BASE,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'valuation',
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
                ...TREEMAP_BASE,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'valuation',
                        colorKey: 'change',
                        colorScale: {
                            fills: [{ color: 'green' }, { color: 'white' }, { color: 'purple' }],
                            domain: [-10, 10] as [number, number],
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });

        it('should fill missing colorValue with colorScale.missingDataFill', async () => {
            const data = [
                { name: 'A', valuation: 100, change: 3 },
                { name: 'B', valuation: 80, change: null },
                { name: 'C', valuation: 60 },
                { name: 'D', valuation: 40, change: -4 },
            ];
            const options: AgChartOptions = {
                ...TREEMAP_BASE,
                data,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'valuation',
                        colorKey: 'change',
                        colorScale: {
                            fills: [{ color: 'red' }, { color: 'yellow' }, { color: 'green' }],
                            missingDataFill: '#cccccc',
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();

            const seriesImpl = chart.series[0] as TreemapSeries;
            assertTooltipPresentForAll(
                seriesImpl,
                data,
                (d) => d.change == null,
                (i) => i
            );
        });

        it('should render with discrete named stops colorScale', async () => {
            const options: AgChartOptions = {
                ...TREEMAP_BASE,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'valuation',
                        colorKey: 'change',
                        colorScale: {
                            fills: [
                                { color: 'red', stop: -2, name: 'Loss' },
                                { color: 'yellow', stop: 2, name: 'Flat' },
                                { color: 'green', name: 'Gain' },
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

    describe('legend', () => {
        const TREEMAP_LEGEND_BASE = {
            ...GALLERY_EXAMPLES.TREEMAP_WITH_COLOR_RANGE_EXAMPLE.options,
            animation: { enabled: false },
        };

        it('should render gradient legend with continuous colorScale', async () => {
            const options: AgChartOptions = {
                ...TREEMAP_LEGEND_BASE,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'valuation',
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

        it('should render category legend with discrete colorScale', async () => {
            const options: AgChartOptions = {
                ...TREEMAP_LEGEND_BASE,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'valuation',
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

        it('should render category legend with named discrete stops', async () => {
            const options: AgChartOptions = {
                ...TREEMAP_LEGEND_BASE,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'valuation',
                        colorKey: 'change',
                        colorScale: {
                            fills: [
                                { color: 'red', stop: -2, name: 'Loss' },
                                { color: 'yellow', stop: 2, name: 'Flat' },
                                { color: 'green', name: 'Gain' },
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

        it('should render gradient legend with continuous named stops', async () => {
            const options: AgChartOptions = {
                ...TREEMAP_LEGEND_BASE,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'valuation',
                        colorKey: 'change',
                        colorScale: {
                            fills: [
                                { color: 'red', stop: -2, name: 'Loss' },
                                { color: 'yellow', stop: 2, name: 'Flat' },
                                { color: 'green', name: 'Gain' },
                            ],
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
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

    describe('AG-17130 tooltip after options-replacement update', () => {
        const fullData = [
            { value: 14.35, displayName: 'Jan.10' },
            { value: 14.36, displayName: 'Feb.10' },
            { value: 14.37, displayName: 'Mar.10' },
            { value: 14.34, displayName: 'Apr.10' },
            { value: 9_294_717_981.55, displayName: 'Jan.14' },
            { value: 145_293_355.65, displayName: 'Mar.14' },
        ];
        const filteredData = fullData.filter((d) => d.displayName.includes('.10'));

        const buildOptions = (data: typeof fullData): AgChartOptions => ({
            data,
            series: [{ type: 'treemap', labelKey: 'displayName', sizeKey: 'value', childrenKey: 'children' }],
            animation: { enabled: false },
        });

        it('shows the new top-left tile on hover after replacing options', async () => {
            const proxy = AgCharts.create(prepareEnterpriseTestOptions(buildOptions(filteredData)));
            chart = deproxy(proxy);
            await waitForChartStability(chart);

            await proxy.update(prepareEnterpriseTestOptions(buildOptions(fullData)));
            await waitForChartStability(chart);

            // Jan.14 dwarfs every other datum, so the new layout places it top-left.
            // Hovering near the top-left also overlaps where Mar.10's tile was positioned
            // before the update, which is the scenario covered by the regression.
            const { x, y } = chart.seriesRect!;
            await hoverAction(x + 30, y + 30)(chart);
            await waitForChartStability(chart);

            const tooltip = document.querySelector('.ag-charts-tooltip');
            expect(tooltip?.textContent).toContain('Jan.14');
            expect(tooltip?.textContent).not.toContain('Mar.10');
        });
    });
});
