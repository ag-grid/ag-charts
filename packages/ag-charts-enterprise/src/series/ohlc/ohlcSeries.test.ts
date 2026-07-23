import { afterEach, describe, expect, it } from 'vitest';

import { type AgCartesianChartOptions, type AgChartInstance, type AgChartOptions, AgCharts } from 'ag-charts-community';
import {
    BIG,
    HIGH_VOLUME_COUNT,
    HIGH_VOLUME_SIGNALS,
    IMAGE_SNAPSHOT_DEFAULTS,
    NEG_BIG,
    STRIPPED_NUMBER_AXES,
    STRIPPED_UNIT_TIME_AXES,
    type SceneGeometrySample,
    compareImageSnapshot,
    createSceneGeometrySampler,
    expectAnimatedEndpointsMatchStatic,
    expectNoAnimation,
    expectPixelIdenticalAcrossMagnitude,
    expectWarningsCalls,
    isoEpochPair,
    magnitudePair,
    scaleToBigIntFinite,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    waitForChartStability,
} from 'ag-charts-community-test';

import { createEnterpriseChart, prepareEnterpriseTestOptions, renderEnterpriseChartImage } from '../../test/utils';

const OHLC_OPTIONS: AgChartOptions = {
    data: [
        { year: new Date(2020, 0, 1), low: 3.07, close: 4.78, open: 6.3, high: 7.27 },
        { year: new Date(2021, 0, 1), low: 4.87, open: 5.8, close: 6.66, high: 7.09 },
        { year: new Date(2022, 0, 1), low: 4.4, close: 4.41, open: 4.96, high: 5.2 },
        { year: new Date(2023, 0, 1), low: 7.31, open: 7.32, close: 7.33, high: 7.33 },
    ],
    series: [
        {
            type: 'ohlc',
            xKey: 'year',
            lowKey: 'low',
            openKey: 'open',
            closeKey: 'close',
            highKey: 'high',
        },
    ],
};

