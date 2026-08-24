import { afterEach, describe, expect, it, vi } from 'vitest';

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
    IMAGE_SNAPSHOT_DEFAULTS,
    MIN_TOOLTIP_HIDE_DELAY,
    type SceneGeometrySample,
    clickAction,
    compareImageSnapshot,
    createSceneGeometrySampler,
    deproxy,
    expectAnimatedEndpointsMatchStatic,
    expectSceneTrajectory,
    expectWarningsCalls,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    waitForChartStability,
} from 'ag-charts-community-test';
import { classCast } from 'ag-charts-test';

import {
    funnelLabelFadeIn,
    funnelLabelOpacities,
    funnelPathReveal,
    prepareEnterpriseTestOptions,
    renderEnterpriseChartImage,
} from '../../test/utils';
import { FunnelConnector } from './funnelConnector';
import { FunnelSeries } from './funnelSeries';

const FUNNEL_EXAMPLE: AgChartOptions = {
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
            type: 'funnel',
            stageKey: 'group',
            valueKey: 'value',
        },
    ],
    legend: {
        enabled: true,
    },
};

describe('FunnelSeries', () => {
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
        await compareImageSnapshot(chart, ctx);
    };

    describe('Theme Overrides', () => {
        it('should apply theme overrides correctly (AG-13910)', async () => {
            const options: AgChartOptions = { ...FUNNEL_EXAMPLE };
            options.theme = {
                overrides: {
                    funnel: {
                        series: {
                            label: {
                                color: 'yellow',
                                fontSize: 34,
                                fontStyle: 'italic',
                                fontWeight: 'bold',
                            },
                            stageLabel: {
                                color: 'red',
                                fontSize: 34,
                                fontStyle: 'italic',
                                fontWeight: 'bold',
                            },
                        },
                    },
                },
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });
    });

    describe('Series Highlighting', () => {
        it('should render a chart', async () => {
            const options: AgChartOptions = { ...FUNNEL_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });

        it('should render highlight of node', async () => {
            const options: AgChartOptions = { ...FUNNEL_EXAMPLE };
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

        it(`should handle legendClick event`, async () => {
            const onNodeClick = vi.fn();
            chart = await createChart({ hasTooltip: true, onNodeClick, nodeClickRange: 'nearest' });
            await checkLegendClick(chart);
        });

        it(`should handle nodeClick event with offset click when range is within pixel distance`, async () => {
            const onNodeClick = vi.fn();
            chart = await createChart({ hasTooltip: true, onNodeClick, nodeClickRange: 6 });
            await checkNodeClick(chart, onNodeClick, { x: 0, y: 5 });
        });
    };

    describe(`Funnel Series Pointer Events`, () => {
        const datasets = {
            data: FUNNEL_EXAMPLE.data,
            stageKey: 'group',
            valueKey: 'value',
        };

        const cartesianTestParams = {
            getNodeData: (series) => series.contextNodeData?.nodeData ?? [],
            getTooltipRenderedValues: (params) => [params.datum[params.stageKey], params.datum[params.valueKey]],
            getHighlightNode: (_, series) => series.highlightNodeGroup.children().next().value,
        } as Parameters<typeof testPointerEvents>[0];

        testPointerEvents({
            ...cartesianTestParams,
            seriesOptions: {
                type: 'funnel',
                stageKey: datasets.stageKey,
                valueKey: datasets.valueKey,
            },
            chartOptions: {
                data: datasets.data,
                legend: {
                    enabled: true,
                },
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
        it('should render funnel series with a default gradient fill', async () => {
            const options = {
                ...FUNNEL_EXAMPLE,
                series: [
                    {
                        type: 'funnel',
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

        it('should render funnel series with a gradient fill', async () => {
            const options = {
                ...FUNNEL_EXAMPLE,
                series: [
                    {
                        type: 'funnel',
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

        it('should render funnel series with a mix of gradient and string fills', async () => {
            const options = {
                ...FUNNEL_EXAMPLE,
                series: [
                    {
                        type: 'funnel',
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

        it('should render funnel series with a series bound gradient fill', async () => {
            const options = {
                ...FUNNEL_EXAMPLE,
                series: [
                    {
                        type: 'funnel',
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

        it('should render funnel series with a series bound drop off gradient fill', async () => {
            const options = {
                ...FUNNEL_EXAMPLE,
                series: [
                    {
                        type: 'funnel',
                        stageKey: 'group',
                        valueKey: 'value',
                        dropOff: {
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
                { group: 'Close', value: 4460 },
                { group: 'Propose', value: 7260 },
                { group: 'Develop', value: 7910 },
                { group: 'Qualify', value: 9170 },
            ],
            series: [
                {
                    type: 'funnel',
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

    describe('null category key', () => {
        const FUNNEL_NULL_CATEGORY_KEY_DATA = [
            { group: 'Qualify', value: 7910 },
            { group: null, value: 8170 },
            { group: 'Close', value: 4460 },
        ];

        const FUNNEL_NULL_CATEGORY_KEY_OPTIONS: AgChartOptions = {
            data: FUNNEL_NULL_CATEGORY_KEY_DATA,
            series: [
                {
                    type: 'funnel',
                    stageKey: 'group',
                    valueKey: 'value',
                },
            ],
        };

        it('should reject null category key with warning', async () => {
            const options: AgChartOptions = { ...FUNNEL_NULL_CATEGORY_KEY_OPTIONS };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [FunnelSeries-1 / xValue] ignored:",
    "[null]",
  ],
]
`);
            await compare();
        });

        it('should accept null category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...FUNNEL_NULL_CATEGORY_KEY_OPTIONS,
                series: [
                    {
                        ...FUNNEL_NULL_CATEGORY_KEY_OPTIONS.series![0],
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });
    });

    describe('undefined category key', () => {
        const FUNNEL_UNDEFINED_CATEGORY_KEY_DATA = [
            { group: 'Qualify', value: 7910 },
            { group: undefined, value: 8170 },
            { group: 'Close', value: 4460 },
        ];

        const FUNNEL_NULL_AND_UNDEFINED_KEYS_DATA = [
            { group: 'Qualify', value: 7910 },
            { group: null, value: 7500 },
            { group: undefined, value: 670 },
            { group: 'Close', value: 4460 },
        ];

        const FUNNEL_UNDEFINED_CATEGORY_KEY_OPTIONS: AgChartOptions = {
            data: FUNNEL_UNDEFINED_CATEGORY_KEY_DATA,
            series: [
                {
                    type: 'funnel',
                    stageKey: 'group',
                    valueKey: 'value',
                },
            ],
        };

        const FUNNEL_NULL_AND_UNDEFINED_KEYS_OPTIONS: AgChartOptions = {
            data: FUNNEL_NULL_AND_UNDEFINED_KEYS_DATA,
            series: [
                {
                    type: 'funnel',
                    stageKey: 'group',
                    valueKey: 'value',
                },
            ],
        };

        it('should reject undefined category key with warning', async () => {
            const options: AgChartOptions = { ...FUNNEL_UNDEFINED_CATEGORY_KEY_OPTIONS };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [undefined] for [FunnelSeries-1 / xValue] ignored:",
    "[undefined]",
  ],
]
`);
            await compare();
        });

        it('should accept undefined category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...FUNNEL_UNDEFINED_CATEGORY_KEY_OPTIONS,
                series: [
                    {
                        ...FUNNEL_UNDEFINED_CATEGORY_KEY_OPTIONS.series![0],
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });

        it('should treat null and undefined as distinct categories when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...FUNNEL_NULL_AND_UNDEFINED_KEYS_OPTIONS,
                series: [
                    {
                        ...FUNNEL_NULL_AND_UNDEFINED_KEYS_OPTIONS.series![0],
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });
    });

    describe('bigint values (AG-16608)', () => {
        it('renders a funnel series with out-of-safe-range bigint values', async () => {
            expect(
                await renderEnterpriseChartImage(ctx, {
                    data: [
                        { stage: 'a', value: BIG * 3n },
                        { stage: 'b', value: BIG * 2n },
                        { stage: 'c', value: BIG },
                    ],
                    series: [{ type: 'funnel', stageKey: 'stage', valueKey: 'value' }],
                })
            ).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });
    });

    describe('numeric category data', () => {
        it('should resolve numeric stage data without a data-type warning', async () => {
            const options: AgChartOptions = {
                data: [
                    { group: 1, value: 7910 },
                    { group: 2, value: 8170 },
                    { group: 3, value: 7260 },
                    { group: 4, value: 4460 },
                ],
                series: [{ type: 'funnel', stageKey: 'group', valueKey: 'value' }],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            expectWarningsCalls().toEqual([]);
            await compare();
        });
    });

    describe('cornerRadius', () => {
        // Rect.serializeProps() omits the corner-radius fields, so read the nodes directly.
        const contentNodes = (target: Chart) => {
            const nodes: _ModuleSupport.Node[] = [];
            const visit = (node: _ModuleSupport.Node) => {
                nodes.push(node);
                if (node instanceof _ModuleSupport.Group) {
                    for (const child of node.children()) visit(child);
                }
            };
            visit(classCast(target.series[0], FunnelSeries).contentGroup);
            return nodes;
        };

        const segmentRects = (target: Chart) =>
            contentNodes(target).filter((node): node is _ModuleSupport.Rect => node instanceof _ModuleSupport.Rect);

        const dropOffConnectors = (target: Chart) =>
            contentNodes(target).filter((node): node is FunnelConnector => node instanceof FunnelConnector);

        const buildOptions = (cornerRadius?: number, direction?: 'horizontal' | 'vertical') => {
            const options: AgChartOptions = {
                data: [
                    { group: 'Qualify', value: 7910 },
                    { group: 'Develop', value: 8170 },
                    { group: 'Propose', value: 7260 },
                    { group: 'Close', value: 4460 },
                ],
                series: [
                    {
                        type: 'funnel',
                        stageKey: 'group',
                        valueKey: 'value',
                        strokes: ['black'],
                        strokeWidth: 4,
                        cornerRadius,
                        direction,
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);
            return options;
        };

        it('rounds every segment, with the stroke following the rounded shape', async () => {
            chart = deproxy(AgCharts.create(buildOptions(16)));
            await waitForChartStability(chart);

            const rects = segmentRects(chart);
            expect(rects).toHaveLength(4);
            for (const rect of rects) {
                expect(rect.topLeftCornerRadius).toBe(16);
                expect(rect.topRightCornerRadius).toBe(16);
                expect(rect.bottomRightCornerRadius).toBe(16);
                expect(rect.bottomLeftCornerRadius).toBe(16);
            }

            await compare();
        });

        it('starts the drop-off connectors on the segments rounded corners', async () => {
            chart = deproxy(AgCharts.create(buildOptions(16)));
            await waitForChartStability(chart);

            const rects = segmentRects(chart).sort((a, b) => a.y - b.y);
            const connectors = dropOffConnectors(chart).sort((a, b) => a.y0 - b.y0);
            expect(connectors).toHaveLength(3);

            for (const [index, connector] of connectors.entries()) {
                expect(connector.capsAlongX).toBe(true);
                expect(connector.startCornerRadius).toBe(16);
                expect(connector.endCornerRadius).toBe(16);

                // The connector opens on the segment's bottom-left corner arc, never at the square
                // corner, which is the cut-away the segment does not draw.
                const { startCornerRadius: radius, x0, y0 } = connector;
                const above = rects[index];
                expect(x0).toBeCloseTo(above.x, 0);
                expect(y0).toBeCloseTo(above.y + above.height, 0);

                const centreX = x0 + radius;
                const centreY = y0 - radius;
                const [startX, startY] = connector.path.params;

                expect(Math.hypot(startX - centreX, startY - centreY)).toBeCloseTo(radius);
                expect(startX).toBeLessThanOrEqual(centreX);
                expect(startY).toBeGreaterThanOrEqual(centreY + radius * Math.SQRT1_2 - 1e-6);
                expect(startY).toBeLessThanOrEqual(centreY + radius + 1e-6);
            }
        });

        it('defaults to square corners', async () => {
            chart = deproxy(AgCharts.create(buildOptions()));
            await waitForChartStability(chart);

            const rects = segmentRects(chart);
            expect(rects).toHaveLength(4);
            for (const rect of rects) {
                expect(rect.topLeftCornerRadius).toBe(0);
                expect(rect.topRightCornerRadius).toBe(0);
                expect(rect.bottomRightCornerRadius).toBe(0);
                expect(rect.bottomLeftCornerRadius).toBe(0);
            }

            for (const connector of dropOffConnectors(chart)) {
                expect(connector.startCornerRadius).toBe(0);
                expect(connector.endCornerRadius).toBe(0);
            }
        });

        it('rounds every segment in the horizontal direction too', async () => {
            chart = deproxy(AgCharts.create(buildOptions(16, 'horizontal')));
            await waitForChartStability(chart);

            const rects = segmentRects(chart);
            expect(rects).toHaveLength(4);
            for (const rect of rects) {
                expect(rect.topLeftCornerRadius).toBe(16);
                expect(rect.bottomRightCornerRadius).toBe(16);
            }

            const connectors = dropOffConnectors(chart);
            expect(connectors).toHaveLength(3);
            for (const connector of connectors) {
                expect(connector.capsAlongX).toBe(false);
                expect(connector.startCornerRadius).toBe(16);
                expect(connector.endCornerRadius).toBe(16);
            }

            await compare();
        });
    });

    describe('stageLabel placement under RTL', () => {
        // Stage labels are the category axis' labels, so their side is the axis position the funnel
        // theme derives from `stageLabel.placement`.
        const buildOptions = ({
            enableRtl,
            placement,
            direction,
            theme,
        }: {
            enableRtl: boolean;
            placement?: 'before' | 'after';
            direction?: 'horizontal' | 'vertical';
            theme?: AgChartOptions['theme'];
        }): AgChartOptions => {
            const options: AgChartOptions = {
                enableRtl,
                theme,
                data: [
                    { group: 'Qualify', value: 7910 },
                    { group: 'Develop', value: 8170 },
                    { group: 'Propose', value: 7260 },
                    { group: 'Close', value: 4460 },
                ],
                series: [
                    {
                        type: 'funnel',
                        stageKey: 'group',
                        valueKey: 'value',
                        direction,
                        stageLabel: placement == null ? undefined : { placement },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);
            return options;
        };

        const axisPosition = async (options: AgChartOptions, direction: 'x' | 'y') => {
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            return chart.axes[direction].position;
        };

        it.each([
            { enableRtl: false, placement: 'before' as const, expected: 'left' },
            { enableRtl: false, placement: 'after' as const, expected: 'right' },
            { enableRtl: true, placement: 'before' as const, expected: 'right' },
            { enableRtl: true, placement: 'after' as const, expected: 'left' },
            { enableRtl: true, placement: undefined, expected: 'right' },
        ])('places the stage labels $expected for placement=$placement, enableRtl=$enableRtl', async (testCase) => {
            const { enableRtl, placement, expected } = testCase;
            expect(await axisPosition(buildOptions({ enableRtl, placement }), 'y')).toBe(expected);
        });

        it('leaves the horizontal direction unmirrored', async () => {
            const options = buildOptions({ enableRtl: true, placement: 'before', direction: 'horizontal' });
            expect(await axisPosition(options, 'x')).toBe('top');
        });

        it('renders the stage labels on the mirrored side', async () => {
            const options = buildOptions({ enableRtl: true, placement: 'before' });
            options.data = [
                { group: 'Qualification stage', value: 7910 },
                { group: 'Development stage', value: 8170 },
                { group: 'Proposal stage', value: 7260 },
                { group: 'Closing stage', value: 4460 },
            ];

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            await compare();
        });

        it('mirrors a theme-set placement too', async () => {
            const theme = { overrides: { funnel: { series: { stageLabel: { placement: 'after' as const } } } } };
            expect(await axisPosition(buildOptions({ enableRtl: true, theme }), 'y')).toBe('left');
        });
    });

    describe('animation', () => {
        const frames = spyOnAnimationFrames();

        const DATA = [
            { group: 'Qualify', value: 7910 },
            { group: 'Develop', value: 8170 },
            { group: 'Propose', value: 7260 },
            { group: 'Close', value: 4460 },
        ];
        const UPDATED = [
            { group: 'Qualify', value: 9500 },
            { group: 'Develop', value: 5000 },
            { group: 'Propose', value: 7260 },
            { group: 'Close', value: 4460 },
        ];

        const animated = (data: object[]): AgChartOptions =>
            prepareEnterpriseTestOptions({
                animation: { enabled: true },
                data,
                series: [{ type: 'funnel', stageKey: 'group', valueKey: 'value' }],
                legend: { enabled: true },
            });

        const isLabelKey = (key: string) => /^series\[0\]\/labels\/text\[/.test(key);
        const expectLabelsStartHidden = (frame0: SceneGeometrySample) => {
            const opacities = funnelLabelOpacities(frame0, isLabelKey);
            expect(opacities.length, 'labels present at frame 0').toBeGreaterThan(0);
            expect(Math.max(...opacities), 'labels hidden at frame 0').toBeLessThanOrEqual(0.01);
        };

        it('initial load: bars grow from the midpoint, connectors fan out and labels fade in', async () => {
            chart = deproxy(AgCharts.create(animated(DATA)));
            const sampler = createSceneGeometrySampler(chart);
            const trajectory = await frames.captureAnimationFrames(chart, sampler);
            await frames.runToEnd(chart);

            // Anti-vacuity: every bar starts collapsed and every label invisible.
            for (const [key, props] of trajectory[0]) {
                if (/^series\[0\]\/rect\[/.test(key)) {
                    expect(props.width, `${key} width at frame 0`).toBeLessThanOrEqual(0.5);
                }
            }
            expectLabelsStartHidden(trajectory[0]);

            expectSceneTrajectory(trajectory, {
                'series[0]/rect[*]': {
                    width: { during: 'initial', expect: ['increases', 'progresses', 'bounded'] },
                    x: { during: 'initial', expect: ['decreases', 'bounded'] },
                },
                'series[0]/path[]': funnelPathReveal('initial'),
                'series[0]/path[#2]': funnelPathReveal('initial'),
                'series[0]/path[#3]': funnelPathReveal('initial'),
                'series[0]/labels/text[*]': { opacity: funnelLabelFadeIn },
            });
        });

        // captureSnap because the connector snap trips captureUpdate's whole-scene start anchor.
        it('data update: bars tween to the new values while labels re-fade', async () => {
            const proxy = AgCharts.create(animated(DATA));
            chart = deproxy(proxy);
            const sampler = createSceneGeometrySampler(chart);
            const { trajectory, before, after } = await frames.captureSnap(chart, sampler, () =>
                proxy.updateDelta({ data: UPDATED })
            );

            const develop = 'series[0]/rect[Develop]';
            expect(Math.abs(after.get(develop)!.width - before.get(develop)!.width)).toBeGreaterThan(50);
            expectLabelsStartHidden(trajectory[0]);

            expectSceneTrajectory(trajectory, {
                'series[0]/rect[*]': {
                    width: { during: 'update', expect: ['monotonic', 'bounded'] },
                    x: { during: 'update', expect: ['bounded'] },
                },
                'series[0]/labels/text[*]': { opacity: funnelLabelFadeIn },
                'series[0]/path[]': 'constant',
                'series[0]/path[#2]': 'constant',
                'series[0]/path[#3]': 'constant',
                // The axis tick reflow is incidental to the bar animation under test.
                'axis[left]/*': 'any',
                'axis[bottom]/*': 'any',
            });
        });

        it('animated endpoints match a static render (initial load + data update)', async () => {
            const opts = animated(DATA);
            chart = AgCharts.create(opts);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, opts, animated(UPDATED));
        });
    });
});
