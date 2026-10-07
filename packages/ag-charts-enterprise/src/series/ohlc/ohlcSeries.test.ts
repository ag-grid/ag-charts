import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    type AgCartesianChartOptions,
    type AgChartInstance,
    type AgChartOptions,
    AgCharts,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    BIG,
    HIGH_VOLUME_COUNT,
    HIGH_VOLUME_SIGNALS,
    IMAGE_SNAPSHOT_DEFAULTS,
    NEG_BIG,
    STRIPPED_NUMBER_AXES,
    STRIPPED_UNIT_TIME_AXES,
    type SceneGeometrySample,
    clickAction,
    compareImageSnapshot,
    createSceneGeometrySampler,
    deproxy,
    expectAnimatedEndpointsMatchStatic,
    expectNoAnimation,
    expectPixelIdenticalAcrossMagnitude,
    expectWarningsCalls,
    focusIndicatorContainsCanvasPoint,
    isoEpochPair,
    magnitudePair,
    pressKey,
    scaleToBigIntFinite,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    tabIntoChart,
    waitForChartStability,
} from 'ag-charts-community-test';
import { Caster } from 'ag-charts-test';

import {
    DEFAULT_DISABLED_SHADOW,
    SHADOW,
    createEnterpriseChart,
    itemNodes,
    prepareEnterpriseTestOptions,
    renderEnterpriseChartImage,
    shadowedShapes,
} from '../../test/utils';
import { OhlcSeries } from './ohlcSeries';

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

    // `OhlcSeriesBase` implements no animation hooks, so every action must land completely on the
    // first captured frame; adding animation support means revisiting these contracts.
    describe('animation -test page actions', () => {
        const frames = spyOnAnimationFrames();
        let chart: AgChartInstance | undefined;

        afterEach(() => {
            chart?.destroy();
            chart = undefined;
        });

        // The y-axis is pinned so bar heights reflect the data alone; the x-axis is left unpinned so
        // add/remove exercise the real band reflow.
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

        // The Date key stringifies with a timezone suffix, so match on the leading `Day Mon DD YYYY`.
        const barKeys = (sample: SceneGeometrySample) =>
            [...sample.keys()].filter((k) => /^series\[0\]\/path\[/.test(k));
        const barCount = (sample: SceneGeometrySample) => barKeys(sample).length;
        const barKey = (sample: SceneGeometrySample, datePrefix: string) => {
            const key = barKeys(sample).find((k) => k.startsWith(`series[0]/path[${datePrefix}`));
            expect(key, `bar for ${datePrefix}`).toBeDefined();
            return key!;
        };

        // Anti-vacuity: three subpaths over a real pixel height means the bar is drawn at full size,
        // not parked collapsed at a baseline waiting to grow.
        const expectDrawnAtFullRange = (sample: SceneGeometrySample, key: string) => {
            const node = sample.get(key);
            expect(node, key).toBeDefined();
            expect(node!.subpaths, `${key} subpaths`).toBe(3);
            expect(node!.height, `${key} height`).toBeGreaterThan(20);
        };

        const captureSnap = (options: AgCartesianChartOptions, action: () => void | Promise<void>) => {
            chart = AgCharts.create(options);
            return frames.captureSnap(chart, createSceneGeometrySampler(chart), action);
        };

        it('initial load: bars render instantly at their full ranges', async () => {
            chart = AgCharts.create(ohlcOptions());
            const sampleScene = createSceneGeometrySampler(chart);
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            // Anti-vacuity: expectNoAnimation alone passes on a blank scene.
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
            expect(after.get(changed)!.height, 'changed bar grew').toBeGreaterThan(before.get(changed)!.height + 30);
            expect(
                Math.abs(trajectory[0].get(changed)!.height - after.get(changed)!.height),
                'changed bar at full height on frame 0'
            ).toBeLessThan(1);
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
            expect(barCount(before)).toBe(3);
            expect(barCount(after)).toBe(4);
            expect(barCount(trajectory[0])).toBe(4);
            expectDrawnAtFullRange(trajectory[0], barKey(trajectory[0], 'Wed Jan 04 2023'));
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
            expect(barCount(before)).toBe(3);
            expect(barCount(after)).toBe(2);
            expect(barKeys(trajectory[0]).some((k) => k.startsWith('series[0]/path[Tue Jan 03 2023'))).toBe(false);
            const survivor = barKey(before, 'Sun Jan 01 2023');
            expect(Math.abs(after.get(survivor)!.x - before.get(survivor)!.x), 'survivor rebanded').toBeGreaterThan(5);
            expect(
                Math.abs(trajectory[0].get(survivor)!.x - after.get(survivor)!.x),
                'survivor at new band on frame 0'
            ).toBeLessThan(1);
            expectNoAnimation(trajectory);
        });

        // One chart per test: the mock canvas only snapshots the first chart created.
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

    describe('shadow', () => {
        const SPREAD_SHADOW = { ...SHADOW, spread: 6 };

        const buildOptions = (shadow?: typeof SHADOW & { spread?: number }): AgChartOptions => {
            const options = { ...OHLC_OPTIONS, series: [{ ...OHLC_OPTIONS.series![0], shadow }] } as AgChartOptions;
            prepareEnterpriseTestOptions(options as any);
            return options;
        };

        it('defaults to a disabled shadow', async () => {
            const chart: any = await createEnterpriseChart(buildOptions());

            expect(chart.series[0]['options'].shadow).toEqual(DEFAULT_DISABLED_SHADOW);
            chart.destroy();
        });

        it('shadows nothing when no shadow is set', async () => {
            const chart: any = await createEnterpriseChart(buildOptions());

            expect(itemNodes(chart)).toHaveLength(4);
            expect(shadowedShapes(chart.series[0].contentGroup)).toEqual([]);
            chart.destroy();
        });

        it('casts the shadow from the stroke of every item, whichever direction', async () => {
            const chart: any = await createEnterpriseChart(buildOptions(SHADOW));

            const shapes = itemNodes(chart);
            expect(shapes).toHaveLength(4);
            for (const shape of shapes) {
                expect(shape.shadowMode).toBe('stroke');
                expect(shape.fillShadow).toMatchObject(SHADOW);
            }
            chart.destroy();
        });

        it('should render an ohlc chart with a shadow', async () => {
            await compareSnapshot(AgCharts.create(buildOptions(SHADOW)));
        });

        it('carries the shadow spread to the stroke shadow of every item', async () => {
            const chart: any = await createEnterpriseChart(buildOptions(SPREAD_SHADOW));

            expect(itemNodes(chart).length).toBeGreaterThan(0);

            for (const shape of itemNodes(chart)) {
                expect(shape.shadowMode).toBe('stroke');
                expect(shape.fillShadow).toMatchObject(SPREAD_SHADOW);
            }
            chart.destroy();
        });

        it('should render an ohlc chart with a shadow spread', async () => {
            await compareSnapshot(AgCharts.create(buildOptions(SPREAD_SHADOW)));
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

    describe('keyboard navigation on aggregated data (AG-16824)', () => {
        let chart: AgChartInstance;
        let seriesNodeClick: Mock;

        beforeEach(() => {
            seriesNodeClick = vi.fn();
        });

        afterEach(() => {
            chart?.destroy();
            (chart as any) = undefined;
        });

        async function createChart(options: AgChartOptions) {
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
        }

        function getCandleCentre(nodeIndex: number) {
            const series = new Caster(deproxy(chart!))
                .accessProperty('series')
                .accessProperty('0')
                .cast(OhlcSeries).value;
            const nodeData = series.getNodeData();
            expect(nodeData).toBeDefined();
            const node = nodeData![nodeIndex];
            expect(node).toBeDefined();
            return _ModuleSupport.Transformable.toCanvasPoint(
                series.contentGroup,
                node.centerX,
                node.y + node.height / 2
            );
        }

        async function clickCandle(nodeIndex: number) {
            const { canvasX, canvasY } = getCandleCentre(nodeIndex);
            await clickAction(canvasX, canvasY)(chart!);
            await waitForChartStability(chart!);
        }

        it('ArrowRight focuses the second candle with numeric time x values', async () => {
            const options = prepareEnterpriseTestOptions({
                data: Array.from({ length: 20_000 }, (_row, index) => {
                    const base = 100 + 10 * Math.sin(index / 500);
                    return {
                        index,
                        time: Date.UTC(2024, 0, 1) + index * 60_000,
                        open: base,
                        close: base + Math.cos(index),
                        high: base + 3,
                        low: base - 3,
                    };
                }),
                axes: { x: { type: 'unit-time' }, y: { type: 'number' } },
                series: [
                    { type: 'ohlc', xKey: 'time', openKey: 'open', closeKey: 'close', highKey: 'high', lowKey: 'low' },
                ],
                listeners: { seriesNodeClick },
            });
            await createChart(options);

            await tabIntoChart(chart);
            await pressKey(chart, 'ArrowRight');
            const candle = getCandleCentre(1);
            expect(focusIndicatorContainsCanvasPoint(chart, candle)).toBe(true);

            await pressKey(chart, 'Enter');
            await clickCandle(1);
            expect(seriesNodeClick).toHaveBeenCalledTimes(2);
            expect(seriesNodeClick.mock.calls[0][0].datum.index).toBe(29); // keyboard
            expect(seriesNodeClick.mock.calls[1][0].datum.index).toBe(29); // mouse
        });

        it('ArrowRight focuses the second candle with ISO-string x values', async () => {
            const options = prepareEnterpriseTestOptions({
                data: Array.from({ length: 20_000 }, (_row, index) => {
                    const base = 100 + 10 * Math.sin(index / 500);
                    return {
                        index,
                        time: new Date(Date.UTC(2024, 0, 1) + index * 60_000).toISOString(),
                        open: base,
                        close: base + Math.cos(index),
                        high: base + 3,
                        low: base - 3,
                    };
                }),
                axes: { x: { type: 'unit-time' }, y: { type: 'number' } },
                series: [
                    { type: 'ohlc', xKey: 'time', openKey: 'open', closeKey: 'close', highKey: 'high', lowKey: 'low' },
                ],
                listeners: { seriesNodeClick },
            });
            await createChart(options);

            await tabIntoChart(chart);
            await pressKey(chart, 'ArrowRight');
            const candle = getCandleCentre(1);
            expect(focusIndicatorContainsCanvasPoint(chart, candle)).toBe(true);

            await pressKey(chart, 'Enter');
            await clickCandle(1);
            expect(seriesNodeClick).toHaveBeenCalledTimes(2);
            expect(seriesNodeClick.mock.calls[0][0].datum.index).toBe(29); // keyboard
            expect(seriesNodeClick.mock.calls[1][0].datum.index).toBe(29); // mouse
        });

        it('ArrowRight focuses the second candle with bigint x values', async () => {
            const options = prepareEnterpriseTestOptions({
                data: Array.from({ length: 20_000 }, (_row, index) => {
                    const base = 100 + 10 * Math.sin(index / 500);
                    return {
                        index,
                        x: 2n ** 60n + BigInt(index) * 1_000_000_000n,
                        open: base,
                        close: base + Math.cos(index),
                        high: base + 3,
                        low: base - 3,
                    };
                }),
                axes: { x: { type: 'number' }, y: { type: 'number' } },
                series: [
                    { type: 'ohlc', xKey: 'x', openKey: 'open', closeKey: 'close', highKey: 'high', lowKey: 'low' },
                ],
                listeners: { seriesNodeClick },
            });
            await createChart(options);

            await tabIntoChart(chart);
            await pressKey(chart, 'ArrowRight');
            const candle = getCandleCentre(1);
            expect(focusIndicatorContainsCanvasPoint(chart, candle)).toBe(true);

            // Candles overlap on a number x axis, so a mouse click cannot single out candle 1 for comparison.
            await pressKey(chart, 'Enter');
            expect(seriesNodeClick).toHaveBeenCalledTimes(1);
            expect(seriesNodeClick.mock.calls[0][0].datum.index).toBe(29);
        });
    });
});
