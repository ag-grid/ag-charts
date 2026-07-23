import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    type AgCartesianChartOptions,
    type AgChartOptions,
    AgCharts,
    type AgWaterfallSeriesLabelPlacement,
    type AgWaterfallSeriesOptions,
    type WaterfallSeriesTotalMeta,
} from 'ag-charts-community';
import {
    BIG,
    IMAGE_SNAPSHOT_DEFAULTS,
    NEG_BIG,
    type PhasedPropertyExpectation,
    type SceneGeometrySample,
    type SceneNodeExpectation,
    type TrajectoryExpectation,
    compareImageSnapshot,
    createSceneGeometrySampler,
    deproxy,
    expectAnimatedEndpointsMatchStatic,
    expectPixelIdenticalAcrossMagnitude,
    expectProgresses,
    expectSceneTrajectory,
    expectWarningsCalls,
    hoverAction,
    magnitudePair,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    stripAxes,
    waitForChartStability,
} from 'ag-charts-community-test';

import { createEnterpriseChart, prepareEnterpriseTestOptions, renderEnterpriseChartImage } from '../../test/utils';
import type { WaterfallSeries } from './waterfallSeries';

describe('WaterfallSeries', () => {
    setupMockConsole();

    let chart: any;
    const ctx = setupMockCanvas();

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const TOTALS_META_DATA: WaterfallSeriesTotalMeta[] = [
        { totalType: 'subtotal', index: 2, axisLabel: 'Subtotal 1' },
        { totalType: 'subtotal', index: 5, axisLabel: 'Subtotal 2' },
        { totalType: 'subtotal', index: 7, axisLabel: 'Subtotal 3' },
        { totalType: 'total', index: 8, axisLabel: 'Total' },
    ];

    const CONTINUOUS_DATA = [
        { year: new Date(2020, 0, 1), spending: 10 },
        { year: new Date(2021, 0, 1), spending: 20 },
        { year: new Date(2022, 0, 1), spending: 30 },
        { year: new Date(2024, 0, 1), spending: -20 },
        { year: new Date(2025, 0, 1), spending: -30 },
        { year: new Date(2026, 0, 1), spending: 40 },
        { year: new Date(2028, 0, 1), spending: -30 },
        { year: new Date(2029, 0, 1), spending: 40 },
        { year: new Date(2030, 0, 1), spending: 50 },
    ];

    const DATA_WITH_MISSING_INVALID_VALUES = [
        { year: '2020', spending: 10 },
        { year: '2021' },
        { year: '2022', spending: 30 },
        { year: '2024', spending: -80 },
        { year: '2025', spending: '-30' },
        { year: '2026', spending: 40 },
        { year: '2028', spending: -30 },
        { year: '2029', spending: 40 },
        { year: '2031', spending: [50] },
    ];

    const WATERFALL_COLUMN_OPTIONS: AgCartesianChartOptions = {
        data: [
            { year: '2020', spending: 10 },
            { year: '2021', spending: 20 },
            { year: '2022', spending: 30 },
            { year: '2023', spending: -20 },
            { year: '2024', spending: -30 },
            { year: '2025', spending: 40 },
            { year: '2026', spending: -30 },
            { year: '2027', spending: 40 },
            { year: '2028', spending: 50 },
        ],
        series: [
            {
                type: 'waterfall',
                xKey: 'year',
                yKey: 'spending',
                item: {
                    total: {
                        label: {
                            enabled: true,
                            placement: 'inside-center',
                        },
                    },
                    positive: {
                        label: {
                            enabled: true,
                            placement: 'inside-center',
                        },
                        fill: '#91CC75',
                        name: 'Revenue',
                    },
                    negative: {
                        label: {
                            enabled: true,
                            placement: 'inside-center',
                        },
                        fill: '#D21E75',
                        name: 'Product Cost',
                    },
                },
            },
        ],
        legend: {
            enabled: true,
        },
    };

    const compare = async (options = IMAGE_SNAPSHOT_DEFAULTS) => {
        await compareImageSnapshot(chart, ctx, options);
    };

    function switchSeriesType<T extends AgChartOptions>(opts: T, direction: 'horizontal' | 'vertical'): T {
        return {
            ...opts,
            series: opts['series']?.map((s) => ({
                ...s,
                direction,
            })),
        };
    }

    it('preserves bigint value precision in the data label and formatter callback (AG-16608)', async () => {
        // The raw value must reach the label text and label-formatter `value` un-narrowed; a bigint
        // beyond 2^53 would otherwise be float64-rounded in both.
        const BIG_VALUE = 9_007_199_254_740_993n; // Number()-rounds to ...992
        let captured: unknown;
        const options: AgCartesianChartOptions = {
            data: [{ type: 'Revenue', value: BIG_VALUE }],
            series: [
                {
                    type: 'waterfall',
                    xKey: 'type',
                    yKey: 'value',
                    item: {
                        positive: {
                            label: {
                                enabled: true,
                                formatter: (params: any) => {
                                    captured = params.value;
                                    return String(params.value);
                                },
                            },
                        },
                    },
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);

        expect(typeof captured).toBe('bigint');
        expect(captured).toBe(BIG_VALUE);
    });

    describe('totalValue (AG-17564)', () => {
        // Subtotal after B: cumulative 100 + 50 = 150. Total after D: cumulative 100 + 50 - 30 + 80 = 200.
        const SUBTOTAL_VALUE = 150;
        const TOTAL_VALUE = 200;
        const totalValueOptions = (extra?: Partial<AgWaterfallSeriesOptions>): AgCartesianChartOptions => ({
            data: [
                { type: 'A', value: 100 },
                { type: 'B', value: 50 },
                { type: 'C', value: -30 },
                { type: 'D', value: 80 },
            ],
            series: [
                {
                    type: 'waterfall',
                    xKey: 'type',
                    yKey: 'value',
                    totals: [
                        { totalType: 'subtotal', index: 1, axisLabel: 'Sub' },
                        { totalType: 'total', index: 3, axisLabel: 'Total' },
                    ],
                    ...extra,
                },
            ],
        });

        const seriesOf = (c: any) => deproxy(c).series[0] as any;
        const nodeOfType = (c: any, itemType: string) =>
            seriesOf(c)
                .getNodeData()
                .find((n: any) => n.itemType === itemType);

        it('passes totalValue to the label formatter for total/subtotal and undefined otherwise', async () => {
            const captured: { itemType: string; totalValue: unknown }[] = [];
            const formatter = (params: any) => {
                captured.push({ itemType: params.itemType, totalValue: params.totalValue });
                return String(params.value);
            };
            const label = { enabled: true, formatter };
            const options = totalValueOptions({
                item: { positive: { label }, negative: { label }, total: { label } },
            });
            prepareEnterpriseTestOptions(options as any);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            for (const entry of captured.filter((e) => e.itemType === 'positive' || e.itemType === 'negative')) {
                expect(entry.totalValue).toBeUndefined();
            }
            expect(captured.find((e) => e.itemType === 'subtotal')?.totalValue).toBe(SUBTOTAL_VALUE);
            expect(captured.find((e) => e.itemType === 'total')?.totalValue).toBe(TOTAL_VALUE);
        });

        it('passes totalValue to the tooltip renderer for total/subtotal and undefined otherwise', async () => {
            const renderer = vi.fn((_params: any) => ({}));
            const options = totalValueOptions({ tooltip: { renderer } });
            prepareEnterpriseTestOptions(options as any);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const series = seriesOf(chart);
            const captured = new Map<string, unknown>();
            for (const node of series.getNodeData()) {
                renderer.mockClear();
                series.getTooltipContent(node.datumIndex);
                captured.set(node.itemType, renderer.mock.calls[0][0].totalValue);
            }

            expect(captured.get('positive')).toBeUndefined();
            expect(captured.get('negative')).toBeUndefined();
            expect(captured.get('subtotal')).toBe(SUBTOTAL_VALUE);
            expect(captured.get('total')).toBe(TOTAL_VALUE);
        });

        it('exposes totalValue on the seriesNodeClick event for total/subtotal and undefined otherwise', async () => {
            const seriesNodeClick = vi.fn();
            const options = totalValueOptions();
            (options as AgChartOptions).listeners = { seriesNodeClick };
            prepareEnterpriseTestOptions(options as any);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const series = seriesOf(chart);
            series.fireNodeClickEvent(new Event('click'), nodeOfType(chart, 'subtotal'));
            series.fireNodeClickEvent(new Event('click'), nodeOfType(chart, 'positive'));

            expect(seriesNodeClick).toHaveBeenCalledTimes(2);
            expect(seriesNodeClick.mock.calls[0][0].totalValue).toBe(SUBTOTAL_VALUE);
            expect(seriesNodeClick.mock.calls[1][0].totalValue).toBeUndefined();
        });

        it('computes each subtotal totalValue relative to the previous subtotal, not the absolute total', async () => {
            // Two subtotals: 1st after A,B (segment 150, absolute 150 — coincide); 2nd after C,D
            // (absolute cumulative 200, segment since the 1st subtotal 50). totalValue must be the
            // segment the bar represents (50), matching the rendered value, not the absolute total (200).
            const options = totalValueOptions({
                totals: [
                    { totalType: 'subtotal', index: 1, axisLabel: 'Sub 1' },
                    { totalType: 'subtotal', index: 3, axisLabel: 'Sub 2' },
                ],
            });
            prepareEnterpriseTestOptions(options as any);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const subtotals = seriesOf(chart)
                .getNodeData()
                .filter((n: any) => n.itemType === 'subtotal');

            expect(subtotals).toHaveLength(2);
            expect(subtotals[0].totalValue).toBe(150);
            expect(subtotals[0].totalValue).toBe(subtotals[0].yValue);
            expect(subtotals[1].totalValue).toBe(50);
            expect(subtotals[1].totalValue).toBe(subtotals[1].yValue);
            expect(subtotals[1].totalValue).not.toBe(200);
        });
    });

    it('applies a per-item label itemStyler without crashing (AG-17598)', async () => {
        const positiveStyler = vi.fn(() => ({ color: 'red' }));
        const negativeStyler = vi.fn(() => ({ color: 'blue' }));
        const totalStyler = vi.fn(() => ({ color: 'green' }));
        const options: AgCartesianChartOptions = {
            data: [
                { type: 'A', value: 100 },
                { type: 'B', value: -30 },
                { type: 'C', value: 80 },
            ],
            series: [
                {
                    type: 'waterfall',
                    xKey: 'type',
                    yKey: 'value',
                    totals: [{ totalType: 'total', index: 2, axisLabel: 'Total' }],
                    item: {
                        positive: { label: { enabled: true, itemStyler: positiveStyler } },
                        negative: { label: { enabled: true, itemStyler: negativeStyler } },
                        total: { label: { enabled: true, itemStyler: totalStyler } },
                    },
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);

        expect(positiveStyler).toHaveBeenCalled();
        expect(negativeStyler).toHaveBeenCalled();
        expect(totalStyler).toHaveBeenCalled();
    });

    it(`should render a waterfall chart as expected`, async () => {
        const options: AgChartOptions = { ...WATERFALL_COLUMN_OPTIONS };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal waterfall chart as expected`, async () => {
        const options: AgChartOptions = { ...switchSeriesType(WATERFALL_COLUMN_OPTIONS, 'horizontal') };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a waterfall chart with total and subtotal columns`, async () => {
        const WATERFALL_COLUMN_SERIES_OPTIONS = WATERFALL_COLUMN_OPTIONS.series! as AgWaterfallSeriesOptions[];
        const options: AgCartesianChartOptions = {
            ...WATERFALL_COLUMN_OPTIONS,
            series: [{ ...WATERFALL_COLUMN_SERIES_OPTIONS[0], totals: TOTALS_META_DATA }],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a waterfall chart with corner radius`, async () => {
        const options: AgChartOptions = {
            theme: {
                overrides: {
                    waterfall: {
                        series: {
                            item: {
                                positive: {
                                    cornerRadius: 10,
                                },
                                negative: {
                                    cornerRadius: 10,
                                },
                                total: {
                                    cornerRadius: 10,
                                },
                            },
                        },
                    },
                },
            },
            ...WATERFALL_COLUMN_OPTIONS,
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a waterfall chart with a time x-axis`, async () => {
        const options: AgChartOptions = {
            ...WATERFALL_COLUMN_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: {
                y: {
                    position: 'left',
                    type: 'number',
                },
                x: {
                    position: 'bottom',
                    type: 'time',
                    nice: false,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a waterfall chart with a reversed time x-axis`, async () => {
        const options: AgChartOptions = {
            ...WATERFALL_COLUMN_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: {
                x: {
                    position: 'left',
                    type: 'number',
                },
                y: {
                    position: 'bottom',
                    type: 'time',
                    reverse: true,
                    nice: false,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal waterfall chart with a time y-axis`, async () => {
        const options: AgChartOptions = {
            ...switchSeriesType(WATERFALL_COLUMN_OPTIONS, 'horizontal'),
            data: CONTINUOUS_DATA,
            axes: {
                x: {
                    position: 'bottom',
                    type: 'number',
                },
                y: {
                    position: 'left',
                    type: 'time',
                    nice: false,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal waterfall chart with a reversed time y-axis`, async () => {
        const options: AgChartOptions = {
            ...switchSeriesType(WATERFALL_COLUMN_OPTIONS, 'horizontal'),
            data: CONTINUOUS_DATA,
            axes: {
                x: {
                    position: 'bottom',
                    type: 'number',
                },
                y: {
                    position: 'left',
                    type: 'time',
                    reverse: true,
                    nice: false,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a waterfall chart with reversed axes`, async () => {
        const WATERFALL_COLUMN_SERIES_OPTIONS = WATERFALL_COLUMN_OPTIONS.series as AgWaterfallSeriesOptions[];
        const options: AgChartOptions = {
            ...WATERFALL_COLUMN_OPTIONS,
            series: [{ ...WATERFALL_COLUMN_SERIES_OPTIONS[0], totals: TOTALS_META_DATA }],
            axes: {
                x: {
                    type: 'category',
                    position: 'bottom',
                    reverse: true,
                },
                y: {
                    type: 'number',
                    position: 'left',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal waterfall chart with reversed axes`, async () => {
        const WATERFALL_BAR_OPTIONS = switchSeriesType(WATERFALL_COLUMN_OPTIONS, 'horizontal');
        const WATERFALL_BAR_SERIES_OPTIONS = WATERFALL_BAR_OPTIONS.series?.[0] as AgWaterfallSeriesOptions;
        const options: AgChartOptions = {
            ...WATERFALL_BAR_OPTIONS,
            series: [{ ...WATERFALL_BAR_SERIES_OPTIONS, totals: TOTALS_META_DATA }],
            axes: {
                y: {
                    type: 'category',
                    position: 'left',
                    reverse: true,
                },
                x: {
                    type: 'number',
                    position: 'bottom',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal waterfall chart with total and subtotal bars`, async () => {
        const WATERFALL_BAR_OPTIONS = switchSeriesType(WATERFALL_COLUMN_OPTIONS, 'horizontal');
        const WATERFALL_BAR_SERIES_OPTIONS = WATERFALL_BAR_OPTIONS.series?.[0] as AgWaterfallSeriesOptions;
        const options: AgChartOptions = {
            ...WATERFALL_BAR_OPTIONS,
            series: [{ ...WATERFALL_BAR_SERIES_OPTIONS, totals: TOTALS_META_DATA }],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a waterfall chart with missing and invalid values`, async () => {
        const WATERFALL_COLUMN_SERIES_OPTIONS = WATERFALL_COLUMN_OPTIONS.series as AgWaterfallSeriesOptions[];
        const options: AgChartOptions = {
            ...WATERFALL_COLUMN_OPTIONS,
            data: DATA_WITH_MISSING_INVALID_VALUES,
            series: [{ ...WATERFALL_COLUMN_SERIES_OPTIONS[0], totals: TOTALS_META_DATA }],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();

        expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [string] for [WaterfallSeries-1 / yRaw] ignored:",
    "[-30]",
  ],
  [
    "AG Charts - invalid value of type [object] for [WaterfallSeries-1 / yRaw] ignored:",
    "[50]",
  ],
]
`);
    });

    it(`should render a horizontal waterfall chart with missing and invalid values`, async () => {
        const WATERFALL_BAR_OPTIONS = switchSeriesType(WATERFALL_COLUMN_OPTIONS, 'horizontal');
        const WATERFALL_BAR_SERIES_OPTIONS = WATERFALL_BAR_OPTIONS.series?.[0] as AgWaterfallSeriesOptions;
        const options: AgChartOptions = {
            ...WATERFALL_BAR_OPTIONS,
            data: DATA_WITH_MISSING_INVALID_VALUES,
            series: [{ ...WATERFALL_BAR_SERIES_OPTIONS, totals: TOTALS_META_DATA }],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();

        expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [string] for [WaterfallSeries-1 / yRaw] ignored:",
    "[-30]",
  ],
  [
    "AG Charts - invalid value of type [object] for [WaterfallSeries-1 / yRaw] ignored:",
    "[50]",
  ],
]
`);
    });

    // Initial-load animation is covered by the `animation -test page actions` block below
    // (`initial load (vertical|horizontal): bars and the connector reveal from the baseline`).

    // Frame-trajectory coverage for waterfall animation, replacing the legacy per-ratio image
    // snapshots. On initial load both the value bars (Rect) and the connector line (a Path, keyed
    // `series[0]/path[stroke]`) reveal together from a collapsed baseline via `animateEmptyUpdateReady`.
    // Waterfall overrides no waiting-update hook, so a later data change SNAPS to its end state on the
    // first frame (as candlestick does). The endpoint guards pin the settled pixels the deleted
    // 0%/100% snapshots used to.
    describe('animation -test page actions', () => {
        const frames = spyOnAnimationFrames();

        const DATA = [
            { type: 'A', value: 30 },
            { type: 'B', value: -20 },
            { type: 'C', value: 40 },
            { type: 'D', value: -10 },
        ];

        // A pinned value axis keeps every mutation below provably non-rescaling: only the marks move,
        // so a reflow or a value change is the series animation, never a rescale.
        const options = (direction: 'horizontal' | 'vertical', data: object[] = DATA): AgCartesianChartOptions => {
            const valueAxis = { type: 'number' as const, min: -20, max: 80 };
            const catAxis = { type: 'category' as const };
            return prepareEnterpriseTestOptions({
                data,
                series: [{ type: 'waterfall', direction, xKey: 'type', yKey: 'value' }],
                axes:
                    direction === 'vertical'
                        ? { x: { ...catAxis, position: 'bottom' }, y: { ...valueAxis, position: 'left' } }
                        : { y: { ...catAxis, position: 'left' }, x: { ...valueAxis, position: 'bottom' } },
            }) as AgCartesianChartOptions;
        };

        // The reveal grows along the value axis (height when vertical, width when horizontal) while the
        // band axis holds. Naming the dimension per-direction keeps the initial-load specs symmetric.
        const valueDim = (direction: 'horizontal' | 'vertical') => (direction === 'vertical' ? 'height' : 'width');
        const bandDim = (direction: 'horizontal' | 'vertical') => (direction === 'vertical' ? 'width' : 'height');

        const phased = (
            during: string | readonly string[],
            ...expectations: readonly TrajectoryExpectation[]
        ): PhasedPropertyExpectation => ({
            during: during as PhasedPropertyExpectation['during'],
            expect: expectations,
        });

        const rectKeys = (sample: SceneGeometrySample) =>
            [...sample.keys()].filter((k) => /^series\[0\]\/rect\[/.test(k));
        const rectCount = (sample: SceneGeometrySample) => rectKeys(sample).length;

        for (const direction of ['vertical', 'horizontal'] as const) {
            const value = valueDim(direction);
            const band = bandDim(direction);

            // Initial-load reveal: every bar and the connector line grow from the collapsed baseline
            // along the value axis while their bands hold. The near edge slides for floating/negative
            // bars, so it is `bounded` by its own endpoints, not pinned constant.
            it(`initial load (${direction}): bars and the connector reveal from the baseline`, async () => {
                chart = AgCharts.create(options(direction));
                const sampleScene = createSceneGeometrySampler(chart);
                const trajectory = await frames.captureAnimationFrames(chart, sampleScene);

                // Anti-vacuity: a named bar AND the connector genuinely start collapsed to ~0 extent (a
                // snap would already sit at full extent on frame 0, which `increases` then rejects).
                expect(trajectory[0].get('series[0]/rect[A]')![value]).toBeLessThanOrEqual(0.1);
                // The connector's per-subpath `top@n` props blink in and out as subpaths clip in, so it
                // can't pass through the constant-by-default scene spec; assert its value dimension grows
                // through real intermediate frames directly instead.
                const connector = trajectory.map((f) => f.get('series[0]/path[stroke]')![value]);
                expect(connector[0]).toBeLessThanOrEqual(0.1);
                expectProgresses(connector);
                expect(connector.at(-1)!).toBeGreaterThan(connector[0] + 20);

                expectSceneTrajectory(trajectory, {
                    'series[0]/rect[*]': {
                        [value]: phased('initial', 'increases', 'progresses', 'bounded'),
                        [band]: phased(['initial', 'trailing'], 'bounded'),
                        x: phased(['initial', 'trailing'], 'bounded'),
                        y: phased(['initial', 'trailing'], 'bounded'),
                    },
                    // Value dimension pinned directly above; exempt here so its blinking subpath tops
                    // don't trip the default-constant rule.
                    'series[0]/path[stroke]': 'any',
                });
            });
        }

        // Data mutations SNAP — waterfall overrides no waiting-update animation hook, so the whole
        // layout (revalued bars, reflowed bands, entrants and leavers) already sits at its settled state
        // on the first captured frame.
        const captureSnap = (opts: AgCartesianChartOptions, action: () => void) => {
            chart = AgCharts.create(opts);
            return frames.captureSnap(chart, createSceneGeometrySampler(chart), action);
        };

        // Every node must hold constant across the captured frames (the snap) — except the connector,
        // whose per-subpath `top@n` stations legitimately go non-finite where a segment has no crossing,
        // which the default constant check can't express. Its settled pixels ride the endpoint guards.
        const layoutSnaps: Record<string, SceneNodeExpectation> = { 'series[0]/path[stroke]': 'any' };

        it('update value: the changed bar snaps to its new height', async () => {
            const raised = DATA.map((d) => (d.type === 'A' ? { ...d, value: 50 } : d));
            const { before, trajectory, after } = await captureSnap(options('vertical'), () =>
                chart.updateDelta({ data: raised })
            );
            const bar = 'series[0]/rect[A]';
            // Anti-vacuity: bar A genuinely grew, and it is already at that taller height on frame 0.
            expect(after.get(bar)!.height).toBeGreaterThan(before.get(bar)!.height + 30);
            expect(Math.abs(trajectory[0].get(bar)!.height - after.get(bar)!.height)).toBeLessThan(1);
            expectSceneTrajectory(trajectory, layoutSnaps);
        });

        it('add data: a new bar appears instantly and the layout snaps', async () => {
            const { before, trajectory, after } = await captureSnap(options('vertical', DATA.slice(0, 3)), () =>
                chart.updateDelta({ data: DATA })
            );
            expect(rectCount(before)).toBe(3);
            expect(rectCount(after)).toBe(4);
            expect(rectCount(trajectory[0])).toBe(4);
            // The bands genuinely re-flowed: a survivor moved from its 3-band slot, yet it is already at
            // its new band on frame 0 (snapped, not sliding across).
            const survivor = 'series[0]/rect[C]';
            expect(Math.abs(after.get(survivor)!.x - before.get(survivor)!.x)).toBeGreaterThan(5);
            expect(Math.abs(trajectory[0].get(survivor)!.x - after.get(survivor)!.x)).toBeLessThan(1);
            expectSceneTrajectory(trajectory, layoutSnaps);
        });

        it('remove data: the last bar disappears instantly and the layout snaps', async () => {
            const { before, trajectory, after } = await captureSnap(options('vertical'), () =>
                chart.updateDelta({ data: DATA.slice(0, 3) })
            );
            expect(rectCount(before)).toBe(4);
            expect(rectCount(after)).toBe(3);
            expect(rectCount(trajectory[0])).toBe(3);
            const survivor = 'series[0]/rect[C]';
            expect(Math.abs(after.get(survivor)!.x - before.get(survivor)!.x)).toBeGreaterThan(5);
            expect(Math.abs(trajectory[0].get(survivor)!.x - after.get(survivor)!.x)).toBeLessThan(1);
            expectSceneTrajectory(trajectory, layoutSnaps);
        });

        // Pixel endpoint guards: the settled scene must match a static render of the same options
        // (replacing the deleted 0%/100% image snapshots). One chart per test — the mock canvas only
        // snapshots the first chart created.
        it('endpoints: update value settles at the static render', async () => {
            const before = options('vertical');
            chart = AgCharts.create(before);
            await expectAnimatedEndpointsMatchStatic(
                frames,
                () => ctx.snapshot(),
                chart,
                before,
                options(
                    'vertical',
                    DATA.map((d) => (d.type === 'A' ? { ...d, value: 50 } : d))
                )
            );
        });

        it('endpoints: add data settles at the static render', async () => {
            const before = options('vertical', DATA.slice(0, 3));
            chart = AgCharts.create(before);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, before, options('vertical'));
        });

        it('endpoints: remove data settles at the static render', async () => {
            const before = options('vertical');
            chart = AgCharts.create(before);
            await expectAnimatedEndpointsMatchStatic(
                frames,
                () => ctx.snapshot(),
                chart,
                before,
                options('vertical', DATA.slice(0, 3))
            );
        });
    });

    describe('gradient fill', () => {
        it('should render waterfall series with a default gradient fill', async () => {
            const options = {
                ...WATERFALL_COLUMN_OPTIONS,
                series: [
                    {
                        ...WATERFALL_COLUMN_OPTIONS.series![0],
                        item: {
                            positive: {
                                fill: {
                                    type: 'gradient',
                                },
                            },
                            negative: {
                                fill: {
                                    type: 'gradient',
                                },
                            },
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options as any);
            await compare();
        });

        it('should render waterfall series with a gradient fill', async () => {
            const options = {
                ...WATERFALL_COLUMN_OPTIONS,
                series: [
                    {
                        ...WATERFALL_COLUMN_OPTIONS.series![0],
                        item: {
                            positive: {
                                fill: {
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
                            },
                            negative: {
                                fill: {
                                    type: 'gradient',
                                    colorStops: [
                                        {
                                            color: 'red',
                                        },
                                        {
                                            color: 'white',
                                        },
                                    ],
                                },
                            },
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options as any);
            await compare();
        });
    });

    describe('AG-8290', () => {
        async function testCase(
            labelOpts: { placement: AgWaterfallSeriesLabelPlacement; spacing?: number },
            name: string
        ) {
            chart = AgCharts.create(
                prepareEnterpriseTestOptions({
                    data: [
                        { x: 'A', y: 185 },
                        { x: 'B', y: 145 },
                        { x: 'C', y: 134 },
                        { x: 'D', y: 55 },
                        { x: 'E', y: 34 },
                        { x: 'F', y: -155 },
                        { x: 'G', y: -112 },
                        { x: 'H', y: -165 },
                        { x: 'I', y: -163 },
                        { x: 'J', y: -91 },
                    ],
                    series: [
                        {
                            type: 'waterfall',
                            xKey: 'x',
                            yKey: 'y',
                            item: {
                                positive: { label: { ...labelOpts } },
                                negative: { label: { ...labelOpts } },
                                total: { label: { ...labelOpts } },
                            },
                            totals: [
                                { totalType: 'subtotal', index: 4, axisLabel: 'ABCDE' },
                                { totalType: 'subtotal', index: 9, axisLabel: 'FGHIJ' },
                                { totalType: 'total', index: 9, axisLabel: 'Total' },
                            ],
                        },
                    ],
                })
            );
            await compare({ failureThreshold: 0, failureThresholdType: 'percent', customSnapshotIdentifier: name });
        }
        describe('spacing sets the gap between the bar and the label', () => {
            test('inside-start', async () => {
                await testCase(
                    { placement: 'inside-start', spacing: 30 },
                    'AG-8290-waterfall-label-spacing-inside-start'
                );
            });
            test('inside-end', async () => {
                await testCase({ placement: 'inside-end', spacing: 30 }, 'AG-8290-waterfall-label-spacing-inside-end');
            });
            test('outside-start', async () => {
                await testCase(
                    { placement: 'outside-start', spacing: 30 },
                    'AG-8290-waterfall-label-spacing-outside-start'
                );
            });
            test('outside-end', async () => {
                await testCase(
                    { placement: 'outside-end', spacing: 30 },
                    'AG-8290-waterfall-label-spacing-outside-end'
                );
            });
        });
    });

    describe('itemStyler', () => {
        it('complex fills', async () => {
            const options = {
                ...WATERFALL_COLUMN_OPTIONS,
                series: [
                    {
                        ...WATERFALL_COLUMN_OPTIONS.series![0],
                        item: {
                            positive: {
                                itemStyler: () => {
                                    return { fill: { type: 'gradient' } };
                                },
                            },
                            negative: {
                                itemStyler: () => {
                                    return { fill: { type: 'pattern' } };
                                },
                            },
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options as any);
            await compare();
        });
    });

    describe('null category key', () => {
        const WATERFALL_NULL_CATEGORY_KEY_DATA = [
            { year: '2020', spending: 10 },
            { year: null, spending: 20 },
            { year: '2022', spending: -15 },
        ];

        const WATERFALL_NULL_CATEGORY_KEY_OPTIONS: AgCartesianChartOptions = {
            data: WATERFALL_NULL_CATEGORY_KEY_DATA,
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
            series: [
                {
                    type: 'waterfall',
                    xKey: 'year',
                    yKey: 'spending',
                },
            ],
        };

        it('should reject null category key with warning', async () => {
            const options: AgChartOptions = { ...WATERFALL_NULL_CATEGORY_KEY_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [WaterfallSeries-1 / xValue] ignored:",
    "[null]",
  ],
]
`);
            await compare();
        });

        it('should accept null category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...WATERFALL_NULL_CATEGORY_KEY_OPTIONS,
                series: [
                    {
                        ...WATERFALL_NULL_CATEGORY_KEY_OPTIONS.series![0],
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });
    });

    describe('undefined category key', () => {
        const WATERFALL_UNDEFINED_CATEGORY_KEY_DATA = [
            { year: '2020', spending: 10 },
            { year: undefined, spending: 20 },
            { year: '2022', spending: -15 },
        ];

        const WATERFALL_NULL_AND_UNDEFINED_KEYS_DATA = [
            { year: '2020', spending: 10 },
            { year: null, spending: 15 },
            { year: undefined, spending: 5 },
            { year: '2023', spending: -10 },
        ];

        const WATERFALL_UNDEFINED_CATEGORY_KEY_OPTIONS: AgCartesianChartOptions = {
            data: WATERFALL_UNDEFINED_CATEGORY_KEY_DATA,
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
            series: [
                {
                    type: 'waterfall',
                    xKey: 'year',
                    yKey: 'spending',
                },
            ],
        };

        const WATERFALL_NULL_AND_UNDEFINED_KEYS_OPTIONS: AgCartesianChartOptions = {
            data: WATERFALL_NULL_AND_UNDEFINED_KEYS_DATA,
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
            series: [
                {
                    type: 'waterfall',
                    xKey: 'year',
                    yKey: 'spending',
                },
            ],
        };

        it('should reject undefined category key with warning', async () => {
            const options: AgChartOptions = { ...WATERFALL_UNDEFINED_CATEGORY_KEY_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [undefined] for [WaterfallSeries-1 / xValue] ignored:",
    "[undefined]",
  ],
]
`);
            await compare();
        });

        it('should accept undefined category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...WATERFALL_UNDEFINED_CATEGORY_KEY_OPTIONS,
                series: [
                    {
                        ...WATERFALL_UNDEFINED_CATEGORY_KEY_OPTIONS.series![0],
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });

        it('should treat null and undefined as distinct categories when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...WATERFALL_NULL_AND_UNDEFINED_KEYS_OPTIONS,
                series: [
                    {
                        ...WATERFALL_NULL_AND_UNDEFINED_KEYS_OPTIONS.series![0],
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });
    });

    describe('CRT-1049: tooltip content for subtotal and total nodes', () => {
        const WATERFALL_TOTALS_OPTIONS: AgCartesianChartOptions = {
            data: [
                { year: '2020', spending: 10 },
                { year: '2021', spending: 20 },
                { year: '2022', spending: 30 },
                { year: '2023', spending: -20 },
                { year: '2024', spending: -30 },
                { year: '2025', spending: 40 },
                { year: '2026', spending: -30 },
                { year: '2027', spending: 40 },
                { year: '2028', spending: 50 },
            ],
            series: [
                {
                    type: 'waterfall',
                    xKey: 'year',
                    yKey: 'spending',
                    totals: [
                        { totalType: 'subtotal', index: 2, axisLabel: 'Subtotal 1' },
                        { totalType: 'subtotal', index: 5, axisLabel: 'Subtotal 2' },
                        { totalType: 'total', index: 8, axisLabel: 'Total' },
                    ],
                },
            ],
        };

        it('should return valid tooltip content for subtotal nodes', async () => {
            const options = { ...WATERFALL_TOTALS_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const series = chart.series[0] as WaterfallSeries;

            // Index 3 is the first subtotal (after data indices 0, 1, 2)
            const subtotalContent = series.getTooltipContent(3);
            expect(subtotalContent).toBeDefined();
            expect(subtotalContent?.type).toBe('structured');
            if (subtotalContent?.type === 'structured') {
                expect(subtotalContent.data?.[0].missing).not.toBe(true);
            }
        });

        it('should return valid tooltip content for total nodes', async () => {
            const options = { ...WATERFALL_TOTALS_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const series = chart.series[0] as WaterfallSeries;

            // Last index is the total node
            const nodeData = series['contextNodeData']?.nodeData;
            const totalIndex = nodeData ? nodeData.length - 1 : -1;
            const totalContent = series.getTooltipContent(totalIndex);
            expect(totalContent).toBeDefined();
            expect(totalContent?.type).toBe('structured');
            if (totalContent?.type === 'structured') {
                expect(totalContent.data?.[0].missing).not.toBe(true);
            }
        });

        it('should return valid tooltip content for regular data nodes', async () => {
            const options = { ...WATERFALL_TOTALS_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const series = chart.series[0] as WaterfallSeries;

            // Index 0 is the first regular data node
            const regularContent = series.getTooltipContent(0);
            expect(regularContent).toBeDefined();
            expect(regularContent?.type).toBe('structured');
            if (regularContent?.type === 'structured') {
                expect(regularContent.data?.[0].missing).not.toBe(true);
            }
        });

        it('should return non-missing tooltip content for all node types in sequence', async () => {
            const options = { ...WATERFALL_TOTALS_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const series = chart.series[0] as WaterfallSeries;
            const nodeData = series['contextNodeData']?.nodeData;
            expect(nodeData).toBeDefined();

            // Verify every node returns non-missing tooltip content
            for (let i = 0; i < nodeData!.length; i++) {
                const content = series.getTooltipContent(i);
                expect(content).toBeDefined();
                expect(content?.type).toBe('structured');
                if (content?.type === 'structured') {
                    expect(content.data?.[0].missing).not.toBe(true);
                }
            }
        });
    });

    describe('AG-17059: item-level tooltip.renderer', () => {
        const TOTALS_OPTIONS: AgCartesianChartOptions = {
            data: [
                { year: '2020', spending: 10 },
                { year: '2021', spending: -20 },
                { year: '2022', spending: 30 },
                { year: '2023', spending: 40 },
            ],
            series: [
                {
                    type: 'waterfall',
                    xKey: 'year',
                    yKey: 'spending',
                    totals: [{ totalType: 'subtotal', index: 1, axisLabel: 'Subtotal' }],
                },
            ],
        };

        async function hoverDatum(datumIndex: number): Promise<string> {
            const series = chart.series[0] as WaterfallSeries;
            const nodeData = series['contextNodeData']?.nodeData;
            const datum = nodeData?.[datumIndex];
            expect(datum).toBeDefined();
            const cx = datum!.x + datum!.width / 2;
            const cy = datum!.y + datum!.height / 2;
            await hoverAction(cx, cy)(chart);
            await waitForChartStability(chart);
            const el = chart.ctx.agDocument.body.getElementsByClassName('ag-charts-tooltip')[0] as
                | HTMLElement
                | undefined;
            const html = el?.innerHTML ?? '';
            expect(html).not.toBe('');
            return html;
        }

        it('invokes item.positive.tooltip.renderer for positive datums', async () => {
            const options: AgCartesianChartOptions = {
                ...TOTALS_OPTIONS,
                series: [
                    {
                        ...(TOTALS_OPTIONS.series![0] as AgWaterfallSeriesOptions),
                        item: { positive: { tooltip: { renderer: () => 'POSITIVE-ITEM' } } },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            expect(await hoverDatum(0)).toContain('POSITIVE-ITEM');
            expect(await hoverDatum(1)).not.toContain('POSITIVE-ITEM');
        });

        it('item-level renderer overrides series-level renderer when both are set', async () => {
            const options: AgCartesianChartOptions = {
                ...TOTALS_OPTIONS,
                series: [
                    {
                        ...(TOTALS_OPTIONS.series![0] as AgWaterfallSeriesOptions),
                        tooltip: { renderer: () => 'SERIES-LEVEL' },
                        item: { positive: { tooltip: { renderer: () => 'ITEM-LEVEL' } } },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const positiveHtml = await hoverDatum(0);
            expect(positiveHtml).toContain('ITEM-LEVEL');
            expect(positiveHtml).not.toContain('SERIES-LEVEL');

            expect(await hoverDatum(1)).toContain('SERIES-LEVEL');
        });

        it('subtotal datums use item.total.tooltip.renderer', async () => {
            const options: AgCartesianChartOptions = {
                ...TOTALS_OPTIONS,
                series: [
                    {
                        ...(TOTALS_OPTIONS.series![0] as AgWaterfallSeriesOptions),
                        item: { total: { tooltip: { renderer: () => 'TOTAL-ITEM' } } },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            expect(await hoverDatum(2)).toContain('TOTAL-ITEM');
            expect(await hoverDatum(0)).not.toContain('TOTAL-ITEM');
        });

        it('AG-10316 item-level renderer returning undefined falls through to default tooltip content', async () => {
            const options: AgCartesianChartOptions = {
                ...TOTALS_OPTIONS,
                series: [
                    {
                        ...(TOTALS_OPTIONS.series![0] as AgWaterfallSeriesOptions),
                        yName: 'Spending',
                        item: { positive: { tooltip: { renderer: () => undefined } } },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            // Returning undefined must fall through to the default structured tooltip
            // rather than rendering literal "undefined".
            const html = await hoverDatum(0);
            expect(html).not.toContain('undefined');
            expect(html).toContain('Spending');
        });
    });

    describe('AG-17484: synthetic datum, itemType and itemId for total/subtotal bars', () => {
        // Augmented order [2020, 2021, Sub, 2022, 2023, Total]: the synthetic subtotal/total consume
        // index slots, so real bars 2022/2023 sit at datumIndex 3/4.
        const DATA = [
            { year: '2020', spending: 10 },
            { year: '2021', spending: -20 },
            { year: '2022', spending: 30 },
            { year: '2023', spending: 40 },
        ];
        const TOTALS_OPTIONS: AgCartesianChartOptions = {
            data: DATA,
            series: [
                {
                    type: 'waterfall',
                    xKey: 'year',
                    yKey: 'spending',
                    totals: [
                        { totalType: 'subtotal', index: 1, axisLabel: 'Subtotal' },
                        { totalType: 'total', index: 3, axisLabel: 'Total' },
                    ],
                },
            ],
        };

        const createWaterfall = async (series: AgWaterfallSeriesOptions) => {
            const options: AgCartesianChartOptions = { ...TOTALS_OPTIONS, series: [series] };
            prepareEnterpriseTestOptions(options as any);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            return chart.series[0] as WaterfallSeries;
        };

        const getNodeData = (series: WaterfallSeries) => {
            const nodeData = series['contextNodeData']?.nodeData as
                | { itemType: string; datum: unknown; datumIndex: number; itemId?: string }[]
                | undefined;
            expect(nodeData).toBeDefined();
            return nodeData!;
        };

        it('AC1/AC3: tooltip.renderer receives datum=undefined for total/subtotal and the original datum for real bars', async () => {
            const params: Record<string, any> = {};
            const series = await createWaterfall({
                ...(TOTALS_OPTIONS.series![0] as AgWaterfallSeriesOptions),
                item: {
                    positive: { tooltip: { renderer: (p) => ((params.positive = p), 'P') } },
                    negative: { tooltip: { renderer: (p) => ((params.negative = p), 'N') } },
                    total: { tooltip: { renderer: (p) => ((params[p.itemType] = p), 'T') } },
                },
            });
            const nodeData = getNodeData(series);

            const indexOfType = (itemType: string) => nodeData.findIndex((n) => n.itemType === itemType);
            const positiveIndex = indexOfType('positive');
            const negativeIndex = indexOfType('negative');
            series.getTooltipContent(positiveIndex);
            series.getTooltipContent(negativeIndex);
            series.getTooltipContent(indexOfType('subtotal'));
            series.getTooltipContent(indexOfType('total'));

            expect(params.subtotal?.datum).toBeUndefined();
            expect(params.subtotal?.itemType).toBe('subtotal');
            expect(params.total?.datum).toBeUndefined();
            expect(params.total?.itemType).toBe('total');
            expect(params.positive?.datum).toEqual(DATA[0]);
            expect(params.negative?.datum).toEqual(DATA[1]);

            // itemId uses the stable getItemId resolution: totals fall back to their axisLabel,
            // real bars (no dataIdKey) fall back to their datumIndex.
            expect(params.subtotal?.itemId).toBe('Subtotal');
            expect(params.total?.itemId).toBe('Total');
            expect(params.positive?.itemId).toBe(positiveIndex);
            expect(params.negative?.itemId).toBe(negativeIndex);
        });

        it('AC1/AC3/AC5: itemStyler receives datum=undefined for synthetic bars and the original datum for real bars', async () => {
            const calls: { itemType: string; datum: unknown; itemId: unknown }[] = [];
            const styler = (p: any) => (calls.push({ itemType: p.itemType, datum: p.datum, itemId: p.itemId }), {});
            const series = await createWaterfall({
                ...(TOTALS_OPTIONS.series![0] as AgWaterfallSeriesOptions),
                item: {
                    positive: { itemStyler: styler },
                    negative: { itemStyler: styler },
                    total: { itemStyler: styler },
                },
            });
            getNodeData(series);

            const syntheticCalls = calls.filter((c) => c.itemType === 'total' || c.itemType === 'subtotal');
            const realCalls = calls.filter((c) => c.itemType === 'positive' || c.itemType === 'negative');
            expect(syntheticCalls.length).toBeGreaterThan(0);
            expect(realCalls.length).toBeGreaterThan(0);
            expect(syntheticCalls.every((c) => c.datum === undefined)).toBe(true);
            expect(realCalls.every((c) => c.datum != null && typeof c.datum === 'object')).toBe(true);

            // itemId uses the stable getItemId resolution: totals fall back to their axisLabel,
            // real bars (no dataIdKey) fall back to their numeric datumIndex.
            expect(calls.filter((c) => c.itemType === 'subtotal').every((c) => c.itemId === 'Subtotal')).toBe(true);
            expect(calls.filter((c) => c.itemType === 'total').every((c) => c.itemId === 'Total')).toBe(true);
            expect(realCalls.every((c) => typeof c.itemId === 'number')).toBe(true);
        });

        it('AC2: node datum is undefined for synthetic bars and the original object for real bars', async () => {
            const series = await createWaterfall(TOTALS_OPTIONS.series![0] as AgWaterfallSeriesOptions);
            const nodeData = getNodeData(series);

            // The nodeClick/nodeDoubleClick/activeChange event payload is built directly from
            // `node.datum` (SeriesNodeEvent), so asserting it here covers those surfaces.
            const byType = (itemType: string) => nodeData.filter((n) => n.itemType === itemType);
            expect(byType('subtotal').every((n) => n.datum === undefined)).toBe(true);
            expect(byType('total').every((n) => n.datum === undefined)).toBe(true);
            expect(byType('positive')[0]?.datum).toEqual(DATA[0]);
        });

        it('real-bar itemId is unset so it resolves via dataIdKey, then datumIndex', async () => {
            const series = await createWaterfall(TOTALS_OPTIONS.series![0] as AgWaterfallSeriesOptions);
            const nodeData = getNodeData(series);

            // Real bars carry no positional itemId, so getItemId falls back to datumIndex.
            const real = nodeData.find((n) => n.itemType === 'positive')!;
            expect(real.itemId).toBeUndefined();
            expect(series.findNodeDatum(real.datumIndex)).toBe(real);

            // Synthetic bars without a totals `itemId` fall back to their axisLabel.
            const subtotal = nodeData.find((n) => n.itemType === 'subtotal')!;
            expect(subtotal.itemId).toBe('Subtotal');
            expect(series.findNodeDatum('Subtotal')).toBe(subtotal);
        });

        it('issue 2: real-bar itemId resolves via dataIdKey and totals expose a user-supplied itemId', async () => {
            const options: AgCartesianChartOptions = {
                data: DATA,
                dataIdKey: 'year',
                series: [
                    {
                        type: 'waterfall',
                        xKey: 'year',
                        yKey: 'spending',
                        totals: [
                            { totalType: 'subtotal', index: 1, axisLabel: 'Subtotal', itemId: 'sub-1' },
                            { totalType: 'total', index: 3, axisLabel: 'Total' },
                        ],
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            const series = chart.series[0] as WaterfallSeries;
            const nodeData = getNodeData(series);

            // Real bar: itemId unset on the node, so the event/active itemId resolves via dataIdKey
            // (the `year` value) and round-trips through findNodeDatum.
            const real = nodeData.find((n) => n.datumIndex === 0)!;
            expect(real.itemId).toBeUndefined();
            expect(series.findNodeDatum('2020')).toBe(real);

            // Subtotal with a user-supplied itemId surfaces it on the node and round-trips.
            const subtotal = nodeData.find((n) => n.itemType === 'subtotal')!;
            expect(subtotal.itemId).toBe('sub-1');
            expect(series.findNodeDatum('sub-1')).toBe(subtotal);

            // Total without an itemId falls back to its axisLabel.
            const total = nodeData.find((n) => n.itemType === 'total')!;
            expect(total.itemId).toBe('Total');
            expect(series.findNodeDatum('Total')).toBe(total);
        });

        it('itemId distinguishes totals that share an axisLabel into separate bars', async () => {
            const options: AgCartesianChartOptions = {
                data: DATA,
                series: [
                    {
                        type: 'waterfall',
                        xKey: 'year',
                        yKey: 'spending',
                        totals: [
                            { totalType: 'subtotal', index: 1, axisLabel: 'Total', itemId: 'first' },
                            { totalType: 'total', index: 3, axisLabel: 'Total', itemId: 'second' },
                        ],
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            const series = chart.series[0] as WaterfallSeries;
            const nodeData = getNodeData(series) as ({ x: number } & ReturnType<typeof getNodeData>[number])[];

            // Both totals share the axisLabel 'Total' but carry distinct itemIds, so they remain two
            // separate bars rather than collapsing onto a single band.
            const first = nodeData.find((n) => n.itemId === 'first')!;
            const second = nodeData.find((n) => n.itemId === 'second')!;
            expect(first).toBeDefined();
            expect(second).toBeDefined();
            expect(first).not.toBe(second);
            expect(first.x).not.toBe(second.x);

            // Each resolves back to its own node via the user-supplied itemId.
            expect(series.findNodeDatum('first')).toBe(first);
            expect(series.findNodeDatum('second')).toBe(second);
        });

        it('issue 1: label formatter receives subtotal/total itemType distinctly', async () => {
            const seen: string[] = [];
            const label = { enabled: true, formatter: (p: any) => (seen.push(p.itemType), String(p.value)) };
            await createWaterfall({
                ...(TOTALS_OPTIONS.series![0] as AgWaterfallSeriesOptions),
                item: {
                    positive: { label },
                    negative: { label },
                    // The `total` bucket is shared by total and subtotal bars; the formatter must still
                    // receive their distinct itemType.
                    total: { label },
                },
            });

            expect(seen).toContain('subtotal');
            expect(seen).toContain('total');
            expect(seen).toContain('positive');
            expect(seen).toContain('negative');
        });

        it('issue 3: node click events carry itemType and itemId', async () => {
            const series = await createWaterfall(TOTALS_OPTIONS.series![0] as AgWaterfallSeriesOptions);
            const nodeData = series.getNodeData()!;
            const events: any[] = [];
            series.addEventListener('seriesNodeClick', (e) => events.push(e));

            const total = nodeData.find((n) => n.itemType === 'total')!;
            const real = nodeData.find((n) => n.itemType === 'positive')!;
            series.fireNodeClickEvent(new Event('click'), total);
            series.fireNodeClickEvent(new Event('click'), real);

            // The total bar's itemId falls back to its axisLabel; the real bar resolves via datumIndex.
            expect(events[0].itemType).toBe('total');
            expect(events[0].itemId).toBe('Total');
            expect(events[0].datum).toBeUndefined();
            expect(events[1].itemType).toBe('positive');
            expect(events[1].itemId).toBe(real.datumIndex);
            expect(events[1].datum).toEqual(DATA[0]);
        });

        it('issue 3: activeChange events carry itemType and itemId', async () => {
            const events: any[] = [];
            const options: AgCartesianChartOptions = {
                ...TOTALS_OPTIONS,
                listeners: { activeChange: (e) => events.push(e) },
            };
            prepareEnterpriseTestOptions(options as any);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            const series = chart.series[0] as WaterfallSeries;
            const total = series.getNodeData()!.find((n) => n.itemType === 'total')!;

            // activeManager.update is the canonical hover simulation; JSDOM canvas hit-testing is
            // stubbed so DOM events can't drive picking (testing.md). The activeItem itemId mirrors the
            // node's, which falls back to its axisLabel.
            chart.ctx.activeManager.update({ type: 'series-node', seriesId: series.id, itemId: total.itemId! }, total);

            const totalEvent = events.find((e) => e.itemType === 'total');
            expect(totalEvent).toBeDefined();
            expect(totalEvent.activeItem.itemId).toBe('Total');
            expect(totalEvent.datum).toBeUndefined();
        });

        it('highlighting a synthetic bar invokes its itemStyler with highlighted-item', async () => {
            // The item-highlight overlay must render for synthetic bars even though their datum is
            // undefined, otherwise the styler only ever sees the base-layer unhighlighted-item state.
            const calls: { itemType: string; highlightState: string }[] = [];
            const styler = (p: any) => (calls.push({ itemType: p.itemType, highlightState: p.highlightState }), {});
            const series = await createWaterfall({
                ...(TOTALS_OPTIONS.series![0] as AgWaterfallSeriesOptions),
                item: {
                    positive: { itemStyler: styler },
                    negative: { itemStyler: styler },
                    total: { itemStyler: styler },
                },
            });
            const total = getNodeData(series).find((n) => n.itemType === 'total')!;

            calls.length = 0;
            chart.ctx.highlightManager.updateHighlight(chart.id, total);
            await waitForChartStability(chart);

            const totalStates = new Set(calls.filter((c) => c.itemType === 'total').map((c) => c.highlightState));
            expect(totalStates.has('highlighted-item')).toBe(true);
        });
    });

    describe('bigint values (AG-16608)', () => {
        it('renders a plain waterfall series with out-of-safe-range bigint values', async () => {
            expect(
                await renderEnterpriseChartImage(ctx, {
                    data: [
                        { x: 'a', amount: BIG },
                        { x: 'b', amount: NEG_BIG },
                        { x: 'c', amount: BIG * 2n },
                    ],
                    series: [{ type: 'waterfall', xKey: 'x', yKey: 'amount' }],
                    axes: { x: { type: 'category' }, y: { type: 'number' } },
                })
            ).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });
    });

    describe('ISO datetime (AG-16654)', () => {
        it('renders a waterfall series with ISO-8601 datetime-string x values on a unit-time axis', async () => {
            expect(
                await renderEnterpriseChartImage(ctx, {
                    data: [
                        { time: '2024-01-15T09:00:00Z', amount: 12 },
                        { time: '2024-01-15T10:00:00Z', amount: -5 },
                        { time: '2024-01-15T11:00:00Z', amount: 8 },
                        { time: '2024-01-15T12:00:00Z', amount: -3 },
                    ],
                    series: [{ type: 'waterfall', xKey: 'time', yKey: 'amount' }],
                    axes: { x: { type: 'unit-time' }, y: { type: 'number' } },
                })
            ).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });
    });

    describe('rotated label per-side padding', () => {
        // A rotated (vertical) khaki-boxed label must float clear of the bar AND stay centred on it,
        // whatever the per-side padding. One chart per case keeps the mock-canvas text metrics reliable.
        const ROTATED_PADDINGS: Record<string, object> = {
            symmetric: { top: 0, bottom: 0, left: 10, right: 10 },
            'wide left': { top: 0, bottom: 0, left: 50, right: 10 },
            'wide right': { top: 0, bottom: 0, left: 10, right: 50 },
            'tall + asymmetric': { top: 40, bottom: 4, left: 50, right: 10 },
        };
        it.each(Object.entries(ROTATED_PADDINGS))(
            'renders a rotated outside-end label clear of and centred on the bar (%s padding)',
            async (_name, padding) => {
                expect(
                    await renderEnterpriseChartImage(ctx, {
                        data: [{ year: '2021', spending: 60 }],
                        legend: { enabled: false },
                        axes: { x: { type: 'category' }, y: { type: 'number', max: 100 } },
                        series: [
                            {
                                type: 'waterfall',
                                xKey: 'year',
                                yKey: 'spending',
                                item: {
                                    positive: {
                                        label: {
                                            enabled: true,
                                            placement: 'outside-end',
                                            orientation: 'vertical',
                                            fill: 'khaki',
                                            padding,
                                        },
                                    },
                                },
                            },
                        ],
                    })
                ).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
            }
        );
    });

    describe('bigint magnitude invariance (AG-16608)', () => {
        const amounts = (values: number[]) => (toValue: (v: number) => number | bigint) =>
            values.map((amount, i) => ({ x: `c${i}`, amount: toValue(amount) }));

        it('positions a plain waterfall series identically when scaled beyond Number.MAX_VALUE', async () => {
            await expectPixelIdenticalAcrossMagnitude(
                ctx,
                createEnterpriseChart,
                magnitudePair(
                    {
                        series: [{ type: 'waterfall', xKey: 'x', yKey: 'amount' }],
                        axes: stripAxes({ x: { type: 'category' }, y: { type: 'number', nice: false } }),
                    },
                    amounts([3, -2, 4])
                )
            );
        });
    });
});
