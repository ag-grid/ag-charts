import { afterEach, describe, expect, it } from 'vitest';

import {
    type AgCartesianChartOptions,
    type AgChartOptions,
    AgCharts,
    type AgRangeBarSeriesItemStylerParams,
    type AgRangeBarSeriesLabelPlacement,
    type AgRangeBarSeriesStyle,
    type AgRangeBarSeriesStylerParams,
} from 'ag-charts-community';
import {
    BIG,
    CATEGORY_CENTRE_GRIDLINE_AXES,
    HIGH_VOLUME_COUNT,
    HIGH_VOLUME_SIGNALS,
    IMAGE_SNAPSHOT_DEFAULTS,
    MIN_UNHIGHLIGHT_DELAY,
    type MockRangeBarStyler,
    NEG_BIG,
    type PhasedPropertyExpectation,
    STRIPPED_NUMBER_AXES,
    STRIPPED_UNIT_TIME_AXES,
    type SceneFrameInvariant,
    type SceneGeometrySample,
    type SceneNodeExpectation,
    type TrajectoryExpectation,
    compareImageSnapshot,
    createSceneGeometrySampler,
    deproxy,
    expectAnimatedEndpointsMatchStatic,
    expectBarCentresOnCategoryGridlines,
    expectPixelIdenticalAcrossMagnitude,
    expectProgresses,
    expectSceneTrajectory,
    expectWarningsCalls,
    hoverAction,
    isoEpochPair,
    magnitudePair,
    newFreezableMock,
    scaleToBigIntFinite,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    testLegendItemName,
    waitForChartStability,
} from 'ag-charts-community-test';
import { roundTo } from 'ag-charts-core';

import {
    createEnterpriseChart,
    mockCssVarColorSupport,
    prepareEnterpriseTestOptions,
    renderEnterpriseChartImage,
} from '../../test/utils';

