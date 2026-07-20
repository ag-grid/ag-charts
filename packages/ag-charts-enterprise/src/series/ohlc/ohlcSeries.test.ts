import { describe, expect, it } from 'vitest';

import { type AgChartOptions, AgCharts } from 'ag-charts-community';
import {
    BIG,
    HIGH_VOLUME_COUNT,
    HIGH_VOLUME_SIGNALS,
    IMAGE_SNAPSHOT_DEFAULTS,
    NEG_BIG,
    STRIPPED_NUMBER_AXES,
    STRIPPED_UNIT_TIME_AXES,
    compareImageSnapshot,
    expectPixelIdenticalAcrossMagnitude,
    expectWarningsCalls,
    isoEpochPair,
    magnitudePair,
    scaleToBigIntFinite,
    setupMockCanvas,
    setupMockConsole,
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