describe('OhlcSeries', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    const compareSnapshot = async (chart: any) => {
        await compareImageSnapshot(chart, ctx);

        chart.destroy();
    };

    it(`should render a ohlc chart as expected with default ordinal time x-axis`, async () => {
        const options = OHLC_OPTIONS;
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a ohlc chart with a unit time x-axis`, async () => {
        const options: AgChartOptions = {
            ...OHLC_OPTIONS,
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
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a ohlc chart as expected with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...OHLC_OPTIONS,
            axes: {
                y: {
                    type: 'number',
                    position: 'left',
                    reverse: true,
                },
                x: {
                    type: 'ordinal-time',
                    position: 'bottom',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a ohlc chart with a reversed unit time x-axis`, async () => {
        const options: AgChartOptions = {
            ...OHLC_OPTIONS,
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
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a ohlc chart with a time x-axis`, async () => {
        const options: AgChartOptions = {
            ...OHLC_OPTIONS,
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
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a ohlc chart with a reversed time x-axis`, async () => {
        const options: AgChartOptions = {
            ...OHLC_OPTIONS,
            axes: {
                y: {
                    position: 'left',
                    type: 'number',
                },
                x: {
                    position: 'bottom',
                    type: 'time',
                    nice: false,
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render an ohlc chart with RTL enabled`, async () => {
        const options: AgChartOptions = {
            ...OHLC_OPTIONS,
            enableRtl: true,
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    // OHLC and candlestick share `OhlcSeriesBase`, which implements no animation hooks (only a direct
    // `resetDatumAnimation`) — so, like candlestick, every action SNAPS: the whole layout lands instantly
    // and completely on the first captured frame. These contracts lock that in: adding animation support
    // later must revisit them deliberately.
    describe('animation -test page actions', () => {
        const frames = spyOnAnimationFrames();
        let chart: AgChartInstance | undefined;

        afterEach(() => {
            chart?.destroy();
            chart = undefined;
        });

        // The y-axis is pinned (0..10, all OHLC values inside it) so a data change never rescales the
        // value axis: bar heights reflect the data alone. The ordinal-time x-axis is left unpinned so
        // add/remove exercise the real band reflow (the layout snaps to the new band count). Winter
        // (January) dates resolve to GMT under the suite's Europe/London TZ.
        const barData = () => [
            { date: new Date(2023, 0, 1), low: 2, open: 4, close: 6, high: 8 },
            { date: new Date(2023, 0, 2), low: 3, open: 6, close: 4, high: 7 },
            { date: new Date(2023, 0, 3), low: 1, open: 3, close: 5, high: 6 },
        ];
        const ohlcOptions = (): AgCartesianChartOptions =>
            prepareEnterpriseTestOptions({
                data: barData(),
                series: [
                    { type: 'ohlc', xKey: 'date', lowKey: 'low', openKey: 'open', closeKey: 'close', highKey: 'high' },
                ],
                axes: {
                    x: { type: 'ordinal-time', position: 'bottom' },
                    y: { type: 'number', position: 'left', min: 0, max: 10 },
                },
            }) as AgCartesianChartOptions;

        // Each bar is one Path node keyed by its date; the Date stringifies with a timezone suffix, so
        // match on the leading `Day Mon DD YYYY`.
        const barKeys = (sample: SceneGeometrySample) =>
            [...sample.keys()].filter((k) => /^series\[0\]\/path\[/.test(k));
        const barCount = (sample: SceneGeometrySample) => barKeys(sample).length;
        const barKey = (sample: SceneGeometrySample, datePrefix: string) => {
            const key = barKeys(sample).find((k) => k.startsWith(`series[0]/path[${datePrefix}`));
            expect(key, `bar for ${datePrefix}`).toBeDefined();
            return key!;
        };

        // A drawn OHLC bar has three subpaths (high-low line, open tick, close tick) spanning a real
        // high-to-low pixel height — the anti-vacuity guard that the node is rendered at full size, not
        // parked collapsed at a baseline waiting to grow.
        const expectDrawnAtFullRange = (sample: SceneGeometrySample, key: string) => {
            const node = sample.get(key);
            expect(node, key).toBeDefined();
            expect(node!.subpaths, `${key} subpaths`).toBe(3);
            expect(node!.height, `${key} height`).toBeGreaterThan(20);
        };

        // OHLC implements no animation hooks and skips its batch on every update, so a data change
        // SNAPS: the whole layout (surviving bars rebanding, axis reflow) already sits at its settled
        // state on the first captured frame.
        const captureSnap = (options: AgCartesianChartOptions, action: () => void | Promise<void>) => {
            chart = AgCharts.create(options);
            return frames.captureSnap(chart, createSceneGeometrySampler(chart), action);
        };

        it('initial load: bars render instantly at their full ranges', async () => {
            chart = AgCharts.create(ohlcOptions());
            const sampleScene = createSceneGeometrySampler(chart);
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            // Anti-vacuity: every bar is already drawn at full high-to-low height on frame 0. A reveal
            // would start collapsed here and grow, which expectNoAnimation would then catch — so the two
            // assertions together are non-vacuous (expectNoAnimation alone passes on a blank scene).
            expect(barCount(trajectory[0])).toBe(3);
            for (const key of barKeys(trajectory[0])) {
                expectDrawnAtFullRange(trajectory[0], key);
            }
            expectNoAnimation(trajectory);
        });

        it('update value: the changed bar snaps to its new range', async () => {
            const data = barData();
            data[2] = { ...data[2], close: 8, high: 9.5 };
            const { before, trajectory, after } = await captureSnap(ohlcOptions(), () =>
                chart!.update({ ...ohlcOptions(), data })
            );
            const changed = barKey(after, 'Tue Jan 03 2023');
            // Anti-vacuity: the changed bar genuinely grew, and it is already at that taller height on
            // frame 0 — the snap, not a tween.
            expect(after.get(changed)!.height, 'changed bar grew').toBeGreaterThan(before.get(changed)!.height + 30);
            expect(
                Math.abs(trajectory[0].get(changed)!.height - after.get(changed)!.height),
                'changed bar at full height on frame 0'
            ).toBeLessThan(1);
            // The other bars never moved across the update.
            const held = barKey(before, 'Sun Jan 01 2023');
            expect(Math.abs(after.get(held)!.height - before.get(held)!.height), 'untouched bar held').toBeLessThan(1);
            expectNoAnimation(trajectory);
        });

        it('add data: a new bar appears instantly and the layout snaps', async () => {
            const { before, trajectory, after } = await captureSnap(ohlcOptions(), () =>
                chart!.update({
                    ...ohlcOptions(),
                    data: [...barData(), { date: new Date(2023, 0, 4), low: 2, open: 5, close: 7, high: 9 }],
                })
            );
            // Anti-vacuity: the bar count grew and the entrant is drawn at full size on frame 0.
            expect(barCount(before)).toBe(3);
            expect(barCount(after)).toBe(4);
            expect(barCount(trajectory[0])).toBe(4);
            expectDrawnAtFullRange(trajectory[0], barKey(trajectory[0], 'Wed Jan 04 2023'));
            // The bands genuinely re-flowed: a survivor moved a wide margin from its 3-band position,
            // yet it is already at its new x on frame 0 (snapped, not sliding across).
            const survivor = barKey(before, 'Sun Jan 01 2023');
            expect(Math.abs(after.get(survivor)!.x - before.get(survivor)!.x), 'survivor rebanded').toBeGreaterThan(5);
            expect(
                Math.abs(trajectory[0].get(survivor)!.x - after.get(survivor)!.x),
                'survivor at new band on frame 0'
            ).toBeLessThan(1);
            expectNoAnimation(trajectory);
        });

        it('remove data: the last bar disappears instantly and the layout snaps', async () => {
            const { before, trajectory, after } = await captureSnap(ohlcOptions(), () =>
                chart!.update({ ...ohlcOptions(), data: barData().slice(0, 2) })
            );
            // Anti-vacuity: the bar count shrank and the dropped bar is already gone on frame 0 (a
            // fade-out would keep it present and collapsing over the trajectory).
            expect(barCount(before)).toBe(3);
            expect(barCount(after)).toBe(2);
            expect(barKeys(trajectory[0]).some((k) => k.startsWith('series[0]/path[Tue Jan 03 2023'))).toBe(false);
            // The survivors genuinely widened their bands, snapped in place on frame 0.
            const survivor = barKey(before, 'Sun Jan 01 2023');
            expect(Math.abs(after.get(survivor)!.x - before.get(survivor)!.x), 'survivor rebanded').toBeGreaterThan(5);
            expect(
                Math.abs(trajectory[0].get(survivor)!.x - after.get(survivor)!.x),
                'survivor at new band on frame 0'
            ).toBeLessThan(1);
            expectNoAnimation(trajectory);
        });

        // Endpoint sanity guards: the (snapped) animated route must settle at exactly the pixels a
        // static render of the same options produces. In-memory pixel comparison — no new image
        // snapshot. One chart per test: the mock canvas only snapshots the first chart created.
        it('sanity: update value endpoints match static renders', async () => {
            const before = ohlcOptions();
            const data = barData();
            data[2] = { ...data[2], close: 8, high: 9.5 };
            chart = AgCharts.create(before);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, before, {
                ...ohlcOptions(),
                data,
            });
        });

        it('sanity: add data endpoints match static renders', async () => {
            const before = ohlcOptions();
            chart = AgCharts.create(before);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, before, {
                ...ohlcOptions(),
                data: [...barData(), { date: new Date(2023, 0, 4), low: 2, open: 5, close: 7, high: 9 }],
            });
        });

        it('sanity: remove data endpoints match static renders', async () => {
            const before = ohlcOptions();
            chart = AgCharts.create(before);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, before, {
                ...ohlcOptions(),
                data: barData().slice(0, 2),
            });
        });
    });

    describe('null category key', () => {
        const OHLC_NULL_CATEGORY_KEY_DATA = [
            { year: '2020', low: 3.07, close: 4.78, open: 6.3, high: 7.27 },
            { year: null, low: 4.87, open: 5.8, close: 6.66, high: 7.09 },
            { year: '2022', low: 4.4, close: 4.41, open: 4.96, high: 5.2 },
        ];

        const OHLC_NULL_CATEGORY_KEY_OPTIONS: AgChartOptions = {
            data: OHLC_NULL_CATEGORY_KEY_DATA,
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
            series: [
                {
                    type: 'ohlc',
                    xKey: 'year',
                    lowKey: 'low',
                    openKey: 'open',
                    closeKey: 'close',
                    highKey: 'high',
                },
            ],
        };

        it('should reject null category key with warning', async () => {
            const options: AgChartOptions = { ...OHLC_NULL_CATEGORY_KEY_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            const chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [ohlc-1 / xValue] ignored:",
    "[null]",
  ],
]
`);
            await compareSnapshot(chart);
        });

        it('should accept null category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...OHLC_NULL_CATEGORY_KEY_OPTIONS,
                series: [
                    {
                        ...OHLC_NULL_CATEGORY_KEY_OPTIONS.series![0],
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            const chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compareSnapshot(chart);
        });
    });

    describe('undefined category key', () => {
        const OHLC_UNDEFINED_CATEGORY_KEY_DATA = [
            { year: '2020', low: 3.07, close: 4.78, open: 6.3, high: 7.27 },
            { year: undefined, low: 4.87, open: 5.8, close: 6.66, high: 7.09 },
            { year: '2022', low: 4.4, close: 4.41, open: 4.96, high: 5.2 },
        ];

        const OHLC_NULL_AND_UNDEFINED_KEYS_DATA = [
            { year: '2020', low: 3.07, close: 4.78, open: 6.3, high: 7.27 },
            { year: null, low: 4, open: 5, close: 6, high: 7 },
            { year: undefined, low: 4.87, open: 5.8, close: 6.66, high: 7.09 },
            { year: '2023', low: 4.4, close: 4.41, open: 4.96, high: 5.2 },
        ];

        const OHLC_UNDEFINED_CATEGORY_KEY_OPTIONS: AgChartOptions = {
            data: OHLC_UNDEFINED_CATEGORY_KEY_DATA,
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
            series: [
                {
                    type: 'ohlc',
                    xKey: 'year',
                    lowKey: 'low',
                    openKey: 'open',
                    closeKey: 'close',
                    highKey: 'high',
                },
            ],
        };

        const OHLC_NULL_AND_UNDEFINED_KEYS_OPTIONS: AgChartOptions = {
            data: OHLC_NULL_AND_UNDEFINED_KEYS_DATA,
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
            series: [
                {
                    type: 'ohlc',
                    xKey: 'year',
                    lowKey: 'low',
                    openKey: 'open',
                    closeKey: 'close',
                    highKey: 'high',
                },
            ],
        };

        it('should reject undefined category key with warning', async () => {
            const options: AgChartOptions = { ...OHLC_UNDEFINED_CATEGORY_KEY_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            const chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [undefined] for [ohlc-1 / xValue] ignored:",
    "[undefined]",
  ],
]
`);
            await compareSnapshot(chart);
        });

        it('should accept undefined category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...OHLC_UNDEFINED_CATEGORY_KEY_OPTIONS,
                series: [
                    {
                        ...OHLC_UNDEFINED_CATEGORY_KEY_OPTIONS.series![0],
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            const chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compareSnapshot(chart);
        });

        it('should treat null and undefined as distinct categories when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...OHLC_NULL_AND_UNDEFINED_KEYS_OPTIONS,
                series: [
                    {
                        ...OHLC_NULL_AND_UNDEFINED_KEYS_OPTIONS.series![0],
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            const chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compareSnapshot(chart);
        });
    });

    describe.each(['ohlc', 'candlestick'] as const)('%s', (seriesType) => {
        const keys = { xKey: 'x', lowKey: 'low', openKey: 'open', closeKey: 'close', highKey: 'high' } as const;

        describe('bigint values (AG-16608)', () => {
            it(`renders a plain ${seriesType} series with out-of-safe-range bigint values`, async () => {
                expect(
                    await renderEnterpriseChartImage(ctx, {
                        data: [
                            { x: 1, low: BIG, open: BIG * 2n, close: BIG * 3n, high: BIG * 4n },
                            { x: 2, low: BIG * 2n, open: BIG * 3n, close: BIG * 2n, high: BIG * 5n },
                            { x: 3, low: NEG_BIG, open: 0n, close: BIG, high: BIG * 2n },
                        ],
                        series: [{ type: seriesType, ...keys }],
                        axes: { x: { type: 'number' }, y: { type: 'number' } },
                    })
                ).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
            });
        });

        describe('ISO datetime (AG-16654)', () => {
            it(`renders a ${seriesType} series with ISO-8601 datetime-string x values on a unit-time axis`, async () => {
                expect(
                    await renderEnterpriseChartImage(ctx, {
                        data: [
                            { x: '2024-01-15T09:00:00Z', low: 3, open: 4, close: 6, high: 7 },
                            { x: '2024-01-15T10:00:00Z', low: 5, open: 6, close: 5, high: 8 },
                            { x: '2024-01-15T11:00:00Z', low: 2, open: 3, close: 4, high: 5 },
                        ],
                        series: [{ type: seriesType, ...keys }],
                        axes: { x: { type: 'unit-time' }, y: { type: 'number' } },
                    })
                ).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
            });
        });

        describe('bigint magnitude invariance (AG-16608)', () => {
            const bars = (rows: Array<[number, number, number, number]>) => (toValue: (v: number) => number | bigint) =>
                rows.map(([low, open, close, high], i) => ({
                    x: i + 1,
                    low: toValue(low),
                    open: toValue(open),
                    close: toValue(close),
                    high: toValue(high),
                }));

            it(`positions a plain ${seriesType} series identically when scaled beyond Number.MAX_VALUE`, async () => {
                await expectPixelIdenticalAcrossMagnitude(
                    ctx,
                    createEnterpriseChart,
                    magnitudePair(
                        { series: [{ type: seriesType, ...keys }], axes: STRIPPED_NUMBER_AXES },
                        bars([
                            [1, 2, 3, 4],
                            [2, 3, 2, 5],
                            [1, 2, 4, 5],
                        ])
                    )
                );
            });
        });
    });

    describe('bigint high-volume aggregation invariance (AG-16608)', () => {
        const N = HIGH_VOLUME_COUNT;
        const keys = { xKey: 'x', lowKey: 'low', openKey: 'open', closeKey: 'close', highKey: 'high' } as const;
        const bar = (toValue: (v: number) => number | bigint, base: number, i: number) => ({
            x: i + 1,
            low: toValue(base - 5),
            open: toValue(base - 2),
            close: toValue(base + 2),
            high: toValue(base + 5),
        });

        it.each(HIGH_VOLUME_SIGNALS)(
            'renders a %s high-volume bigint ohlc series identically to its Number baseline',
            async (_label, sig) => {
                await expectPixelIdenticalAcrossMagnitude(
                    ctx,
                    createEnterpriseChart,
                    magnitudePair(
                        { series: [{ type: 'ohlc', ...keys }], axes: STRIPPED_NUMBER_AXES },
                        (toValue) => Array.from({ length: N }, (_, i) => bar(toValue, sig(i), i)),
                        scaleToBigIntFinite
                    )
                );
            }
        );

        it('renders high-volume ISO-string x identically to numeric epoch x on a time axis', async () => {
            await expectPixelIdenticalAcrossMagnitude(
                ctx,
                createEnterpriseChart,
                isoEpochPair({ series: [{ type: 'ohlc', ...keys }], axes: STRIPPED_UNIT_TIME_AXES }, N, (x, i) => {
                    const b = Math.sin(i / 10) * 5;
                    return { x, low: b - 5, open: b - 2, close: b + 2, high: b + 5 };
                })
            );
        });
    });
});