describe('RangeBarSeries', () => {
    setupMockConsole();
    let chart: any;
    const ctx = setupMockCanvas();

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const CONTINUOUS_DATA = [
        {
            date: new Date(1996, 4, 11).getTime(),
            high: 1900,
            low: 900,
        },
        {
            date: new Date(1996, 4, 12).getTime(),
            high: 1345,
            low: 345,
        },
        {
            date: new Date(1996, 4, 13).getTime(),
            high: 1393,
            low: 393,
        },
        {
            date: new Date(1996, 4, 14).getTime(),
            high: 1108,
            low: -108,
        },
        {
            date: new Date(1996, 4, 15).getTime(),
            high: 1154,
            low: -154,
        },
        {
            date: new Date(1996, 4, 16).getTime(),
            high: 1135,
            low: 135,
        },
        {
            date: new Date(1996, 4, 17).getTime(),
            high: 1178,
            low: 178,
        },
        {
            date: new Date(1996, 4, 18).getTime(),
            high: 1286,
            low: 286,
        },
        {
            date: new Date(1996, 4, 19).getTime(),
            high: 1119,
            low: -119,
        },
        {
            date: new Date(1996, 4, 20).getTime(),
            high: 1361,
            low: -361,
        },
        {
            date: new Date(1996, 4, 21).getTime(),
            high: 1203,
            low: -203,
        },
    ];
    const CONTINUOUS_DATE_DATA = CONTINUOUS_DATA.map((d) => ({ ...d, date: new Date(d.date) }));
    const Y_DATE_DATA = [
        {
            department: 'Finance',
            low: new Date(2024, 5, 20), //.getTime(),
            high: new Date(2024, 6, 21), //.getTime(),
        },
        {
            department: 'Engineering',
            low: new Date(2024, 3, 20), //.getTime(),
            high: new Date(2024, 5, 21), //.getTime(),
        },
        {
            department: 'Marketing',
            low: new Date(2024, 6, 20), //.getTime(),
            high: new Date(2024, 7, 21), //.getTime(),
        },
        {
            department: 'Sales',
            low: new Date(2024, 4, 20), //.getTime(),
            high: new Date(2024, 10, 21), //.getTime(),
        },
    ];
    const RANGE_COLUMN_OPTIONS: AgCartesianChartOptions = {
        data: [
            {
                date: 'Jan',
                high: 5.2,
                low: -13.9,
            },
            {
                date: 'Feb',
                high: 10.6,
                low: -16.7,
            },
            {
                date: 'Mar',
                high: 11.6,
                low: -4.7,
            },
            {
                date: 'Apr',
                high: 16.8,
                low: -4.4,
            },
            {
                date: 'May',
                high: 27.2,
                low: -2.1,
            },
            {
                date: 'Jun',
                high: 29.4,
                low: 5.9,
            },
            {
                date: 'Jul',
                high: 29.1,
                low: 6.5,
            },
            {
                date: 'Aug',
                high: 25.4,
                low: 4.7,
            },
            {
                date: 'Sep',
                high: 21.6,
                low: 4.3,
            },
            {
                date: 'Oct',
                high: 15.1,
                low: -3.5,
            },
            {
                date: 'Nov',
                high: 12.5,
                low: -9.8,
            },
            {
                date: 'Dec',
                high: 8.4,
                low: -11.5,
            },
        ],
        series: [
            {
                type: 'range-bar',
                xKey: 'date',
                yLowKey: 'low',
                yHighKey: 'high',
                label: {
                    enabled: true,
                    formatter: ({ value }) => `${value}°C`,
                },
            },
        ],
    };
    const RANGE_Y_DATE_OPTIONS: AgCartesianChartOptions = {
        data: Y_DATE_DATA,
        series: [
            {
                type: 'range-bar',
                xKey: 'department',
                yLowKey: 'low',
                yHighKey: 'high',
            },
        ],
        axes: {
            y: { type: 'time', position: 'left' },
            x: { type: 'category', position: 'bottom' },
        },
    };

    const compare = async (options = IMAGE_SNAPSHOT_DEFAULTS) => {
        await compareImageSnapshot(chart, ctx, options);
    };

    function switchSeriesType<T extends AgCartesianChartOptions>(
        { axes, ...opts }: T,
        direction: 'horizontal' | 'vertical'
    ): T {
        if (axes) {
            for (const axis of Object.values(axes)) {
                switch (axis.position) {
                    case 'left':
                        axis.position = 'bottom';
                        break;
                    case 'right':
                        axis.position = 'top';
                        break;
                    case 'bottom':
                        axis.position = 'left';
                        break;
                    case 'top':
                        axis.position = 'right';
                        break;
                }
            }
        }
        return {
            ...opts,
            axes,
            series: opts['series']?.map((s) => ({
                ...s,
                direction,
            })),
        } as T;
    }

    it(`should render a range-bar chart as expected`, async () => {
        const options: AgChartOptions = { ...RANGE_COLUMN_OPTIONS };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal range-bar chart as expected`, async () => {
        const options: AgChartOptions = { ...switchSeriesType(RANGE_COLUMN_OPTIONS, 'horizontal') };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart with Date x values as expected`, async () => {
        const options: AgChartOptions = { ...RANGE_COLUMN_OPTIONS, data: CONTINUOUS_DATE_DATA };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal range-bar chart with Date x values as expected`, async () => {
        const options: AgChartOptions = {
            ...switchSeriesType(RANGE_COLUMN_OPTIONS, 'horizontal'),
            data: CONTINUOUS_DATE_DATA,
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart with Date y values as expected`, async () => {
        const options: AgChartOptions = { ...RANGE_Y_DATE_OPTIONS };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal range-bar chart with Date y values as expected`, async () => {
        const options: AgChartOptions = {
            ...switchSeriesType(RANGE_Y_DATE_OPTIONS, 'horizontal'),
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart with inverted high and low values`, async () => {
        const options: AgChartOptions = {
            ...RANGE_COLUMN_OPTIONS,
            data: RANGE_COLUMN_OPTIONS.data?.map((datum: { date: string; high: number; low: number }) => ({
                ...datum,
                low: datum.high,
                high: datum.low,
            })),
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal range-bar chart with inverted high and low values`, async () => {
        const RANGE_BAR_OPTIONS = switchSeriesType(RANGE_COLUMN_OPTIONS, 'horizontal');
        const options: AgChartOptions = {
            ...RANGE_BAR_OPTIONS,
            data: RANGE_BAR_OPTIONS.data?.map((datum: { date: string; high: number; low: number }) => ({
                ...datum,
                low: datum.high,
                high: datum.low,
            })),
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...RANGE_COLUMN_OPTIONS,
            axes: {
                y: {
                    position: 'left',
                    type: 'number',
                    reverse: true,
                },
                x: {
                    position: 'bottom',
                    type: 'category',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal range-bar chart with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...switchSeriesType(RANGE_COLUMN_OPTIONS, 'horizontal'),
            axes: {
                x: {
                    position: 'bottom',
                    type: 'number',
                    reverse: true,
                },
                y: {
                    position: 'left',
                    type: 'category',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart with a unit time x-axis`, async () => {
        const options: AgChartOptions = {
            ...RANGE_COLUMN_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: {
                y: {
                    position: 'left',
                    type: 'number',
                },
                x: {
                    position: 'bottom',
                    type: 'unit-time',
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart with a reversed unit time x-axis`, async () => {
        const options: AgChartOptions = {
            ...RANGE_COLUMN_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: {
                y: {
                    position: 'left',
                    type: 'number',
                },
                x: {
                    position: 'bottom',
                    type: 'unit-time',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal range-bar chart with a unit time y-axis`, async () => {
        const RANGE_BAR_OPTIONS = switchSeriesType(RANGE_COLUMN_OPTIONS, 'horizontal');
        const options: AgChartOptions = {
            ...RANGE_BAR_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: {
                y: {
                    position: 'left',
                    type: 'unit-time',
                },
                x: {
                    position: 'bottom',
                    type: 'number',
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal range-bar chart with a reversed unit time y-axis`, async () => {
        const RANGE_BAR_OPTIONS = switchSeriesType(RANGE_COLUMN_OPTIONS, 'horizontal');
        const options: AgChartOptions = {
            ...RANGE_BAR_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: {
                y: {
                    position: 'left',
                    type: 'unit-time',
                    reverse: true,
                },
                x: {
                    position: 'bottom',
                    type: 'number',
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart with a number x-axis`, async () => {
        const options: AgChartOptions = {
            ...RANGE_COLUMN_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: {
                y: {
                    position: 'left',
                    type: 'number',
                },
                x: {
                    position: 'bottom',
                    type: 'number',
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart with a reversed number x-axis`, async () => {
        const options: AgChartOptions = {
            ...RANGE_COLUMN_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: {
                y: {
                    position: 'left',
                    type: 'number',
                },
                x: {
                    position: 'bottom',
                    type: 'number',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal range-bar chart with a number y-axis`, async () => {
        const RANGE_BAR_OPTIONS = switchSeriesType(RANGE_COLUMN_OPTIONS, 'horizontal');
        const options: AgChartOptions = {
            ...RANGE_BAR_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: {
                y: {
                    position: 'left',
                    type: 'number',
                },
                x: {
                    position: 'bottom',
                    type: 'number',
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal range-bar chart with a number y-axis`, async () => {
        const RANGE_BAR_OPTIONS = switchSeriesType(RANGE_COLUMN_OPTIONS, 'horizontal');
        const options: AgChartOptions = {
            ...RANGE_BAR_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: {
                y: {
                    position: 'left',
                    type: 'number',
                    reverse: true,
                },
                x: {
                    position: 'bottom',
                    type: 'number',
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart with duplicate category keys`, async () => {
        const options: AgChartOptions = {
            ...RANGE_COLUMN_OPTIONS,
            series: RANGE_COLUMN_OPTIONS.series?.map((s) => ({
                ...s,
                strokeWidth: 1,
                fillOpacity: 0.5,
            })),
            data: [
                ...(RANGE_COLUMN_OPTIONS.data ?? []),
                ...(RANGE_COLUMN_OPTIONS.data?.map((datum: { date: string; high: number; low: number }) => ({
                    ...datum,
                    low: roundTo(datum.low * 0.5, 1),
                    high: roundTo(datum.high * 2, 1),
                })) ?? []),
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    // Frame-trajectory coverage for the range-bar animations (initial reveal, update, add, remove,
    // shuffle) and the CRT-1082 legend-toggle midpoint regression. See the animation-trajectory-tests
    // rule.
    describe('animation -test page actions', () => {
        const frames = spyOnAnimationFrames();

        const DATA = [
            { date: 'Jan', low: -13.9, high: 5.2 },
            { date: 'Feb', low: -16.7, high: 10.6 },
            { date: 'Mar', low: -4.7, high: 11.6 },
        ];
        // Grouped low2/high2 midpoints are non-zero (e.g. Jan -3), so a midpoint collapse lands the
        // near edge well clear of the value-0 baseline — the discriminator for CRT-1082.
        const GROUPED_DATA = [
            { date: 'Jan', low1: -13.9, high1: 5.2, low2: -8, high2: 2 },
            { date: 'Feb', low1: -16.7, high1: 10.6, low2: -5, high2: 8 },
            { date: 'Mar', low1: -4.7, high1: 11.6, low2: -1, high2: 6 },
        ];

        // A pinned value axis makes the data mutations below provably non-scale-affecting: only the
        // marks move, so a band reflow or a value-extent change is the series animation, never a
        // rescale.
        const options = (
            direction: 'horizontal' | 'vertical',
            data: object[] = DATA,
            valueBounds: { min?: number; max?: number } = { min: -20, max: 15 }
        ): AgCartesianChartOptions => {
            const valueAxis = { type: 'number' as const, ...valueBounds };
            const catAxis = { type: 'category' as const };
            return prepareEnterpriseTestOptions({
                animation: { enabled: true },
                data,
                series: [{ type: 'range-bar', direction, xKey: 'date', yLowKey: 'low', yHighKey: 'high' }],
                axes:
                    direction === 'vertical'
                        ? { x: { ...catAxis, position: 'bottom' }, y: { ...valueAxis, position: 'left' } }
                        : { y: { ...catAxis, position: 'left' }, x: { ...valueAxis, position: 'bottom' } },
            }) as AgCartesianChartOptions;
        };

        const groupedOptions = (direction: 'horizontal' | 'vertical'): AgCartesianChartOptions => {
            const base = options(direction, GROUPED_DATA);
            base.series = [
                { type: 'range-bar', direction, xKey: 'date', yLowKey: 'low1', yHighKey: 'high1', yName: 'S1' },
                { type: 'range-bar', direction, xKey: 'date', yLowKey: 'low2', yHighKey: 'high2', yName: 'S2' },
            ];
            return base;
        };

        const hideSeries = (opts: AgCartesianChartOptions, index: number): AgCartesianChartOptions => ({
            ...opts,
            series: opts.series?.map((s, i) => (i === index ? { ...s, visible: false } : s)),
        });

        // A range bar's rect splits into a "value" axis (the low..high extent, growing from the
        // midpoint) and a "band" axis (the category slot). Naming the four properties per-direction
        // keeps every spec below orientation-symmetric.
        type Dims = { value: 'height' | 'width'; near: 'y' | 'x'; band: 'width' | 'height'; bandPos: 'x' | 'y' };
        const dims = (direction: 'horizontal' | 'vertical'): Dims =>
            direction === 'vertical'
                ? { value: 'height', near: 'y', band: 'width', bandPos: 'x' }
                : { value: 'width', near: 'x', band: 'height', bandPos: 'y' };

        const phased = (
            during: string | readonly string[],
            ...expectations: readonly TrajectoryExpectation[]
        ): PhasedPropertyExpectation => ({
            during: during as PhasedPropertyExpectation['during'],
            expect: expectations,
        });

        const rectCount = (sample: SceneGeometrySample) =>
            [...sample.keys()].filter((k) => /^series\[\d+\]\/rect/.test(k)).length;
        const midpointOf = (node: Record<string, number>, d: Dims) => node[d.near] + node[d.value] / 2;
        const lastFrameWith = (trajectory: SceneGeometrySample[], key: string) =>
            trajectory
                .filter((f) => f.has(key))
                .at(-1)!
                .get(key)!;

        // Bars grow/collapse from their midpoint, so the value extent must never invert (low <= high)
        // on any frame — a per-frame contract no single-node directional check expresses.
        const nonNegativeExtent = (d: Dims): SceneFrameInvariant => ({
            name: 'bar value extent stays non-negative (low <= high)',
            check: (frame) => {
                for (const [key, node] of frame) {
                    if (!/^series\[\d+\]\/rect\[/.test(key)) continue;
                    if (node[d.value] < -0.5) return `${key} ${d.value}=${node[d.value].toFixed(2)} < 0`;
                }
                return undefined;
            },
        });

        // Bars widening/narrowing to re-share a reflowed band: the band dimension tweens during the
        // 'update' phase while the value extent and slot position hold.
        const bandReflow = (d: Dims, band: 'increases' | 'decreases'): SceneNodeExpectation => ({
            [d.band]: phased('update', band, 'progresses'),
            [d.value]: phased('update', 'bounded'),
            [d.near]: phased('update', 'bounded'),
            [d.bandPos]: phased('update', 'bounded'),
        });

        for (const direction of ['vertical', 'horizontal'] as const) {
            const d = dims(direction);
            const catPos = direction === 'vertical' ? 'bottom' : 'left';
            // The category axis reflows/reorders as bands are added, removed or shuffled; its
            // per-tick motion is data-order dependent and incidental to the bar animation under test
            // (the endpoint guards below cover its settled pixels), so it is left unpinned.
            const catAxisAny: Record<string, SceneNodeExpectation> = { [`axis[${catPos}]/*`]: 'any' };

            // Initial-load reveal: each bar expands from its midpoint along the value axis (the near
            // edge slides out) while its band holds. The docs page's rolling "range-bar-animation".
            it(`initial load (${direction}): bars expand from their midpoint`, async () => {
                chart = AgCharts.create(options(direction));
                const sampleScene = createSceneGeometrySampler(chart);
                const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
                // Anti-vacuity: the bar genuinely starts collapsed to a zero-extent line.
                expect(trajectory[0].get('series[0]/rect[Jan]')![d.value]).toBeLessThanOrEqual(0.1);
                expectSceneTrajectory(trajectory, {
                    'series[0]/rect[*]': {
                        [d.value]: phased('initial', 'increases', 'progresses', 'bounded'),
                        [d.near]: phased('initial', 'decreases', 'bounded'),
                        [d.band]: 'bounded',
                        [d.bandPos]: 'bounded',
                    },
                });
            });

            // "Update Data": every bar tweens its low/high edges to the new values (the value extent
            // moves monotonically); the pinned band holds.
            it(`update data (${direction}): low/high edges tween to the new values`, async () => {
                chart = AgCharts.create(options(direction));
                const sampleScene = createSceneGeometrySampler(chart);
                const { trajectory, before, after } = await frames.captureUpdate(chart, sampleScene, () =>
                    chart.updateDelta({
                        data: [
                            { date: 'Jan', low: -8, high: 12 },
                            { date: 'Feb', low: -10, high: 4 },
                            { date: 'Mar', low: -2, high: 14 },
                        ],
                    })
                );
                // Anti-vacuity: a named bar's value extent genuinely differs end-to-end.
                const feb = 'series[0]/rect[Feb]';
                expect(Math.abs(after.get(feb)![d.value] - before.get(feb)![d.value])).toBeGreaterThan(20);
                expectSceneTrajectory(
                    trajectory,
                    {
                        'series[0]/rect[*]': {
                            [d.value]: phased('update', 'monotonic', 'progresses', 'bounded'),
                            [d.near]: phased('update', 'monotonic', 'bounded'),
                            [d.band]: phased('update', 'bounded'),
                            [d.bandPos]: phased('update', 'bounded'),
                        },
                    },
                    { frameInvariants: [nonNegativeExtent(d)] }
                );
            });

            // "Add Data": a new trailing category enters. Its bar spawns collapsed at its midpoint and
            // grows out during the 'add' phase; the existing bars narrow during 'update'. captureSnap
            // (not captureUpdate) because the category-axis reflow snaps the axis line at frame 0.
            it(`add data (${direction}): entering bar grows from its midpoint while others narrow`, async () => {
                chart = AgCharts.create(options(direction, DATA.slice(0, 2)));
                const sampleScene = createSceneGeometrySampler(chart);
                const { before, trajectory, after } = await frames.captureSnap(chart, sampleScene, () =>
                    chart.updateDelta({ data: DATA })
                );
                expect(rectCount(before)).toBe(2);
                expect(rectCount(after)).toBe(3);
                // Anti-vacuity: the entrant starts collapsed at its midpoint.
                expect(trajectory[0].get('series[0]/rect[Mar]')![d.value]).toBeLessThanOrEqual(0.1);
                expectSceneTrajectory(trajectory, {
                    'series[0]/rect[Mar]': {
                        [d.value]: phased('add', 'increases', 'progresses', 'bounded'),
                        [d.near]: phased('add', 'decreases', 'bounded'),
                        [d.band]: 'bounded',
                        [d.bandPos]: 'bounded',
                    },
                    'series[0]/rect[Jan]': bandReflow(d, 'decreases'),
                    'series[0]/rect[Feb]': bandReflow(d, 'decreases'),
                    ...catAxisAny,
                });
            });

            // "Remove Data": the trailing category leaves — its bar collapses to its midpoint during
            // 'remove' and is dropped; the survivors widen into the freed space during 'update'.
            it(`remove data (${direction}): leaving bar collapses to its midpoint while others widen`, async () => {
                chart = AgCharts.create(options(direction));
                const sampleScene = createSceneGeometrySampler(chart);
                const { trajectory, before, after } = await frames.captureUpdate(chart, sampleScene, () =>
                    chart.updateDelta({ data: DATA.slice(0, 2) })
                );
                expect(rectCount(before)).toBe(3);
                expect(rectCount(after)).toBe(2);
                // Anti-vacuity + midpoint guard: the leaver starts at full extent, and its last visible
                // frame sits at ~0 extent centred on its ORIGINAL midpoint (a baseline collapse would
                // land the near edge on the value-0 pixel, far from this midpoint).
                const leaver0 = trajectory[0].get('series[0]/rect[Mar]')!;
                expect(leaver0[d.value]).toBeGreaterThan(100);
                const leaverLast = lastFrameWith(trajectory, 'series[0]/rect[Mar]');
                expect(leaverLast[d.value]).toBeLessThanOrEqual(1);
                expect(Math.abs(leaverLast[d.near] - midpointOf(leaver0, d))).toBeLessThanOrEqual(2);
                expect(after.get('series[0]/rect[Mar]')).toBeUndefined();
                expectSceneTrajectory(trajectory, {
                    'series[0]/rect[Mar]': {
                        [d.value]: phased('remove', 'decreases', 'bounded'),
                        [d.near]: phased('remove', 'increases', 'bounded'),
                        [d.band]: 'bounded',
                        [d.bandPos]: 'bounded',
                    },
                    'series[0]/rect[Jan]': bandReflow(d, 'increases'),
                    'series[0]/rect[Feb]': bandReflow(d, 'increases'),
                    ...catAxisAny,
                });
            });

            // "Shuffle Data": same values, reordered categories. Bars slide along the band axis to
            // their new slots (a tween, not a redraw); the value extent holds.
            it(`shuffle data (${direction}): bars slide to their reordered band positions`, async () => {
                chart = AgCharts.create(options(direction));
                const sampleScene = createSceneGeometrySampler(chart);
                const { trajectory, before, after } = await frames.captureUpdate(chart, sampleScene, () =>
                    chart.updateDelta({ data: [DATA[2], DATA[0], DATA[1]] })
                );
                // Anti-vacuity: a named bar genuinely swaps band position end-to-end.
                const mar = 'series[0]/rect[Mar]';
                expect(Math.abs(after.get(mar)![d.bandPos] - before.get(mar)![d.bandPos])).toBeGreaterThan(100);
                expectSceneTrajectory(trajectory, {
                    'series[0]/rect[*]': {
                        [d.bandPos]: phased('update', 'monotonic', 'progresses', 'bounded'),
                        [d.value]: phased('update', 'bounded'),
                        [d.near]: phased('update', 'bounded'),
                        [d.band]: phased('update', 'bounded'),
                    },
                    ...catAxisAny,
                });
            });

            // CRT-1082: a range-bar legend toggle must collapse the hidden series' bars to their
            // MIDPOINT, not the chart baseline. The toggled-off layer collapses during 'remove'; the
            // survivor widens into the vacated band during 'update'. A baseline-collapse regression
            // moves the near edge to the value-0 pixel, which the midpoint guard rejects. captureSnap
            // because a series toggle snaps structurally at frame 0.
            it(`legend toggle off (${direction}): hidden bars collapse to their midpoint (CRT-1082)`, async () => {
                const grouped = groupedOptions(direction);
                chart = AgCharts.create(grouped);
                const sampleScene = createSceneGeometrySampler(chart);
                const { trajectory, after } = await frames.captureSnap(chart, sampleScene, () =>
                    chart.update(hideSeries(grouped, 1))
                );
                // Anti-vacuity + CRT-1082 midpoint guard.
                const hidden0 = trajectory[0].get('series[1]/rect[Jan]')!;
                expect(hidden0[d.value]).toBeGreaterThan(50);
                const hiddenLast = lastFrameWith(trajectory, 'series[1]/rect[Jan]');
                expect(hiddenLast[d.value]).toBeLessThanOrEqual(1);
                expect(Math.abs(hiddenLast[d.near] - midpointOf(hidden0, d))).toBeLessThanOrEqual(2);
                expect(after.get('series[1]/rect[Jan]')).toBeUndefined();
                expectSceneTrajectory(trajectory, {
                    'series[1]/rect[*]': {
                        [d.value]: phased('remove', 'decreases', 'bounded'),
                        [d.near]: phased('remove', 'increases', 'bounded'),
                        [d.band]: 'bounded',
                        [d.bandPos]: 'bounded',
                    },
                    'series[0]/rect[*]': bandReflow(d, 'increases'),
                });
            });

            // The retired rolling "range-bar-animation" fired one update that added, removed,
            // shuffled AND revalued at once ("animate continuously without snapping"). A single mixed
            // update must keep the low<=high extent on every frame and settle exactly on the static
            // scene. captureSnap because the category add/remove snaps the axis line at frame 0.
            it(`combined mutation (${direction}): mixed add/remove/shuffle/revalue stays coherent`, async () => {
                chart = AgCharts.create(options(direction));
                const sampleScene = createSceneGeometrySampler(chart);
                const { before, trajectory, after } = await frames.captureSnap(chart, sampleScene, () =>
                    chart.update(
                        options(direction, [
                            { date: 'Feb', low: -10, high: 4 },
                            { date: 'Apr', low: -6, high: 9 },
                            { date: 'Jan', low: 0, high: 14 },
                        ])
                    )
                );
                // Anti-vacuity: the structural change genuinely landed (Mar left, Apr entered).
                expect(before.has('series[0]/rect[Mar]')).toBe(true);
                expect(after.has('series[0]/rect[Mar]')).toBe(false);
                expect(before.has('series[0]/rect[Apr]')).toBe(false);
                expect(after.has('series[0]/rect[Apr]')).toBe(true);
                // No snapping: the surviving, revalued Jan bar tweens its value extent across frames.
                expectProgresses(trajectory.map((f) => f.get('series[0]/rect[Jan]')?.[d.value] ?? Number.NaN));
                // low <= high holds on every frame, throughout the mixed transition.
                expectSceneTrajectory(trajectory, { '*': 'any' }, { frameInvariants: [nonNegativeExtent(d)] });
            });
        }

        // Value axis UNPINNED: removing the low-extreme datum contracts the domain, and the axis must
        // rescale by tweening its ticks, not snapping. captureSnap because the category reflow snaps
        // the axis line at frame 0.
        it('unpinned value axis (vertical): axis rescales by tweening, not snapping', async () => {
            const d = dims('vertical');
            const unpinned = (data: object[]) => options('vertical', data, {});
            chart = AgCharts.create(unpinned(DATA));
            const sampleScene = createSceneGeometrySampler(chart);
            const { before, trajectory, after } = await frames.captureSnap(chart, sampleScene, () =>
                chart.update(unpinned([DATA[0], DATA[2]]))
            );
            // The +10 gridline is present throughout; removing the -16.7 low rescales the domain, so
            // its pixel position must genuinely move — and move progressively, not snap.
            const tick = 'axis[left]/line[l:10]';
            expect(Math.abs(after.get(tick)!.y1 - before.get(tick)!.y1)).toBeGreaterThan(20);
            expectProgresses(trajectory.map((f) => f.get(tick)?.y1 ?? Number.NaN));
            expectSceneTrajectory(trajectory, { '*': 'any' }, { frameInvariants: [nonNegativeExtent(d)] });
        });

        // Shuffle: category labels must track their reordered bars ("labels track the reordered
        // data"). captureUpdate works here — the category set is unchanged, so no axis-line snap.
        it('shuffle data (vertical): category labels track their reordered bars', async () => {
            chart = AgCharts.create(options('vertical'));
            const sampleScene = createSceneGeometrySampler(chart);
            const { trajectory, before, after } = await frames.captureUpdate(chart, sampleScene, () =>
                chart.updateDelta({ data: [DATA[2], DATA[0], DATA[1]] })
            );
            const label = 'axis[bottom]/text[l:Mar]';
            // Anti-vacuity: the Mar label genuinely relocates end-to-end ...
            expect(Math.abs(after.get(label)!.x - before.get(label)!.x)).toBeGreaterThan(100);
            // ... tweening across frames (no snap) ...
            expectProgresses(trajectory.map((f) => f.get(label)!.x));
            // ... and lands centred on its reordered bar's band.
            const bar = after.get('series[0]/rect[Mar]')!;
            expect(Math.abs(after.get(label)!.x - (bar.x + bar.width / 2))).toBeLessThanOrEqual(2);
        });

        // Pixel endpoint guards: the animated routes must settle at exactly the pixels a snapped
        // render of the same options produces (replacing the deleted 0%/100% image snapshots).
        for (const direction of ['vertical', 'horizontal'] as const) {
            it(`endpoints (${direction}): update data settles at the static render`, async () => {
                const opts = options(direction);
                chart = AgCharts.create(opts);
                await expectAnimatedEndpointsMatchStatic(
                    frames,
                    () => ctx.snapshot(),
                    chart,
                    opts,
                    options(direction, [
                        { date: 'Jan', low: -8, high: 12 },
                        { date: 'Feb', low: -10, high: 4 },
                        { date: 'Mar', low: -2, high: 14 },
                    ])
                );
            });

            it(`endpoints (${direction}): remove data settles at the static render`, async () => {
                const opts = options(direction);
                chart = AgCharts.create(opts);
                await expectAnimatedEndpointsMatchStatic(
                    frames,
                    () => ctx.snapshot(),
                    chart,
                    opts,
                    options(direction, DATA.slice(0, 2))
                );
            });

            it(`endpoints (${direction}): legend toggle settles at the static render`, async () => {
                const grouped = groupedOptions(direction);
                chart = AgCharts.create(grouped);
                await expectAnimatedEndpointsMatchStatic(
                    frames,
                    () => ctx.snapshot(),
                    chart,
                    grouped,
                    hideSeries(grouped, 1)
                );
            });
        }
    });

    describe('gradient fill', () => {
        it('should render range column series with a default gradient fill', async () => {
            const options = {
                ...RANGE_COLUMN_OPTIONS,
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'date',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        fill: {
                            type: 'gradient',
                        },
                    },
                ],
            };

            prepareEnterpriseTestOptions(options as AgChartOptions);

            chart = AgCharts.create(options as AgChartOptions);
            await waitForChartStability(chart);

            await compare();
        });

        it('should render range bar series with a default gradient fill', async () => {
            const options = {
                ...RANGE_COLUMN_OPTIONS,
                series: [
                    {
                        type: 'range-bar',
                        direction: 'horizontal',
                        xKey: 'date',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        fill: {
                            type: 'gradient',
                        },
                    },
                ],
            };

            prepareEnterpriseTestOptions(options as AgChartOptions);

            chart = AgCharts.create(options as AgChartOptions);
            await waitForChartStability(chart);

            await compare();
        });

        it('should render range column series with a gradient fill', async () => {
            const options = {
                ...RANGE_COLUMN_OPTIONS,
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'date',
                        yLowKey: 'low',
                        yHighKey: 'high',
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
                ],
            };

            prepareEnterpriseTestOptions(options as AgChartOptions);

            chart = AgCharts.create(options as AgChartOptions);
            await waitForChartStability(chart);

            await compare();
        });

        it('should render range bar series with a gradient fill', async () => {
            const options = {
                ...RANGE_COLUMN_OPTIONS,
                series: [
                    {
                        type: 'range-bar',
                        direction: 'horizontal',
                        xKey: 'date',
                        yLowKey: 'low',
                        yHighKey: 'high',
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
                ],
            };

            prepareEnterpriseTestOptions(options as AgChartOptions);

            chart = AgCharts.create(options as AgChartOptions);
            await waitForChartStability(chart);

            await compare();
        });
    });

    describe('AG-8290', () => {
        async function testCase(
            labelOpts: { placement: AgRangeBarSeriesLabelPlacement; spacing?: number },
            name: string
        ) {
            chart = AgCharts.create(
                prepareEnterpriseTestOptions({
                    data: [
                        { x: '1', yL: 140, yH: 160 },
                        { x: '2', yL: 124, yH: 141 },
                        { x: '3', yL: 112, yH: 165 },
                        { x: '4', yL: 118, yH: 132 },
                    ],
                    series: [{ type: 'range-bar', xKey: 'x', yLowKey: 'yL', yHighKey: 'yH', label: { ...labelOpts } }],
                })
            );
            await compare({ failureThreshold: 0, failureThresholdType: 'percent', customSnapshotIdentifier: name });
        }
        describe('spacing sets the gap between the bar and the label', () => {
            test('inside', async () => {
                await testCase({ placement: 'inside', spacing: 30 }, 'AG-8290-range-bar-label-spacing-inside');
            });
            test('outside', async () => {
                await testCase({ placement: 'outside', spacing: 30 }, 'AG-8290-range-bar-label-spacing-outside');
            });
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
            'renders a rotated outside label clear of and centred on the bar (%s padding)',
            async (_name, padding) => {
                expect(
                    await renderEnterpriseChartImage(ctx, {
                        data: [{ x: '1', yL: 140, yH: 160 }],
                        legend: { enabled: false },
                        axes: { x: { type: 'category' }, y: { type: 'number', min: 100, max: 200 } },
                        series: [
                            {
                                type: 'range-bar',
                                xKey: 'x',
                                yLowKey: 'yL',
                                yHighKey: 'yH',
                                label: {
                                    enabled: true,
                                    placement: 'outside',
                                    orientation: 'vertical',
                                    fill: 'khaki',
                                    padding,
                                },
                            },
                        ],
                    })
                ).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
            }
        );
    });

    describe('AG-15448', () => {
        const DATA1 = [
            { month: 'Jan', tempLow: 5, tempHigh: 15, status: 1 },
            { month: 'Feb', tempLow: 7, tempHigh: 18, status: 1 },
            { month: 'Mar', tempLow: 10, tempHigh: 22, status: 1 },
            { month: 'Apr', tempLow: 12, tempHigh: 25, status: 2 },
            { month: 'Jul', tempLow: 20, tempHigh: 30, status: 2 }, // This overlaps with the DATA2 dataset and can render in the wrong color.
            { month: 'Aug', tempLow: 18, tempHigh: 28, status: 1 },
        ];

        const DATA2 = [
            { month: 'May', tempLow: 15, tempHigh: 27, status: 2 },
            { month: 'Jun', tempLow: 18, tempHigh: 29, status: 1 },
            { month: 'Jul', tempLow: 20, tempHigh: 30, status: 2 },
        ];

        const EXAMPLE_OPTIONS: AgCartesianChartOptions<
            { month: string; tempLow: number; tempHigh: number; status: number },
            { colors: Record<number, string> }
        > = {
            context: { colors: { 1: 'orange', 2: 'green' } },
            data: DATA1,
            series: [
                {
                    type: 'range-bar',
                    xKey: 'month',
                    yLowKey: 'tempLow',
                    yHighKey: 'tempHigh',
                    label: { formatter: ({ datum, context }) => context?.colors[datum.status] ?? 'none' },
                    itemStyler: ({ datum, context }) => ({
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

    describe('AG-17875 itemStyler CSS variable resolution', () => {
        it('resolves a CSS variable fill returned from itemStyler to its computed colour', async () => {
            const container = document.createElement('div');
            const restoreCssVarColorSupport = mockCssVarColorSupport(container, { '--my-color': 'rgb(0, 128, 0)' });
            try {
                const options: AgCartesianChartOptions = {
                    data: [{ month: 'Jan', low: 5, high: 15 }],
                    series: [
                        {
                            type: 'range-bar',
                            xKey: 'month',
                            yLowKey: 'low',
                            yHighKey: 'high',
                            itemStyler: () => ({ fill: 'var(--my-color)' }),
                        },
                    ],
                };
                prepareEnterpriseTestOptions(options, container);

                chart = deproxy(AgCharts.create(options));
                await waitForChartStability(chart);

                const series = chart.series[0];
                const [rect] = series.dataNodeGroup.children();

                expect(rect.fill).toBe('rgb(0, 128, 0)');
            } finally {
                restoreCssVarColorSupport();
            }
        });
    });

    describe('AG-15782 styler', () => {
        type D = { month: string; gain_low: number; gain_high: number; loss_low: number; loss_high: number };
        type C = unknown;
        type M = MockRangeBarStyler<D, C>;
        let styler: ReturnType<typeof newFreezableMock<D, C, M>>;
        const data = [
            { month: 'January', gain_low: 1200, gain_high: 1500, loss_low: 800, loss_high: 1100 },
            { month: 'February', gain_low: 1500, gain_high: 1650, loss_low: 950, loss_high: 1450 },
            { month: 'March', gain_low: 1700, gain_high: 1920, loss_low: 1600, loss_high: 1815 },
        ];
        beforeEach(() => {
            styler = newFreezableMock<D, C, M>(
                (params: AgRangeBarSeriesStylerParams<D, C>): AgRangeBarSeriesStyle | undefined => {
                    if (params.yLowKey === 'gain_low')
                        return {
                            fill: 'cyan',
                            lineDash: [3, 3],
                            lineDashOffset: 5,
                            stroke: 'blue',
                            strokeWidth: 7,
                        };
                    else if (params.yLowKey === 'loss_low')
                        return {
                            fill: 'magenta',
                            fillOpacity: 0.5,
                            cornerRadius: 15,
                        };
                    return {};
                }
            );
        });
        describe('init', () => {
            let c1: C;
            let c2: C;
            beforeEach(async () => {
                c1 = { name: 'gain context' };
                c2 = { name: 'loss context' };
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions({
                        data,
                        series: [
                            {
                                type: 'range-bar',
                                context: c1,
                                xKey: 'month',
                                yName: 'Gain',
                                yLowKey: 'gain_low',
                                yHighKey: 'gain_high',
                                styler: styler.frozen,
                                grouped: false,
                            },
                            {
                                type: 'range-bar',
                                context: c2,
                                xKey: 'month',
                                yName: 'Loss',
                                yLowKey: 'loss_low',
                                yHighKey: 'loss_high',
                                styler: styler.frozen,
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
            });
            describe('callbacks', () => {
                test('context', () => {
                    styler.expect().nthCalledWithContext(0, c1);
                    styler.expect().nthCalledWithContext(1, c2);
                    styler.expect().toHaveBeenCalledTimes(2);
                });
                test('params', () => {
                    expect(styler.mock.mock.calls).toMatchSnapshot();
                });
            });
        });
        describe('priorities', () => {
            beforeEach(async () => {
                const itemStyler = (params: AgRangeBarSeriesItemStylerParams<D, C>): AgRangeBarSeriesStyle => {
                    if (params.datum[params.xKey] === 'February') {
                        if (params.yLowKey === 'gain_low') {
                            return { fill: 'gold', cornerRadius: 0 };
                        } else {
                            return { fill: 'grey', cornerRadius: 0 };
                        }
                    }
                    return {};
                };
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<AgCartesianChartOptions<D, C>>({
                        data,
                        series: [
                            {
                                type: 'range-bar',
                                xKey: 'month',
                                yName: 'Gain',
                                yLowKey: 'gain_low',
                                yHighKey: 'gain_high',
                                fill: 'lime', // ignored
                                cornerRadius: 45, // ignored only for February
                                itemStyler,
                                styler: styler.frozen,
                            },
                            {
                                type: 'range-bar',
                                xKey: 'month',
                                yName: 'Loss',
                                yLowKey: 'loss_low',
                                yHighKey: 'loss_high',
                                fill: 'olive', // ignored
                                stroke: 'navy', // not ignored
                                strokeWidth: 3, // not ignored
                                itemStyler,
                                styler: styler.frozen,
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
            });
        });
        describe('gradient-pattern', () => {
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions({
                        data,
                        series: [
                            {
                                type: 'range-bar',
                                xKey: 'month',
                                yName: 'Gain',
                                yLowKey: 'gain_low',
                                yHighKey: 'gain_high',
                                styler: () => {
                                    return { fill: { type: 'gradient' } };
                                },
                            },
                            {
                                type: 'range-bar',
                                xKey: 'month',
                                yName: 'Loss',
                                yLowKey: 'loss_low',
                                yHighKey: 'loss_high',
                                styler: () => {
                                    return { fill: { type: 'pattern' } };
                                },
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
            });
        });
        describe('stroke-strokeWidth-defaults', () => {
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions({
                        data,
                        series: [
                            {
                                type: 'range-bar',
                                xKey: 'month',
                                yName: 'Gain',
                                yLowKey: 'gain_low',
                                yHighKey: 'gain_high',
                                styler: () => {
                                    // check that default `strokeWidth: 2` is resolved.
                                    return { stroke: 'lime' };
                                },
                            },
                            {
                                type: 'range-bar',
                                xKey: 'month',
                                yName: 'Loss',
                                yLowKey: 'loss_low',
                                yHighKey: 'loss_high',
                                styler: () => {
                                    // check that theme-default `stroke` is resolved.
                                    return { strokeWidth: 4 };
                                },
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
            });
        });
        describe('highlights', () => {
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions({
                        data,
                        series: [
                            {
                                type: 'range-bar',
                                xKey: 'month',
                                yName: 'Gain',
                                yLowKey: 'gain_low',
                                yHighKey: 'gain_high',
                                styler: styler.frozen,
                                grouped: false,
                            },
                            {
                                type: 'range-bar',
                                xKey: 'month',
                                yName: 'Loss',
                                yLowKey: 'loss_low',
                                yHighKey: 'loss_high',
                                styler: styler.frozen,
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });

            const miss = { x: 100, y: 100 } as const;
            const series0datum0 = { x: 178, y: 287 } as const;
            const series0datum2 = { x: 660, y: 75 } as const;
            const series1datum0 = { x: 178, y: 450 } as const;
            const legendItem0 = { x: 375, y: 572 } as const;
            const legendItem1 = { x: 440, y: 572 } as const;

            describe('single', () => {
                async function testHover(p: { readonly x: number; readonly y: number }) {
                    await hoverAction(p.x, p.y)(chart);
                    expect(styler.mock.mock.calls).toMatchSnapshot();
                }
                test('miss', async () => testHover(miss));
                test('series[0].datum[0]', async () => testHover(series0datum0));
                test('series[0].datum[2]', async () => testHover(series0datum2));
                test('series[1].datum[0]', async () => testHover(series1datum0));
                test('legendItem[0]', async () => testHover(legendItem0));
                test('legendItem[1]', async () => testHover(legendItem1));
            });
            describe('sequenced', () => {
                async function hover(p: { readonly x: number; readonly y: number }) {
                    await hoverAction(p.x, p.y)(chart);
                    await waitForChartStability(chart);
                }
                function popCalls() {
                    const result = [...styler.mock.mock.calls];
                    styler.mock.mockClear();
                    return result;
                }
                test('1', async () => {
                    await hover(miss);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(series0datum0);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(miss);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(series0datum2);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(miss);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(series1datum0);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(miss);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(legendItem0);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(legendItem1);
                    // Wait for delayed unhighlights to complete
                    await waitForChartStability(chart, MIN_UNHIGHLIGHT_DELAY);
                    expect(popCalls()).toMatchSnapshot();
                });
            });
        });
    });

    describe('segmentation', () => {
        it('should render range-bar series with segmentation styling on x-axis', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { category: 'A', high: 100, low: 50 },
                    { category: 'B', high: 150, low: 80 },
                    { category: 'C', high: 120, low: 60 },
                    { category: 'D', high: 180, low: 110 },
                    { category: 'E', high: 200, low: 130 },
                ],
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'category',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 'A', stop: 'B', fill: 'rgba(255, 0, 0, 0.3)', stroke: 'red', strokeWidth: 2 },
                                { start: 'C', stop: 'D', fill: 'rgba(0, 0, 255, 0.3)', stroke: 'blue', strokeWidth: 3 },
                                { start: 'E', fill: 'rgba(0, 255, 0, 0.3)', stroke: 'green', strokeWidth: 2 },
                            ],
                        },
                    },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await compareImageSnapshot(chart, ctx);
        });

        it('should render range-bar series with segmentation styling on y-axis', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 0, high: 100, low: 50 },
                    { x: 1, high: 180, low: 120 },
                    { x: 2, high: 150, low: 90 },
                    { x: 3, high: 220, low: 160 },
                    { x: 4, high: 250, low: 180 },
                ],
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        segmentation: {
                            key: 'y',
                            segments: [
                                {
                                    start: 50,
                                    stop: 150,
                                    fill: 'rgba(255, 165, 0, 0.3)',
                                    stroke: 'orange',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 150,
                                    stop: 200,
                                    fill: 'rgba(128, 0, 128, 0.3)',
                                    stroke: 'purple',
                                    strokeWidth: 3,
                                },
                                { start: 200, fill: 'rgba(0, 255, 255, 0.3)', stroke: 'cyan', strokeWidth: 4 },
                            ],
                        },
                    },
                ],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await compareImageSnapshot(chart, ctx);
        });

        it('should render horizontal range-bar series with segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { category: 'A', high: 100, low: 50 },
                    { category: 'B', high: 150, low: 80 },
                    { category: 'C', high: 120, low: 60 },
                    { category: 'D', high: 180, low: 110 },
                ],
                series: [
                    {
                        type: 'range-bar',
                        direction: 'horizontal',
                        xKey: 'category',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 'A',
                                    stop: 'B',
                                    fill: 'rgba(255, 192, 203, 0.4)',
                                    stroke: 'hotpink',
                                    strokeWidth: 2,
                                },
                                { start: 'C', fill: 'rgba(173, 216, 230, 0.4)', stroke: 'lightblue', strokeWidth: 3 },
                            ],
                        },
                    },
                ],
                axes: {
                    y: { type: 'category', position: 'left' },
                    x: { type: 'number', position: 'bottom' },
                },
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await compareImageSnapshot(chart, ctx);
        });

        it('should render grouped range-bar series with segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { category: 'Q1', high1: 100, low1: 50, high2: 80, low2: 40 },
                    { category: 'Q2', high1: 150, low1: 80, high2: 120, low2: 70 },
                    { category: 'Q3', high1: 120, low1: 60, high2: 140, low2: 90 },
                    { category: 'Q4', high1: 180, low1: 110, high2: 160, low2: 100 },
                ],
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'category',
                        yLowKey: 'low1',
                        yHighKey: 'high1',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 'Q1',
                                    stop: 'Q2',
                                    fill: 'rgba(255, 0, 0, 0.3)',
                                    stroke: 'red',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 'Q3',
                                    stop: 'Q3',
                                    fill: 'rgba(0, 0, 255, 0.3)',
                                    stroke: 'blue',
                                    strokeWidth: 3,
                                },
                                { start: 'Q4', fill: 'rgba(0, 255, 0, 0.3)', stroke: 'green', strokeWidth: 2 },
                            ],
                        },
                    },
                    {
                        type: 'range-bar',
                        xKey: 'category',
                        yLowKey: 'low2',
                        yHighKey: 'high2',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 'Q1',
                                    stop: 'Q2',
                                    fill: 'rgba(255, 165, 0, 0.3)',
                                    stroke: 'orange',
                                    strokeWidth: 2,
                                },
                                { start: 'Q3', fill: 'rgba(128, 0, 128, 0.3)', stroke: 'purple', strokeWidth: 3 },
                            ],
                        },
                    },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await compareImageSnapshot(chart, ctx);
        });

        it('should render range-bar series with pattern fill segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { category: 'A', high: 100, low: 50 },
                    { category: 'B', high: 150, low: 80 },
                    { category: 'C', high: 120, low: 60 },
                    { category: 'D', high: 180, low: 110 },
                ],
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'category',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 'A',
                                    stop: 'A',
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'vertical-lines',
                                        strokeWidth: 3,
                                    },
                                    stroke: '#ff6b6b',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 'B',
                                    stop: 'B',
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'horizontal-lines',
                                        stroke: '#4ecdc4',
                                        strokeWidth: 2,
                                    },
                                    stroke: '#4ecdc4',
                                    strokeWidth: 3,
                                },
                                {
                                    start: 'C',
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'forward-slanted-lines',
                                        strokeWidth: 2,
                                    },
                                    stroke: '#45b7d1',
                                    strokeWidth: 2,
                                },
                            ],
                        },
                    },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await compareImageSnapshot(chart, ctx);
        });

        it('should render range-bar series with gradient fill segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 0, high: 100, low: 50 },
                    { x: 1, high: 150, low: 80 },
                    { x: 2, high: 120, low: 60 },
                    { x: 3, high: 180, low: 110 },
                    { x: 4, high: 200, low: 130 },
                ],
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: -1,
                                    stop: 2,
                                    fill: {
                                        type: 'gradient',
                                    },
                                    stroke: '#ff6b6b',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 2,
                                    stop: 4,
                                    fill: {
                                        type: 'gradient',
                                    },
                                    stroke: '#4ecdc4',
                                    strokeWidth: 3,
                                },
                                {
                                    start: 4,
                                    fill: {
                                        type: 'gradient',
                                    },
                                    stroke: '#45b7d1',
                                    strokeWidth: 2,
                                },
                            ],
                        },
                    },
                ],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await compareImageSnapshot(chart, ctx);
        });

        it('should render range-bar series with time axis segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { date: new Date(2023, 0, 1), high: 1200, low: 800 },
                    { date: new Date(2023, 1, 1), high: 1500, low: 1000 },
                    { date: new Date(2023, 2, 1), high: 1100, low: 700 },
                    { date: new Date(2023, 3, 1), high: 1800, low: 1200 },
                    { date: new Date(2023, 4, 1), high: 2000, low: 1400 },
                ],
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'date',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: new Date(2023, 0, 1),
                                    stop: new Date(2023, 2, 1),
                                    fill: 'rgba(255, 0, 0, 0.3)',
                                    stroke: 'red',
                                    strokeWidth: 2,
                                },
                                {
                                    start: new Date(2023, 2, 1),
                                    fill: 'rgba(0, 255, 0, 0.3)',
                                    stroke: 'green',
                                    strokeWidth: 3,
                                },
                            ],
                        },
                    },
                ],
                axes: {
                    x: { type: 'time', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await compareImageSnapshot(chart, ctx);
        });
    });

    describe('AG-15743 legendItemName', () => {
        testLegendItemName({
            create: (o) => (chart = AgCharts.create(prepareEnterpriseTestOptions(o))),
            compare,
            chartOptions: {
                data: [
                    { x: 'West', s1L: 0, s1H: 1, s2L: 2, s2H: 3, s3L: 4, s3H: 5 },
                    { x: 'East', s1L: 0, s1H: 1, s2L: 2, s2H: 3, s3L: 4, s3H: 5 },
                ],
                series: [
                    { type: 'range-bar', xKey: 'x', yLowKey: 's1L', yHighKey: 's1H', yName: 'series 1' },
                    { type: 'range-bar', xKey: 'x', yLowKey: 's2L', yHighKey: 's2H', yName: 'series 2' },
                    { type: 'range-bar', xKey: 'x', yLowKey: 's3L', yHighKey: 's3H', yName: 'series 3' },
                ],
            },
        });
    });

    describe('null category key', () => {
        const RANGE_BAR_NULL_CATEGORY_KEY_DATA = [
            { month: 'Jan', high: 9.2, low: -4.5 },
            { month: null, high: 11.6, low: -3.7 },
            { month: 'Mar', high: 14.8, low: 0.5 },
        ];

        const RANGE_BAR_NULL_CATEGORY_KEY_OPTIONS: AgChartOptions = {
            data: RANGE_BAR_NULL_CATEGORY_KEY_DATA,
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
            series: [
                {
                    type: 'range-bar',
                    xKey: 'month',
                    yLowKey: 'low',
                    yHighKey: 'high',
                },
            ],
        };

        it('should reject null category key with warning', async () => {
            const options: AgChartOptions = { ...RANGE_BAR_NULL_CATEGORY_KEY_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [RangeBarSeries-1 / xValue] ignored:",
    "[null]",
  ],
]
`);
            await compare();
        });

        it('should accept null category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...RANGE_BAR_NULL_CATEGORY_KEY_OPTIONS,
                series: [
                    {
                        ...RANGE_BAR_NULL_CATEGORY_KEY_OPTIONS.series![0],
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
        const RANGE_BAR_UNDEFINED_CATEGORY_KEY_DATA = [
            { month: 'Jan', high: 9.2, low: -4.5 },
            { month: undefined, high: 11.6, low: -3.7 },
            { month: 'Mar', high: 14.8, low: 0.5 },
        ];

        const RANGE_BAR_NULL_AND_UNDEFINED_KEYS_DATA = [
            { month: 'Jan', high: 9.2, low: -4.5 },
            { month: null, high: 10.4, low: -3.1 },
            { month: undefined, high: 11.6, low: -3.7 },
            { month: 'Apr', high: 14.8, low: 0.5 },
        ];

        const RANGE_BAR_UNDEFINED_CATEGORY_KEY_OPTIONS: AgChartOptions = {
            data: RANGE_BAR_UNDEFINED_CATEGORY_KEY_DATA,
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
            series: [
                {
                    type: 'range-bar',
                    xKey: 'month',
                    yLowKey: 'low',
                    yHighKey: 'high',
                },
            ],
        };

        const RANGE_BAR_NULL_AND_UNDEFINED_KEYS_OPTIONS: AgChartOptions = {
            data: RANGE_BAR_NULL_AND_UNDEFINED_KEYS_DATA,
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
            series: [
                {
                    type: 'range-bar',
                    xKey: 'month',
                    yLowKey: 'low',
                    yHighKey: 'high',
                },
            ],
        };

        it('should reject undefined category key with warning', async () => {
            const options: AgChartOptions = { ...RANGE_BAR_UNDEFINED_CATEGORY_KEY_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [undefined] for [RangeBarSeries-1 / xValue] ignored:",
    "[undefined]",
  ],
]
`);
            await compare();
        });

        it('should accept undefined category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...RANGE_BAR_UNDEFINED_CATEGORY_KEY_OPTIONS,
                series: [
                    {
                        ...RANGE_BAR_UNDEFINED_CATEGORY_KEY_OPTIONS.series![0],
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
                ...RANGE_BAR_NULL_AND_UNDEFINED_KEYS_OPTIONS,
                series: [
                    {
                        ...RANGE_BAR_NULL_AND_UNDEFINED_KEYS_OPTIONS.series![0],
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

    describe('bigint values (AG-16608)', () => {
        const numberAxes = { x: { type: 'number' as const }, y: { type: 'number' as const } };

        it('renders a plain range-bar series with out-of-safe-range bigint values', async () => {
            expect(
                await renderEnterpriseChartImage(ctx, {
                    data: [
                        { x: 1, lo: NEG_BIG, hi: BIG },
                        { x: 2, lo: NEG_BIG * 2n, hi: BIG * 2n },
                        { x: 3, lo: NEG_BIG, hi: BIG * 3n },
                    ],
                    series: [{ type: 'range-bar', xKey: 'x', yLowKey: 'lo', yHighKey: 'hi' }],
                    axes: numberAxes,
                })
            ).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('renders a grouped range-bar series with bigint values', async () => {
            expect(
                await renderEnterpriseChartImage(ctx, {
                    data: [
                        { x: 1, lo: NEG_BIG, hi: BIG, lo2: NEG_BIG * 2n, hi2: BIG * 2n },
                        { x: 2, lo: NEG_BIG * 2n, hi: BIG * 2n, lo2: NEG_BIG, hi2: BIG * 3n },
                    ],
                    series: [
                        { type: 'range-bar', xKey: 'x', yLowKey: 'lo', yHighKey: 'hi', grouped: true },
                        { type: 'range-bar', xKey: 'x', yLowKey: 'lo2', yHighKey: 'hi2', grouped: true },
                    ],
                    axes: numberAxes,
                })
            ).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });
    });

    describe('ISO datetime (AG-16654)', () => {
        it('renders a range-bar series with ISO-8601 datetime-string x values on a unit-time axis', async () => {
            expect(
                await renderEnterpriseChartImage(ctx, {
                    data: [
                        { time: '2024-01-15T09:00:00Z', lo: 4, hi: 12 },
                        { time: '2024-01-15T10:00:00Z', lo: 6, hi: 15 },
                        { time: '2024-01-15T11:00:00Z', lo: 3, hi: 11 },
                        { time: '2024-01-15T12:00:00Z', lo: 8, hi: 18 },
                    ],
                    series: [{ type: 'range-bar', xKey: 'time', yLowKey: 'lo', yHighKey: 'hi' }],
                    axes: { x: { type: 'unit-time' }, y: { type: 'number' } },
                })
            ).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });
    });

    describe('bigint high-volume aggregation invariance (AG-16608)', () => {
        const N = HIGH_VOLUME_COUNT;
        const row = (toValue: (v: number) => number | bigint, base: number, i: number) => ({
            x: i + 1,
            lo: toValue(base - 5),
            hi: toValue(base + 5),
        });

        it.each(HIGH_VOLUME_SIGNALS)(
            'renders a %s high-volume bigint range-bar identically to its Number baseline',
            async (_label, sig) => {
                await expectPixelIdenticalAcrossMagnitude(
                    ctx,
                    createEnterpriseChart,
                    magnitudePair(
                        {
                            series: [{ type: 'range-bar', xKey: 'x', yLowKey: 'lo', yHighKey: 'hi' }],
                            axes: STRIPPED_NUMBER_AXES,
                        },
                        (toValue) => Array.from({ length: N }, (_, i) => row(toValue, sig(i), i)),
                        scaleToBigIntFinite
                    )
                );
            }
        );

        it('renders high-volume ISO-string x identically to numeric epoch x on a time axis', async () => {
            await expectPixelIdenticalAcrossMagnitude(
                ctx,
                createEnterpriseChart,
                isoEpochPair(
                    {
                        series: [{ type: 'range-bar', xKey: 'x', yLowKey: 'lo', yHighKey: 'hi' }],
                        axes: STRIPPED_UNIT_TIME_AXES,
                    },
                    N,
                    (x, i) => ({ x, lo: Math.sin(i / 10) - 1, hi: Math.sin(i / 10) + 1 })
                )
            );
        });
    });

    describe('bigint magnitude invariance (AG-16608)', () => {
        const single = (rows: Array<[number, number]>) => (toValue: (v: number) => number | bigint) =>
            rows.map(([lo, hi], i) => ({ x: i + 1, lo: toValue(lo), hi: toValue(hi) }));
        const paired = (rows: Array<[number, number, number, number]>) => (toValue: (v: number) => number | bigint) =>
            rows.map(([lo, hi, lo2, hi2], i) => ({
                x: i + 1,
                lo: toValue(lo),
                hi: toValue(hi),
                lo2: toValue(lo2),
                hi2: toValue(hi2),
            }));

        it('positions a plain range-bar series identically when scaled beyond Number.MAX_VALUE', async () => {
            await expectPixelIdenticalAcrossMagnitude(
                ctx,
                createEnterpriseChart,
                magnitudePair(
                    {
                        series: [{ type: 'range-bar', xKey: 'x', yLowKey: 'lo', yHighKey: 'hi' }],
                        axes: STRIPPED_NUMBER_AXES,
                    },
                    single([
                        [-3, 3],
                        [-6, 6],
                        [-3, 9],
                    ])
                )
            );
        });

        it('positions a grouped range-bar series identically when scaled beyond Number.MAX_VALUE', async () => {
            await expectPixelIdenticalAcrossMagnitude(
                ctx,
                createEnterpriseChart,
                magnitudePair(
                    {
                        series: [
                            { type: 'range-bar', xKey: 'x', yLowKey: 'lo', yHighKey: 'hi', grouped: true },
                            { type: 'range-bar', xKey: 'x', yLowKey: 'lo2', yHighKey: 'hi2', grouped: true },
                        ],
                        axes: STRIPPED_NUMBER_AXES,
                    },
                    paired([
                        [-3, 3, -6, 6],
                        [-6, 6, -3, 9],
                    ])
                )
            );
        });
    });
});

describe('RangeBarSeries category/gridline pixel alignment', () => {
    setupMockCanvas();

    let chart: any;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const DATA = CATEGORIES.map((c, i) => ({ cat: c, low: 20 + i * 5, high: 60 + i * 8 }));
    const DPRS = [1, 1.75, 2, 2.5];
    const WIDTHS = [300, 641, 799, 1000];

    for (const dpr of DPRS) {
        for (const width of WIDTHS) {
            it(`every bar centre coincides with a gridline (dpr ${dpr}, width ${width})`, async () => {
                const options: any = prepareEnterpriseTestOptions({
                    data: DATA,
                    series: [{ type: 'range-bar', xKey: 'cat', yLowKey: 'low', yHighKey: 'high' }],
                    axes: CATEGORY_CENTRE_GRIDLINE_AXES,
                } as any);
                options.width = width;
                options.height = 400;
                options.overrideDevicePixelRatio = dpr;

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                expectBarCentresOnCategoryGridlines(chart, CATEGORIES.length);
            });
        }
    }
});
