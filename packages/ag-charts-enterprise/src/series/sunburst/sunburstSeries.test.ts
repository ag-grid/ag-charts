import type { MatchImageSnapshotOptions } from 'jest-image-snapshot';
import { type Image as SkiaImage, loadImage as skiaLoadImage } from 'skia-canvas';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import type {
    AgCartesianChartOptions,
    AgChartOptions,
    AgPolarChartOptions,
    InteractionRange,
} from 'ag-charts-community';
import { AgCharts, _ModuleSupport } from 'ag-charts-community';
import {
    BIG,
    type Chart,
    GALLERY_EXAMPLES,
    IMAGE_SNAPSHOT_DEFAULTS,
    MIN_TOOLTIP_HIDE_DELAY,
    SUNBURST_SERIES_LABELS,
    type SceneFrameInvariant,
    type SceneGeometrySample,
    assertTooltipPresentForAll,
    clickAction,
    compareImageSnapshot,
    createSceneGeometrySampler,
    deproxy,
    expectAnimatedEndpointsMatchStatic,
    expectMonotonic,
    expectNoAnimation,
    expectProgresses,
    expectSceneSamplesMatch,
    expectSceneTrajectory,
    expectWarningsCalls,
    hierarchyChartAssertions,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
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
        await compareImageSnapshot(chart, ctx, opts);
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
            highlightManager.updateHighlight(chart.id, node);
            await compare();
        });
    });

    describe('AG-17377 highlight.enabled', () => {
        const DATA = [
            {
                name: 'Group A',
                children: [
                    { name: 'Leaf A1', size: 6 },
                    { name: 'Leaf A2', size: 4 },
                ],
            },
            { name: 'Group B', children: [{ name: 'Leaf B1', size: 5 }] },
        ];

        const createChart = async (highlight: any) => {
            const options: AgChartOptions = {
                data: DATA,
                series: [
                    {
                        type: 'sunburst',
                        labelKey: 'name',
                        sizeKey: 'size',
                        colorKey: undefined,
                        highlight: { highlightedItem: { fill: 'lime' }, ...highlight },
                    },
                ],
                animation: { enabled: false },
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            return chart;
        };

        const highlightLeafFill = async (series: SunburstSeries): Promise<string | undefined> => {
            const leaf = (series as any).rootNode.children[0].children[0];
            (chart as Chart).ctx.highlightManager.updateHighlight(chart.id, leaf);
            await waitForChartStability(chart);
            const node = Array.from((series as any).highlightSelection.nodes())[0] as any;
            return node?.fill;
        };

        it('highlights a node on hover by default (control)', async () => {
            await createChart({});
            const series = chart.series[0] as SunburstSeries;
            expect(await highlightLeafFill(series)).toEqual('lime');
        });

        it('suppresses all highlighting when highlight.enabled is false', async () => {
            await createChart({ enabled: false });
            const series = chart.series[0] as SunburstSeries;
            expect(await highlightLeafFill(series)).not.toEqual('lime');
        });

        const seriesHighlightEnabled = (series: SunburstSeries) =>
            (series as unknown as { properties: { highlight: { enabled: boolean } } }).properties.highlight.enabled;

        it('cascades chart-level highlight.enabled = false to the series', async () => {
            const options: AgChartOptions = {
                data: DATA,
                highlight: { enabled: false },
                series: [{ type: 'sunburst', labelKey: 'name', sizeKey: 'size', colorKey: undefined }],
                animation: { enabled: false },
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            expect(seriesHighlightEnabled(chart.series[0] as SunburstSeries)).toBe(false);
        });

        it('lets a series re-enable highlighting over a disabled chart-level default', async () => {
            const options: AgChartOptions = {
                data: DATA,
                highlight: { enabled: false },
                series: [
                    {
                        type: 'sunburst',
                        labelKey: 'name',
                        sizeKey: 'size',
                        colorKey: undefined,
                        highlight: { enabled: true },
                    },
                ],
                animation: { enabled: false },
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            expect(seriesHighlightEnabled(chart.series[0] as SunburstSeries)).toBe(true);
        });

        it('still shows tooltips when highlighting is disabled', async () => {
            const options: AgChartOptions = {
                data: DATA,
                series: [
                    {
                        type: 'sunburst',
                        labelKey: 'name',
                        sizeKey: 'size',
                        colorKey: undefined,
                        highlight: { enabled: false },
                        tooltip: { renderer: ({ datum }: any) => datum.name },
                    },
                ],
                animation: { enabled: false },
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const series = chart.series[0] as SunburstSeries;
            const sectors = Array.from((series as any).sectorGroup.children());
            const leaf = sectors.find((s: any) => (s.datum?.depth ?? -1) === 1) as any;
            expect(leaf).toBeDefined();
            const { centerX, centerY, innerRadius, outerRadius, startAngle, endAngle } = leaf;
            const r = (innerRadius + outerRadius) / 2;
            const theta = (startAngle + endAngle) / 2;
            const { canvasX: x, canvasY: y } = _ModuleSupport.Transformable.toCanvasPoint(
                (series as any).contentGroup,
                centerX + r * Math.cos(theta),
                centerY + r * Math.sin(theta)
            );
            await hoverAction(x, y)(chart);
            await waitForChartStability(chart);

            const tooltip = document.querySelector('.ag-charts-tooltip');
            expect(tooltip).toBeInstanceOf(HTMLElement);
            expect(tooltip?.textContent?.length).toBeGreaterThan(0);
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
                    const { canvasX: x, canvasY: y } = _ModuleSupport.Transformable.toCanvasPoint(
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
                await clickAction(x + (offset?.x ?? 0), y + (offset?.y ?? 0))(chartInstance);
                await waitForChartStability(chartInstance);
            });

            const nodeCount = chartInstance.series.reduce(
                (sum, series) => sum + testParams.getNodeData(series).length,
                0
            );
            expect(onNodeClick).toHaveBeenCalledTimes(nodeCount);
        };

        it(`should render tooltip correctly`, async () => {
            chart = await createChart({ hasTooltip: true });
            await hoverChartNodes(chart, ({ series, item }) => {
                const tooltip = document.querySelector('.ag-charts-tooltip');
                expect(tooltip).toBeInstanceOf(HTMLElement);
                expect(!tooltip?.hasAttribute('data-presented-as-popover')).toBe(false);

                const values = testParams.getDatumValues(item, series);
                expect(tooltip?.textContent).toEqual(format(...values));
            });

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

        it('should fill missing colorValue with colorScale.missingDataFill', async () => {
            const data = [
                {
                    name: 'Americas',
                    children: [
                        { name: 'United States', gdp: 26.9, change: 6 },
                        { name: 'Canada', gdp: 2.1, change: null },
                        { name: 'Brazil', gdp: 2.1 },
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
            ];
            const options: AgChartOptions = {
                data,
                series: [
                    {
                        type: 'sunburst',
                        labelKey: 'name',
                        sizeKey: 'gdp',
                        colorKey: 'change',
                        colorScale: {
                            fills: [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }],
                            missingDataFill: '#cccccc',
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();

            const seriesImpl = chart.series[0] as SunburstSeries;
            const americas = data.findIndex((d) => d.name === 'Americas');
            assertTooltipPresentForAll(
                seriesImpl,
                data[americas].children,
                (c: { change?: number | null }) => c.change == null,
                (i) => 1 + americas * 4 + i
            );
        });
    });

    describe('legend', () => {
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

        it('should render gradient legend with continuous colorScale', async () => {
            const options: AgChartOptions = {
                data: COLOR_SUNBURST_DATA,
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

        it('should render category legend with discrete colorScale', async () => {
            const options: AgChartOptions = {
                data: COLOR_SUNBURST_DATA,
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

        it('should render category legend with named discrete stops', async () => {
            const options: AgChartOptions = {
                data: COLOR_SUNBURST_DATA,
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

        it('should render gradient legend with continuous named stops', async () => {
            const options: AgChartOptions = {
                data: COLOR_SUNBURST_DATA,
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

    describe('block-leading image segments (treemap parity)', () => {
        // Sunburst labels go through formatLabels() like treemap, so a `block: true` image segment
        // must render anchored left of the slice label with text beside it.
        const iconSvg = (letter: string) =>
            `data:image/svg+xml;utf8,${encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">` +
                    `<circle cx="14" cy="14" r="12" fill="#1f77b4"/>` +
                    `<text x="14" y="19" text-anchor="middle" font-family="Verdana" font-size="13"` +
                    ` fill="white" font-weight="bold">${letter}</text></svg>`
            )}`;
        const ICONS: Record<string, string> = {
            Solar: iconSvg('S'),
            Earth: iconSvg('E'),
            Mars: iconSvg('M'),
            'Gas Giants': iconSvg('G'),
            Jupiter: iconSvg('J'),
        };

        let preloaded: Record<string, SkiaImage> = {};
        beforeAll(async () => {
            const entries = await Promise.all(
                Object.values(ICONS).map(async (url) => [url, await skiaLoadImage(url)] as const)
            );
            preloaded = Object.fromEntries(entries);
        });

        function stubChartImageLoader(chartInstance: any) {
            const imageLoader = (chartInstance as Chart).ctx.scene.imageLoader as any;
            imageLoader.loadImage = (uri: string) => preloaded[uri] as unknown as HTMLImageElement;
        }

        it('renders a block-leading image segment in sunburst labels', async () => {
            const options: AgChartOptions = {
                data: [
                    {
                        name: 'Solar',
                        children: [
                            { name: 'Earth', size: 60 },
                            { name: 'Mars', size: 20 },
                        ],
                    },
                    { name: 'Gas Giants', children: [{ name: 'Jupiter', size: 80 }] },
                ],
                series: [
                    {
                        type: 'sunburst',
                        labelKey: 'name',
                        sizeKey: 'size',
                        label: {
                            formatter: ({ datum }) => {
                                const d = datum as { name: string };
                                return [
                                    { type: 'image', url: ICONS[d.name], width: 18, height: 18, block: true },
                                    { text: d.name },
                                ];
                            },
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            stubChartImageLoader(chart);
            // The snapshot is the guard: if the series flattened the formatter's segment array to
            // plain text the stubbed image would not render and the baseline would diff.
            await compare();
        });
    });

    describe('bigint values (AG-16608)', () => {
        it('renders out-of-safe-range bigint colour values across the colour range', async () => {
            // Colours beyond Number.MAX_SAFE_INTEGER must span the colour domain, not collapse to one colour.
            const options: AgChartOptions = {
                data: [
                    {
                        name: 'root',
                        children: [
                            { name: 'A', size: 1, color: BIG },
                            { name: 'B', size: 1, color: BIG * 2n },
                            { name: 'C', size: 1, color: BIG * 3n },
                        ],
                    },
                ],
                series: [
                    {
                        type: 'sunburst',
                        labelKey: 'name',
                        sizeKey: 'size',
                        colorKey: 'color',
                        colorScale: { fills: [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }] },
                    },
                ],
                animation: { enabled: false },
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });
    });

    // Initial load scales the whole sector group up from nothing; a data reshuffle instead SNAPS,
    // with every sector jumping to its new layout on the first frame (no per-sector tween).
    describe('animation -test page actions', () => {
        const frames = spyOnAnimationFrames();

        type OrgNode = { name: string; children: OrgNode[] };

        // `reversed` deep-reverses child order at every level, reshaping the layout without any sector
        // entering or leaving (a pure re-layout).
        const ORG_DATA: OrgNode[] = [
            {
                name: 'A',
                children: [
                    {
                        name: 'A1',
                        children: [
                            { name: 'A1a', children: [] },
                            { name: 'A1b', children: [] },
                        ],
                    },
                    { name: 'A2', children: [] },
                ],
            },
            {
                name: 'B',
                children: [
                    { name: 'B1', children: [] },
                    { name: 'B2', children: [] },
                    { name: 'B3', children: [] },
                ],
            },
        ];
        const reversed = (nodes: OrgNode[]): OrgNode[] =>
            [...nodes].reverse().map((n) => ({ ...n, children: reversed(n.children) }));

        const sunburstOptions = (data: OrgNode[] = ORG_DATA): AgChartOptions =>
            prepareEnterpriseTestOptions({
                data,
                series: [{ type: 'sunburst', labelKey: 'name' }],
                animation: { enabled: true },
            } as AgChartOptions);

        const SECTOR = /^series\[0\]\/sector\[/;
        const sectorEntries = (sample: SceneGeometrySample) => [...sample].filter(([key]) => SECTOR.test(key));

        // Nesting is checked via geometry rather than node keys, since a reshuffle re-points sampler keys at
        // reused instances. Depth-1 sectors (innerRadius ~ 0) sit on the invisible root and are exempt.
        const sectorsNestWithinParents: SceneFrameInvariant = {
            name: 'sub-sectors nest within a parent ring sector',
            check: (frame) => {
                const sectors = sectorEntries(frame)
                    .map(([, v]) => v)
                    .filter((s) => s.visible !== 0 && s.endAngle - s.startAngle > 1e-3);
                for (const child of sectors) {
                    if (child.innerRadius < 1) continue;
                    const parent = sectors.find(
                        (p) =>
                            Math.abs(p.outerRadius - child.innerRadius) < 1 &&
                            p.startAngle - 1e-3 <= child.startAngle &&
                            child.endAngle <= p.endAngle + 1e-3
                    );
                    if (parent == null) {
                        return `sector [${child.startAngle.toFixed(2)}, ${child.endAngle.toFixed(2)}] at innerRadius ${child.innerRadius.toFixed(1)} has no enclosing parent ring sector`;
                    }
                }
                return undefined;
            },
        };

        const layoutChanges = (before: SceneGeometrySample, after: SceneGeometrySample): number =>
            sectorEntries(before).filter(([key, b]) => {
                const a = after.get(key);
                return (
                    a != null && (Math.abs(a.startAngle - b.startAngle) > 1 || Math.abs(a.endAngle - b.endAngle) > 1)
                );
            }).length;

        // A hierarchy reshuffle snaps at frame 0 (surviving sectors jump to their new positions), so
        // capture with captureSnap rather than captureUpdate's before-anchored flow.
        const captureReshuffle = (create: AgChartOptions, next: AgChartOptions) => {
            const proxy = AgCharts.create(create);
            chart = deproxy(proxy);
            return frames.captureSnap(proxy, createSceneGeometrySampler(proxy), () => proxy.update(next));
        };

        it('standalone: initial load scales the sector group up from nothing', async () => {
            const proxy = AgCharts.create(sunburstOptions());
            chart = deproxy(proxy);
            const sample = createSceneGeometrySampler(proxy);
            const trajectory = await frames.captureAnimationFrames(proxy, sample);
            await frames.runToEnd(proxy);
            expect(sectorEntries(sample())).toHaveLength(10);

            // Only the scaling group moves; every sector's own geometry (and everything else) holds
            // constant, and the nesting invariant is honoured on every frame of the reveal.
            expectSceneTrajectory(
                trajectory,
                { 'series[0]/group[]': { scalingX: 'progresses', scalingY: 'progresses' } },
                { frameInvariants: [sectorsNestWithinParents] }
            );

            // scalingX must sweep monotonically from ~0 to 1, ruling out a no-op or straight-to-full-size reveal.
            const scalingX = trajectory.map((f) => f.get('series[0]/group[]')!.scalingX);
            expect(scalingX[0], 'scalingX at frame 0').toBeLessThanOrEqual(0.01);
            expect(scalingX.at(-1)!, 'scalingX at final frame').toBeCloseTo(1, 2);
            expectMonotonic(scalingX, 'increasing');
            expectProgresses(scalingX);
        });

        it('reshuffle: sectors snap to the new layout with no per-sector tween', async () => {
            const { before, trajectory, after } = await captureReshuffle(
                sunburstOptions(),
                sunburstOptions(reversed(ORG_DATA))
            );
            expect(sectorEntries(before)).toHaveLength(10);
            expect(sectorEntries(after)).toHaveLength(10);

            // No animation batch ran, so no node moved across the captured frames — and the nesting
            // invariant holds on every (already-settled) frame.
            expect(
                trajectory.phaseIntervals.every((interval) => interval.length === 0),
                'no animation phase ran'
            ).toBe(true);
            expectNoAnimation(trajectory);
            expectSceneTrajectory(trajectory, {}, { frameInvariants: [sectorsNestWithinParents] });

            // Frame 0 already equals the settled after-state, and the layout genuinely changed (not a vacuous pin).
            expectSceneSamplesMatch(trajectory[0], after);
            expect(layoutChanges(before, after), 'sectors whose angular span moved').toBeGreaterThan(4);
        });

        // After a reshuffle rebuilds the sector tree, highlighting a node from the new tree must bind
        // to that node's live geometry, not a stale sector left over from a recycled instance.
        const withHighlight = (data: OrgNode[]): AgChartOptions =>
            prepareEnterpriseTestOptions({
                data,
                series: [{ type: 'sunburst', labelKey: 'name', highlight: { highlightedItem: { fill: 'lime' } } }],
                animation: { enabled: true },
            } as AgChartOptions);
        const findSectorNode = (series: SunburstSeries, name: string): any => {
            const dfs = (node: any): any =>
                node?.datum?.name === name ? node : (node?.children ?? []).map(dfs).find(Boolean);
            return dfs((series as any).rootNode);
        };
        const highlightSector = (series: SunburstSeries): any =>
            Array.from((series as any).highlightSelection.nodes())[0];
        const baseSectorFor = (series: SunburstSeries, node: any): any =>
            Array.from((series as any).datumSelection.nodes()).find((s: any) => s.datum === node);

        it('highlight through reshuffle: re-highlighting resolves the pointed node, not a stale sector', async () => {
            const proxy = AgCharts.create(withHighlight(ORG_DATA));
            chart = deproxy(proxy);
            await waitForChartStability(chart);
            const series = chart.series[0] as SunburstSeries;
            const highlightManager = (chart as Chart).ctx.highlightManager;

            highlightManager.updateHighlight(chart.id, findSectorNode(series, 'A2'));
            await waitForChartStability(chart);
            expect(highlightSector(series)?.datum?.datum?.name).toBe('A2');

            await proxy.update(withHighlight(reversed(ORG_DATA)));
            await waitForChartStability(chart);

            const b1 = findSectorNode(series, 'B1');
            highlightManager.updateHighlight(chart.id, b1);
            await waitForChartStability(chart);
            const highlighted = highlightSector(series);
            expect(highlighted?.datum).toBe(b1);
            expect(highlighted?.fill).toBe('lime');
            const base = baseSectorFor(series, b1);
            expect(highlighted?.startAngle).toBeCloseTo(base.startAngle, 5);
            expect(highlighted?.endAngle).toBeCloseTo(base.endAngle, 5);
            expect(highlighted?.outerRadius).toBeCloseTo(base.outerRadius, 5);

            highlightManager.updateHighlight(chart.id);
            await waitForChartStability(chart);
            expect(Array.from((series as any).highlightSelection.nodes())).toHaveLength(0);
        });

        it('sanity: reshuffle endpoints match static renders', async () => {
            const before = sunburstOptions();
            const proxy = AgCharts.create(before);
            chart = deproxy(proxy);
            await expectAnimatedEndpointsMatchStatic(
                frames,
                () => ctx.snapshot(),
                proxy,
                before,
                sunburstOptions(reversed(ORG_DATA))
            );
        });
    });

    // AG-18282: innerRadiusRatio / innerRadiusOffset carve a hole, innerCircle paints the centre.
    describe('inner circle', () => {
        const MULTI_ROOT_DATA = [
            {
                name: 'Fruits',
                children: [
                    { name: 'Banana', size: 10, change: 6 },
                    { name: 'Apple', size: 5, change: null },
                ],
            },
            {
                name: 'Vegetables',
                children: [
                    { name: 'Cucumber', size: 6, change: -2 },
                    { name: 'Carrot', size: 4 },
                ],
            },
        ];
        const SOLE_ROOT_DATA = [{ name: 'Produce', children: MULTI_ROOT_DATA }];
        const DEEP_DATA = [
            {
                name: 'Fruits',
                children: [
                    {
                        name: 'Citrus',
                        children: [
                            { name: 'Orange', children: [{ name: 'Navel', size: 4 }] },
                            { name: 'Lemon', children: [{ name: 'Meyer', size: 3 }] },
                        ],
                    },
                ],
            },
            {
                name: 'Vegetables',
                children: [{ name: 'Root', children: [{ name: 'Carrot', children: [{ name: 'Nantes', size: 5 }] }] }],
            },
        ];

        const UNSUITABLE_WARNING =
            'AG Charts - Options [series.innerCircle] and [series.innerLabels] have no effect unless either [series.innerRadiusRatio] or [series.innerRadiusOffset] is set to carve out a centre.';

        let proxy: any;
        let lastOptions: AgChartOptions;

        const createChart = async (seriesOptions: any = {}, data: any = MULTI_ROOT_DATA, chartOptions: any = {}) => {
            const options: AgChartOptions = {
                data,
                series: [{ type: 'sunburst', labelKey: 'name', sizeKey: 'size', ...seriesOptions }],
                animation: { enabled: false },
                ...chartOptions,
            };
            prepareEnterpriseTestOptions(options);
            lastOptions = options;
            proxy = AgCharts.create(options);
            chart = deproxy(proxy);
            await waitForChartStability(chart);
            return chart.series[0] as SunburstSeries;
        };

        const replaceChart = async (...args: Parameters<typeof createChart>) => {
            chart.destroy();
            return createChart(...args);
        };

        const seriesRadius = () => Math.min(chart.seriesRect.width, chart.seriesRect.height) / 2;
        const maxDepthOf = (series: SunburstSeries) => (series as any).maxDepth as number;
        const sectorsOf = (series: SunburstSeries) => Array.from<any>((series as any).sectorGroup.children());
        const atDepth = (series: SunburstSeries, depth: number) =>
            sectorsOf(series).filter((sector) => sector.datum?.depth === depth);

        const descendants = (node: any, out: any[] = []) => {
            if (typeof node?.children === 'function') {
                for (const child of node.children()) {
                    out.push(child);
                    descendants(child, out);
                }
            }
            return out;
        };
        // The painted centre: a full-sweep disc whose datum carries a radius and no depth, which
        // distinguishes it from a sole root node's depth-0 disc.
        const circleNodes = (series: SunburstSeries) =>
            descendants((series as any).scalingGroup).filter(
                (node: any) =>
                    node.outerRadius != null &&
                    node.innerRadius === 0 &&
                    Math.abs(node.endAngle - node.startAngle - 2 * Math.PI) < 1e-6 &&
                    node.datum?.depth === undefined &&
                    node.datum?.radius != null
            );

        const nameTooltip = { renderer: ({ datum }: any) => datum.name };
        const hoverAt = async (series: SunburstSeries, radius: number, theta: number, settleDelay?: number) => {
            const { canvasX, canvasY } = _ModuleSupport.Transformable.toCanvasPoint(
                (series as any).contentGroup,
                radius * Math.cos(theta),
                radius * Math.sin(theta)
            );
            await hoverAction(canvasX, canvasY)(chart);
            await waitForChartStability(chart, settleDelay);
        };
        const tooltip = () => document.querySelector('.ag-charts-tooltip');
        const tooltipShown = () => tooltip()?.hasAttribute('data-presented-as-popover') === true;

        it('creates no inner-circle node when the options are unset', async () => {
            const series = await createChart();

            expect(circleNodes(series)).toHaveLength(0);
            expect(atDepth(series, 0)[0].innerRadius).toBe(0);
            expectWarningsCalls().toEqual([]);
        });

        it('carves a hole from innerRadiusRatio and spaces every level evenly', async () => {
            const series = await createChart({ innerRadiusRatio: 0.3 });

            const radius = seriesRadius();
            const hole = radius * 0.3;
            const maxDepth = maxDepthOf(series);
            const radiusScale = (radius - hole) / (maxDepth + 1);

            expect(atDepth(series, 0)[0].innerRadius).toBeCloseTo(hole, 5);
            for (let depth = 0; depth <= maxDepth; depth += 1) {
                const ring = atDepth(series, depth);
                expect(ring.length).toBeGreaterThan(0);
                for (const sector of ring) {
                    expect(sector.innerRadius).toBeCloseTo(hole + depth * radiusScale, 5);
                    expect(sector.outerRadius).toBeCloseTo(hole + (depth + 1) * radiusScale, 5);
                }
            }
            expectWarningsCalls().toEqual([]);
        });

        it('keeps the hole independent of maxDepth', async () => {
            const shallow = await createChart({ innerRadiusRatio: 0.25 });
            expect(maxDepthOf(shallow)).toBe(1);
            const shallowInnerRadius = atDepth(shallow, 0)[0].innerRadius;
            expect(shallowInnerRadius).toBeCloseTo(seriesRadius() * 0.25, 5);

            const deep = await replaceChart({ innerRadiusRatio: 0.25 }, DEEP_DATA);
            expect(maxDepthOf(deep)).toBe(3);
            expect(atDepth(deep, 0)[0].innerRadius).toBeCloseTo(shallowInnerRadius, 5);
            expectWarningsCalls().toEqual([]);
        });

        it.each([
            { label: 'offset alone', options: { innerRadiusOffset: 40 }, hole: (_radius: number): number => 40 },
            {
                label: 'ratio and offset combined',
                options: { innerRadiusRatio: 0.2, innerRadiusOffset: 30 },
                hole: (radius: number): number => radius * 0.2 + 30,
            },
        ])('carves the hole from $label', async ({ options, hole }) => {
            const series = await createChart(options);

            expect(atDepth(series, 0)[0].innerRadius).toBeCloseTo(hole(seriesRadius()), 5);
            expectWarningsCalls().toEqual([]);
        });

        it('leaves the geometry untouched when innerCircle is set without a radius option', async () => {
            const series = await createChart({ innerCircle: { fill: 'red' } });

            expect(atDepth(series, 0)[0].innerRadius).toBe(0);
            expect(circleNodes(series)).toHaveLength(0);
            expectWarningsCalls().toEqual([[UNSUITABLE_WARNING]]);
        });

        it('paints the circle with innerCircle.fill rather than a scale-derived colour', async () => {
            const series = await createChart({
                colorKey: 'change',
                colorScale: { fills: [{ color: 'blue' }, { color: 'yellow' }], missingDataFill: '#cccccc' },
                innerRadiusRatio: 0.35,
                innerCircle: { fill: 'red' },
            });

            const [circle] = circleNodes(series);
            expect(circle).toBeDefined();
            expect(circle.fill).toBe('red');
            expect(circle.outerRadius).toBeCloseTo(seriesRadius() * 0.35, 5);
            expectWarningsCalls().toEqual([]);
        });

        it('shows no tooltip inside the hole with an exact tooltip range', async () => {
            const series = await createChart(
                { innerRadiusRatio: 0.5, innerCircle: { fill: 'red' }, tooltip: nameTooltip },
                MULTI_ROOT_DATA,
                { tooltip: { range: 'exact' as InteractionRange } }
            );

            const hole = seriesRadius() * 0.5;
            for (const [index, fraction] of [0, 0.25, 0.5, 0.9].entries()) {
                await hoverAt(series, hole * fraction, (index * Math.PI) / 2, MIN_TOOLTIP_HIDE_DELAY);
                expect(tooltipShown(), `hole fraction ${fraction}`).toBe(false);
            }
            expectWarningsCalls().toEqual([]);
        });

        // With a 'nearest' range the hole is still within reach of the surrounding sectors, so a
        // tooltip does appear - what must never happen is the painted circle itself being picked.
        it('never resolves the painted circle as the nearest datum', async () => {
            const series = await createChart(
                { innerRadiusRatio: 0.5, innerCircle: { fill: 'red' }, tooltip: nameTooltip },
                MULTI_ROOT_DATA,
                { tooltip: { range: 'nearest' as InteractionRange } }
            );

            const hole = seriesRadius() * 0.5;
            const names = MULTI_ROOT_DATA.flatMap((root) => [root.name, ...root.children.map((c) => c.name)]);
            let tooltips = 0;
            for (const [index, fraction] of [0, 0.25, 0.5, 0.9].entries()) {
                await hoverAt(series, hole * fraction, (index * Math.PI) / 2);
                const text = tooltipShown() ? tooltip()?.textContent : undefined;
                if (text != null) {
                    tooltips += 1;
                    expect(names, `hole fraction ${fraction}`).toContain(text);
                }
            }
            expect(tooltips, 'hovers inside the hole that tooltipped').toBeGreaterThan(0);
            expectWarningsCalls().toEqual([]);
        });

        it('never invokes itemStyler for the inner circle', async () => {
            const itemStyler = vi.fn(() => ({}));
            const series = await createChart({
                innerRadiusRatio: 0.4,
                innerCircle: { fill: 'red' },
                itemStyler,
            });

            expect(circleNodes(series)).toHaveLength(1);
            // The set of datums the styler saw is exactly the sector datums - the circle's
            // `{ radius }` datum never reaches it.
            const styledData = new Set((itemStyler.mock.calls as any[]).map(([params]) => params.datum));
            const sectorData = new Set(
                sectorsOf(series)
                    .map((sector) => sector.datum?.datum)
                    .filter((datum) => datum != null)
            );
            expect(styledData).toEqual(sectorData);
            expect([...styledData].some((datum: any) => datum?.radius != null)).toBe(false);
            expectWarningsCalls().toEqual([]);
        });

        it('parents the inner circle inside the scaling group with pointer events disabled', async () => {
            const series = await createChart({ innerRadiusRatio: 0.3, innerCircle: { fill: 'red' } });

            const [circle] = circleNodes(series);
            expect(circle).toBeDefined();
            expect(circle.parentNode.pointerEvents).toBe(_ModuleSupport.PointerEvents.None);

            let ancestor = circle.parentNode;
            while (ancestor != null && ancestor !== (series as any).scalingGroup) {
                ancestor = ancestor.parentNode;
            }
            expect(ancestor).toBe((series as any).scalingGroup);
            expectWarningsCalls().toEqual([]);
        });

        // AG-18283: a sole 100% root node is not a centre. Without an inner-radius option the series
        // renders exactly as it did before innerCircle/innerLabels existed, and the options warn.
        it('leaves a sole 100% root node exactly as it renders without the centre options', async () => {
            const itemStyler = vi.fn(() => ({}));
            const control = await createChart({ itemStyler, tooltip: nameTooltip }, SOLE_ROOT_DATA);
            const radiusScale = seriesRadius() / (maxDepthOf(control) + 1);
            const controlRoot = atDepth(control, 0)[0];
            const controlGeometry = { inner: controlRoot.innerRadius, outer: controlRoot.outerRadius };
            // The first hover after a chart is created never tooltips, so both charts get the same
            // warm-up hover on an outer sector before the root sector is compared.
            await hoverAt(control, radiusScale * 1.5, 0);
            await hoverAt(control, radiusScale * 0.5, 0);
            const rootTooltipWithoutCircle = tooltipShown();
            expect(rootTooltipWithoutCircle, 'sole-root sector tooltips without the circle').toBe(true);
            expect(itemStyler).toHaveBeenCalled();
            expectWarningsCalls().toEqual([]);

            itemStyler.mockClear();
            const series = await replaceChart(
                {
                    innerCircle: { fill: 'red' },
                    innerLabels: [{ text: 'Total', fontSize: 14 }],
                    itemStyler,
                    tooltip: nameTooltip,
                },
                SOLE_ROOT_DATA
            );

            expect(series.resolveCentreCircle()).toBeNull();
            expect(circleNodes(series)).toHaveLength(0);
            expect(series.innerLabelsSelection.nodes()).toHaveLength(0);

            const root = atDepth(series, 0)[0];
            expect(root.innerRadius).toBe(controlGeometry.inner);
            expect(root.outerRadius).toBeCloseTo(controlGeometry.outer, 5);
            expect(root.outerRadius).toBeCloseTo(radiusScale, 5);

            await hoverAt(series, radiusScale * 1.5, 0);
            expect(tooltipShown(), 'a sector outside the centre still tooltips').toBe(true);
            await hoverAt(series, radiusScale * 0.5, 0);
            expect(tooltipShown()).toBe(rootTooltipWithoutCircle);

            const styledData = new Set((itemStyler.mock.calls as any[]).map(([params]) => params.datum));
            expect(styledData.has(SOLE_ROOT_DATA[0])).toBe(true);
            expect([...styledData].some((datum: any) => datum?.radius != null)).toBe(false);
            expectWarningsCalls().toEqual([[UNSUITABLE_WARNING]]);
        });

        it('warns exactly once when innerCircle has no centre to paint, even once innerLabels join it', async () => {
            await createChart({ innerCircle: { fill: 'red' } });
            expectWarningsCalls().toEqual([[UNSUITABLE_WARNING]]);

            // `expectWarningsCalls` clears the buffer, so an empty second read means the warning
            // did not repeat across the update.
            await proxy.update({ ...lastOptions, data: [...MULTI_ROOT_DATA].reverse() });
            await waitForChartStability(chart);
            expectWarningsCalls().toEqual([]);

            // Adding innerLabels on top via a further update must not add a second warning - both
            // options share one message, so the chart has warned exactly once across its lifetime.
            await proxy.update({
                ...lastOptions,
                series: [{ ...(lastOptions.series![0] as any), innerLabels: [{ text: 'Total' }] }],
            });
            await waitForChartStability(chart);
            expectWarningsCalls().toEqual([]);
        });

        it('lays a sole root label inside its annulus once a hole is carved', async () => {
            const series = await createChart({ innerRadiusRatio: 0.4 }, SOLE_ROOT_DATA);

            const radius = seriesRadius();
            const hole = radius * 0.4;
            const radiusScale = (radius - hole) / (maxDepthOf(series) + 1);

            const rootLabel = (series as any).rootNode.children[0].label;
            expect(rootLabel).toBeDefined();
            expect(rootLabel.radius).toBeGreaterThanOrEqual(hole);
            expect(rootLabel.radius).toBeLessThanOrEqual(hole + radiusScale);
            expectWarningsCalls().toEqual([]);
        });

        it('resolves the centre circle only for a carved hole', async () => {
            const holed = await createChart({ innerRadiusRatio: 0.3 });
            expect(holed.resolveCentreCircle()?.radius).toBeCloseTo(seriesRadius() * 0.3, 5);

            const offset = await replaceChart({ innerRadiusOffset: 20 });
            expect(offset.resolveCentreCircle()?.radius).toBeCloseTo(20, 5);

            // A ratio of zero is "supplied" but carves nothing, so it resolves no centre either.
            const zeroRatio = await replaceChart({ innerRadiusRatio: 0 });
            expect(zeroRatio.resolveCentreCircle()).toBeNull();

            const soleRoot = await replaceChart({}, SOLE_ROOT_DATA);
            expect(soleRoot.resolveCentreCircle()).toBeNull();

            const neither = await replaceChart();
            expect(neither.resolveCentreCircle()).toBeNull();
            expectWarningsCalls().toEqual([]);
        });

        it('warns when innerCircle is supplied without a fill on the series option', async () => {
            await createChart({ innerRadiusRatio: 0.3, innerCircle: { fillOpacity: 0.5 } });
            expectWarningsCalls().toContainEqual([
                'AG Charts - Option `series[0].innerCircle.fill` is required and has not been provided; expecting a supported color string (hex, rgb(), hsl(), oklch() or a CSS color name), a color object or a color ref and where a color ref with [onto] or [ontoColor] must also have [mix], ignoring.',
            ]);
        });

        // AG-18283: innerLabels stack text inside the same centre circle innerCircle paints into.
        describe('inner labels', () => {
            const innerLabelGeometry = (series: SunburstSeries) =>
                series.innerLabelsSelection.nodes().map((node) => {
                    const bbox = node.getBBox();
                    return { y: node.y, visible: node.visible, width: bbox.width, height: bbox.height };
                });

            const rootPrimaryLabelText = (series: SunburstSeries): _ModuleSupport.TransformableText | undefined => {
                let group: any;
                (series as any).labelSelection.each((candidate: any, datum: any) => {
                    if (datum.depth === 0) group = candidate;
                });
                if (group == null) return undefined;
                return _ModuleSupport.Selection.selectByClass(group, _ModuleSupport.TransformableText).find(
                    (text) => text.tag === 0
                );
            };

            it('creates one node per innerLabels entry, each carrying its own font styling', async () => {
                const series = await createChart({
                    innerRadiusRatio: 0.4,
                    innerLabels: [
                        { text: 'Total', fontSize: 20, fontWeight: 'bold', color: 'red' },
                        { text: '100', fontSize: 12, fontWeight: 'normal', color: 'blue' },
                    ],
                });

                const nodes = series.innerLabelsSelection.nodes();
                expect(nodes).toHaveLength(2);
                expect(nodes[0].fontSize).toBe(20);
                expect(nodes[0].fontWeight).toBe('bold');
                expect(nodes[0].fill).toBe('red');
                expect(nodes[1].fontSize).toBe(12);
                expect(nodes[1].fontWeight).toBe('normal');
                expect(nodes[1].fill).toBe('blue');
                expectWarningsCalls().toEqual([]);
            });

            it("stacks inner labels using each entry's own spacing, anchored symmetrically about the centre", async () => {
                const withSpacing = (spacing0: number, spacing1: number) => ({
                    ...lastOptions,
                    series: [
                        {
                            ...(lastOptions.series![0] as any),
                            innerLabels: [
                                { text: 'Total', fontSize: 16, spacing: spacing0 },
                                { text: '100', fontSize: 12, spacing: spacing1 },
                            ],
                        },
                    ],
                });

                const series = await createChart({
                    innerRadiusRatio: 0.4,
                    innerLabels: [
                        { text: 'Total', fontSize: 16, spacing: 4 },
                        { text: '100', fontSize: 12, spacing: 4 },
                    ],
                });

                const g0 = innerLabelGeometry(series);
                expect(g0[0].y - g0[0].height).toBeCloseTo(-g0.at(-1)!.y, 5);
                const gap0 = g0[1].y - g0[0].y;
                expect(gap0).toBeCloseTo(g0[1].height + 4 + 4, 5);

                await proxy.update(withSpacing(10, 4));
                await waitForChartStability(chart);
                const g1 = innerLabelGeometry(series);
                expect(g1[1].y - g1[0].y).toBeCloseTo(gap0 + 6, 5);
                expect(g1[0].y - g1[0].height).toBeCloseTo(-g1.at(-1)!.y, 5);

                await proxy.update(withSpacing(10, 10));
                await waitForChartStability(chart);
                const g2 = innerLabelGeometry(series);
                expect(g2[1].y - g2[0].y).toBeCloseTo(gap0 + 12, 5);
                expect(g2[0].y - g2[0].height).toBeCloseTo(-g2.at(-1)!.y, 5);
                expectWarningsCalls().toEqual([]);
            });

            it('hides every inner label together when the stack cannot fit the hole, and shows them all when it can', async () => {
                const cramped = await createChart({
                    innerRadiusRatio: 0.06,
                    innerLabels: [
                        { text: 'A dramatically long inner label string that will never fit', fontSize: 40 },
                        { text: 'Second line also far too long', fontSize: 40 },
                    ],
                });
                const crampedNodes = innerLabelGeometry(cramped);
                expect(crampedNodes.length).toBeGreaterThan(0);
                expect(crampedNodes.every((node) => node.visible === false)).toBe(true);
                expect(crampedNodes[0].width).toBeGreaterThan(seriesRadius() * 0.06 * Math.SQRT2);

                const comfortable = await replaceChart({
                    innerRadiusRatio: 0.4,
                    innerLabels: [
                        { text: 'Total', fontSize: 14 },
                        { text: '100', fontSize: 12 },
                    ],
                });
                const comfortableNodes = innerLabelGeometry(comfortable);
                expect(comfortableNodes.length).toBeGreaterThan(0);
                expect(comfortableNodes.every((node) => node.visible === true)).toBe(true);
                expectWarningsCalls().toEqual([]);
            });

            // AG-18283: there is no precedence to arbitrate. A sole root's centre label keeps the
            // centre because innerLabels never render without a hole; with a hole carved, depth 0 is
            // an annulus whose label sits outside the hole, so the two can never collide.
            it('never displaces the sole-root centre label, and coexists with it once a hole is carved', async () => {
                const withoutInnerLabels = await createChart({ secondaryLabelKey: 'change' }, SOLE_ROOT_DATA);
                expect(rootPrimaryLabelText(withoutInnerLabels)?.visible).toBe(true);
                expectWarningsCalls().toEqual([]);

                const withInnerLabels = await replaceChart(
                    { secondaryLabelKey: 'change', innerLabels: [{ text: 'Total', fontSize: 14 }] },
                    SOLE_ROOT_DATA
                );
                expect(rootPrimaryLabelText(withInnerLabels)?.visible).toBe(true);
                expect(withInnerLabels.innerLabelsSelection.nodes()).toHaveLength(0);
                expectWarningsCalls().toEqual([[UNSUITABLE_WARNING]]);

                const holed = await replaceChart(
                    {
                        secondaryLabelKey: 'change',
                        innerRadiusRatio: 0.4,
                        innerLabels: [{ text: 'Total', fontSize: 14 }],
                    },
                    SOLE_ROOT_DATA
                );
                const holedRootLabel = rootPrimaryLabelText(holed);
                expect(holedRootLabel?.visible).toBe(true);
                expect(holed.innerLabelsSelection.nodes()[0].visible).toBe(true);
                // The root label is laid out in its annulus, never at dead centre with the stack.
                const rootLabelDistance = Math.hypot(holedRootLabel!.translationX, holedRootLabel!.translationY);
                expect(rootLabelDistance).toBeGreaterThan(seriesRadius() * 0.4 - 1e-6);
                expectWarningsCalls().toEqual([]);
            });

            it('excludes the inner labels group and every node from pointer events', async () => {
                const series = await createChart({
                    innerRadiusRatio: 0.4,
                    innerLabels: [{ text: 'Total', fontSize: 16 }],
                });

                expect((series as any).innerLabelsGroup.pointerEvents).toBe(_ModuleSupport.PointerEvents.None);
                for (const node of series.innerLabelsSelection.nodes()) {
                    expect(node.pointerEvents).toBe(_ModuleSupport.PointerEvents.None);
                }
                expectWarningsCalls().toEqual([]);
            });

            it('never invokes itemStyler for an inner label', async () => {
                const itemStyler = vi.fn(() => ({}));
                const series = await createChart({
                    innerRadiusRatio: 0.4,
                    innerLabels: [{ text: 'Total', fontSize: 16 }],
                    itemStyler,
                });

                const styledData = new Set((itemStyler.mock.calls as any[]).map(([params]) => params.datum));
                const sectorData = new Set(
                    sectorsOf(series)
                        .map((sector) => sector.datum?.datum)
                        .filter((datum) => datum != null)
                );
                expect(styledData).toEqual(sectorData);
                expectWarningsCalls().toEqual([]);
            });

            it('shows no tooltip inside the hole with an exact tooltip range', async () => {
                const series = await createChart(
                    {
                        innerRadiusRatio: 0.4,
                        innerLabels: [{ text: 'Total', fontSize: 16 }],
                        tooltip: nameTooltip,
                    },
                    MULTI_ROOT_DATA,
                    { tooltip: { range: 'exact' as InteractionRange } }
                );

                const hole = seriesRadius() * 0.4;
                for (const [index, fraction] of [0, 0.25, 0.5, 0.9].entries()) {
                    await hoverAt(series, hole * fraction, (index * Math.PI) / 2, MIN_TOOLTIP_HIDE_DELAY);
                    expect(tooltipShown(), `hole fraction ${fraction}`).toBe(false);
                }
                expectWarningsCalls().toEqual([]);
            });

            it('resolves only a sector as the nearest datum inside the hole, never an inner label', async () => {
                const innerLabelTexts = ['Total', '100'];
                const series = await createChart(
                    {
                        innerRadiusRatio: 0.4,
                        innerLabels: innerLabelTexts.map((text) => ({ text, fontSize: 16 })),
                        tooltip: nameTooltip,
                    },
                    MULTI_ROOT_DATA,
                    { tooltip: { range: 'nearest' as InteractionRange } }
                );

                const hole = seriesRadius() * 0.4;
                const names = MULTI_ROOT_DATA.flatMap((root) => [root.name, ...root.children.map((c) => c.name)]);
                let tooltips = 0;
                for (const [index, fraction] of [0, 0.25, 0.5, 0.9].entries()) {
                    await hoverAt(series, hole * fraction, (index * Math.PI) / 2);
                    const text = tooltipShown() ? tooltip()?.textContent : undefined;
                    if (text != null) {
                        tooltips += 1;
                        expect(names, `hole fraction ${fraction}`).toContain(text);
                        expect(innerLabelTexts).not.toContain(text);
                    }
                }
                expect(tooltips, 'hovers inside the hole that tooltipped').toBeGreaterThan(0);
                expectWarningsCalls().toEqual([]);
            });

            it('warns exactly once when innerLabels alone has no centre to render into', async () => {
                await createChart({ innerLabels: [{ text: 'Total', fontSize: 14 }] });
                expectWarningsCalls().toEqual([[UNSUITABLE_WARNING]]);
            });

            it('accepts an innerLabels text segments array without warnings and still rejects a malformed segment', async () => {
                await createChart({
                    innerRadiusRatio: 0.4,
                    innerLabels: [
                        {
                            text: [
                                { text: 'Total ' },
                                { text: '100', fontSize: 20, color: 'red', verticalAlign: 'middle' },
                            ],
                            fontSize: 14,
                        },
                    ],
                });
                expectWarningsCalls().toEqual([]);

                await proxy.update({
                    ...lastOptions,
                    series: [
                        {
                            ...(lastOptions.series![0] as any),
                            innerLabels: [{ text: [{ type: 'image', width: 10, height: 10 } as any] }],
                        },
                    ],
                });
                await waitForChartStability(chart);

                expectWarningsCalls().toMatchInlineSnapshot(`
                  [
                    [
                      "AG Charts - Option \`series[0].innerLabels[0].text\` cannot be set to \`[{"type":"image","width":10,"height":10}]\`; expecting a string, a number or bigint, a date or text or image segments array, ignoring.",
                    ],
                  ]
                `);
            });

            it('leaves the inner-labels selection and group empty when innerLabels is unset or an explicit empty array', async () => {
                const unset = await createChart({ innerRadiusRatio: 0.4 });
                expect(unset.innerLabelsSelection.nodes()).toHaveLength(0);
                expect(Array.from((unset as any).innerLabelsGroup.children())).toHaveLength(0);
                expectWarningsCalls().toEqual([]);

                const empty = await replaceChart({ innerRadiusRatio: 0.4, innerLabels: [] });
                expect(empty.innerLabelsSelection.nodes()).toHaveLength(0);
                expect(Array.from((empty as any).innerLabelsGroup.children())).toHaveLength(0);
                expectWarningsCalls().toEqual([]);
            });

            it('renders inner labels using theme defaults when no font options are set at all', async () => {
                const series = await createChart({ innerRadiusRatio: 0.4, innerLabels: [{ text: 'Total' }] });

                const [node] = series.innerLabelsSelection.nodes();
                expect(node.fill).toBeDefined();
                expect(node.fontSize).toBeGreaterThan(0);
                expect(node.visible).toBe(true);
                const bbox = node.getBBox();
                expect(bbox.width).toBeGreaterThan(0);
                expect(bbox.height).toBeGreaterThan(0);
                expectWarningsCalls().toEqual([]);
            });

            it('defaults innerLabels to an empty array so no theme default can populate it', async () => {
                const series = await createChart();
                const { properties } = series as unknown as { properties: { innerLabels: unknown[] } };
                expect(properties.innerLabels).toHaveLength(0);
                expectWarningsCalls().toEqual([]);
            });
        });
    });
});
