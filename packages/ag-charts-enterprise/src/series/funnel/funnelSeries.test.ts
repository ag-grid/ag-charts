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

import {
    funnelLabelFadeIn,
    funnelLabelOpacities,
    funnelPathReveal,
    prepareEnterpriseTestOptions,
    renderEnterpriseChartImage,
} from '../../test/utils';

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
            // Returns a highlighted node
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

        // Initial load: each bar expands from its midpoint along the value axis (width grows, near edge
        // recedes), the connector fan opens out (funnelPathReveal), and the labels fade in — the shared
        // BaseFunnelSeries animation reused across the funnel-family suites.
        it('initial load: bars grow from the midpoint, connectors fan out and labels fade in', async () => {
            chart = deproxy(AgCharts.create(animated(DATA)));
            const sampler = createSceneGeometrySampler(chart);
            const trajectory = await frames.captureAnimationFrames(chart, sampler);
            await frames.runToEnd(chart);

            // Anti-vacuity: every bar starts collapsed to a zero-width line, every label invisible.
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

        // Data update: every bar tweens its width to the new value during the `update` phase and the
        // labels re-fade; the connectors snap to their new positions on the first frame (base halts the
        // connector motion on a waiting update). captureSnap because that connector snap trips
        // captureUpdate's whole-scene start anchor.
        it('data update: bars tween to the new values while labels re-fade', async () => {
            const proxy = AgCharts.create(animated(DATA));
            chart = deproxy(proxy);
            const sampler = createSceneGeometrySampler(chart);
            const { trajectory, before, after } = await frames.captureSnap(chart, sampler, () =>
                proxy.updateDelta({ data: UPDATED })
            );

            // Anti-vacuity: a named bar's width genuinely changes end-to-end, and labels re-fade from 0.
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
                // The category axis redraws its tick lines as the bars revalue; that reflow is incidental
                // to the bar animation under test (the endpoint guard covers its settled pixels).
                'axis[left]/*': 'any',
                'axis[bottom]/*': 'any',
            });
        });

        // Pixel endpoint guard: the animated reveal and the data update must each settle at exactly the
        // pixels a snapped render of the same options produces.
        it('animated endpoints match a static render (initial load + data update)', async () => {
            const opts = animated(DATA);
            chart = AgCharts.create(opts);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, opts, animated(UPDATED));
        });
    });
});
