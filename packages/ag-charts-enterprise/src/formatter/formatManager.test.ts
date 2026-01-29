import { afterEach, describe, expect, it } from '@jest/globals';

import type { AgCartesianChartOptions, AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import {
    expectWarningsCalls,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../test/utils';

describe('Format Manager (Enterprise)', () => {
    setupMockConsole();

    setupMockCanvas();

    let chart: any;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        jest.restoreAllMocks();
    });

    describe('AG-16613 null/undefined category key handling', () => {
        // Test cases for null/undefined handling
        const NULL_KEY_CASES: Array<{
            name: string;
            nullValue: null | undefined;
            allowNullKeys: boolean;
            expectWarning: boolean;
        }> = [
            { name: 'null allowed', nullValue: null, allowNullKeys: true, expectWarning: false },
            { name: 'undefined allowed', nullValue: undefined, allowNullKeys: true, expectWarning: false },
            { name: 'null rejected', nullValue: null, allowNullKeys: false, expectWarning: true },
            { name: 'undefined rejected', nullValue: undefined, allowNullKeys: false, expectWarning: true },
        ];

        // Enterprise cartesian series configurations
        describe('waterfall series', () => {
            const seriesIdPrefix = 'WaterfallSeries';

            it.each(NULL_KEY_CASES)('$name', async ({ nullValue, allowNullKeys, expectWarning }) => {
                const options: AgCartesianChartOptions = {
                    data: [
                        { category: nullValue, value: 100 },
                        { category: 'Mac', value: 50 },
                    ],
                    series: [{ type: 'waterfall', xKey: 'category', yKey: 'value', allowNullKeys } as any],
                };

                chart = AgCharts.create(prepareEnterpriseTestOptions(options));
                await waitForChartStability(chart);

                if (expectWarning) {
                    const valueType = nullValue === null ? 'object' : 'undefined';
                    expectWarningsCalls().toEqual(
                        expect.arrayContaining([
                            expect.arrayContaining([
                                expect.stringMatching(
                                    new RegExp(
                                        `invalid value of type \\[${valueType}\\] for \\[${seriesIdPrefix}-1 / xValue\\] ignored:`
                                    )
                                ),
                            ]),
                        ])
                    );
                } else {
                    expectWarningsCalls().toEqual([]);
                }
            });
        });

        describe('range-bar series', () => {
            const seriesIdPrefix = 'RangeBarSeries';

            it.each(NULL_KEY_CASES)('$name', async ({ nullValue, allowNullKeys, expectWarning }) => {
                const options: AgCartesianChartOptions = {
                    data: [
                        { category: nullValue, low: 10, high: 50 },
                        { category: 'Mac', low: 20, high: 60 },
                    ],
                    series: [
                        { type: 'range-bar', xKey: 'category', yLowKey: 'low', yHighKey: 'high', allowNullKeys } as any,
                    ],
                };

                chart = AgCharts.create(prepareEnterpriseTestOptions(options));
                await waitForChartStability(chart);

                if (expectWarning) {
                    const valueType = nullValue === null ? 'object' : 'undefined';
                    expectWarningsCalls().toEqual(
                        expect.arrayContaining([
                            expect.arrayContaining([
                                expect.stringMatching(
                                    new RegExp(
                                        `invalid value of type \\[${valueType}\\] for \\[${seriesIdPrefix}-1 / xValue\\] ignored:`
                                    )
                                ),
                            ]),
                        ])
                    );
                } else {
                    expectWarningsCalls().toEqual([]);
                }
            });
        });

        describe('range-area series', () => {
            const seriesIdPrefix = 'RangeAreaSeries';

            it.each(NULL_KEY_CASES)('$name', async ({ nullValue, allowNullKeys, expectWarning }) => {
                const options: AgCartesianChartOptions = {
                    data: [
                        { category: nullValue, low: 10, high: 50 },
                        { category: 'Mac', low: 20, high: 60 },
                    ],
                    series: [
                        {
                            type: 'range-area',
                            xKey: 'category',
                            yLowKey: 'low',
                            yHighKey: 'high',
                            allowNullKeys,
                        } as any,
                    ],
                };

                chart = AgCharts.create(prepareEnterpriseTestOptions(options));
                await waitForChartStability(chart);

                if (expectWarning) {
                    const valueType = nullValue === null ? 'object' : 'undefined';
                    expectWarningsCalls().toEqual(
                        expect.arrayContaining([
                            expect.arrayContaining([
                                expect.stringMatching(
                                    new RegExp(
                                        `invalid value of type \\[${valueType}\\] for \\[${seriesIdPrefix}-1 / xValue\\] ignored:`
                                    )
                                ),
                            ]),
                        ])
                    );
                } else {
                    expectWarningsCalls().toEqual([]);
                }
            });
        });

        describe('box-plot series', () => {
            const seriesIdPrefix = 'BoxPlotSeries';

            it.each(NULL_KEY_CASES)('$name', async ({ nullValue, allowNullKeys, expectWarning }) => {
                const options: AgCartesianChartOptions = {
                    data: [
                        { category: nullValue, min: 5, q1: 10, median: 15, q3: 20, max: 25 },
                        { category: 'Mac', min: 10, q1: 15, median: 20, q3: 25, max: 30 },
                    ],
                    series: [
                        {
                            type: 'box-plot',
                            xKey: 'category',
                            minKey: 'min',
                            q1Key: 'q1',
                            medianKey: 'median',
                            q3Key: 'q3',
                            maxKey: 'max',
                            allowNullKeys,
                        } as any,
                    ],
                };

                chart = AgCharts.create(prepareEnterpriseTestOptions(options));
                await waitForChartStability(chart);

                if (expectWarning) {
                    const valueType = nullValue === null ? 'object' : 'undefined';
                    expectWarningsCalls().toEqual(
                        expect.arrayContaining([
                            expect.arrayContaining([
                                expect.stringMatching(
                                    new RegExp(
                                        `invalid value of type \\[${valueType}\\] for \\[${seriesIdPrefix}-1 / xValue\\] ignored:`
                                    )
                                ),
                            ]),
                        ])
                    );
                } else {
                    expectWarningsCalls().toEqual([]);
                }
            });
        });

        describe('candlestick series', () => {
            // Note: candlestick series ID is 'CandleStickSeries-1' (with capital S in Stick)
            const seriesIdPattern = 'CandleStickSeries-1';

            it.each(NULL_KEY_CASES)('$name', async ({ nullValue, allowNullKeys, expectWarning }) => {
                const options: AgCartesianChartOptions = {
                    data: [
                        { year: '2020', low: 3.07, close: 4.78, open: 6.3, high: 7.27 },
                        { year: nullValue, low: 4.87, open: 5.8, close: 6.66, high: 7.09 },
                        { year: '2022', low: 4.4, close: 4.41, open: 4.96, high: 5.2 },
                    ],
                    axes: {
                        x: { type: 'category', position: 'bottom' },
                        y: { type: 'number', position: 'left' },
                    },
                    series: [
                        {
                            type: 'candlestick',
                            xKey: 'year',
                            openKey: 'open',
                            highKey: 'high',
                            lowKey: 'low',
                            closeKey: 'close',
                            allowNullKeys,
                        } as any,
                    ],
                };

                chart = AgCharts.create(prepareEnterpriseTestOptions(options));
                await waitForChartStability(chart);

                if (expectWarning) {
                    const valueType = nullValue === null ? 'object' : 'undefined';
                    expectWarningsCalls().toEqual(
                        expect.arrayContaining([
                            expect.arrayContaining([
                                expect.stringMatching(
                                    new RegExp(
                                        `invalid value of type \\[${valueType}\\] for \\[${seriesIdPattern} / xValue\\] ignored:`
                                    )
                                ),
                            ]),
                        ])
                    );
                } else {
                    expectWarningsCalls().toEqual([]);
                }
            });
        });

        describe('ohlc series', () => {
            // Note: ohlc series ID is 'ohlc-1', not 'OHLCSeries-1'
            const seriesIdPattern = 'ohlc-1';

            it.each(NULL_KEY_CASES)('$name', async ({ nullValue, allowNullKeys, expectWarning }) => {
                const options: AgCartesianChartOptions = {
                    data: [
                        { year: '2020', low: 3.07, close: 4.78, open: 6.3, high: 7.27 },
                        { year: nullValue, low: 4.87, open: 5.8, close: 6.66, high: 7.09 },
                        { year: '2022', low: 4.4, close: 4.41, open: 4.96, high: 5.2 },
                    ],
                    axes: {
                        x: { type: 'category', position: 'bottom' },
                        y: { type: 'number', position: 'left' },
                    },
                    series: [
                        {
                            type: 'ohlc',
                            xKey: 'year',
                            openKey: 'open',
                            highKey: 'high',
                            lowKey: 'low',
                            closeKey: 'close',
                            allowNullKeys,
                        } as any,
                    ],
                };

                chart = AgCharts.create(prepareEnterpriseTestOptions(options));
                await waitForChartStability(chart);

                if (expectWarning) {
                    const valueType = nullValue === null ? 'object' : 'undefined';
                    expectWarningsCalls().toEqual(
                        expect.arrayContaining([
                            expect.arrayContaining([
                                expect.stringMatching(
                                    new RegExp(
                                        `invalid value of type \\[${valueType}\\] for \\[${seriesIdPattern} / xValue\\] ignored:`
                                    )
                                ),
                            ]),
                        ])
                    );
                } else {
                    expectWarningsCalls().toEqual([]);
                }
            });
        });

        // Enterprise polar/radial series configurations
        describe('radial-bar series', () => {
            const seriesIdPrefix = 'RadialBarSeries';

            it.each(NULL_KEY_CASES)('$name', async ({ nullValue, allowNullKeys, expectWarning }) => {
                const options: AgChartOptions = {
                    data: [
                        { category: nullValue, value: 10 },
                        { category: 'Mac', value: 20 },
                    ],
                    series: [{ type: 'radial-bar', radiusKey: 'category', angleKey: 'value', allowNullKeys } as any],
                };

                chart = AgCharts.create(prepareEnterpriseTestOptions(options));
                await waitForChartStability(chart);

                if (expectWarning) {
                    const valueType = nullValue === null ? 'object' : 'undefined';
                    expectWarningsCalls().toEqual(
                        expect.arrayContaining([
                            expect.arrayContaining([
                                expect.stringMatching(
                                    new RegExp(
                                        `invalid value of type \\[${valueType}\\] for \\[${seriesIdPrefix}-1 / radiusValue\\] ignored:`
                                    )
                                ),
                            ]),
                        ])
                    );
                } else {
                    expectWarningsCalls().toEqual([]);
                }
            });
        });

        describe('radial-column series', () => {
            const seriesIdPrefix = 'RadialColumnSeries';

            it.each(NULL_KEY_CASES)('$name', async ({ nullValue, allowNullKeys, expectWarning }) => {
                const options: AgChartOptions = {
                    data: [
                        { category: nullValue, value: 10 },
                        { category: 'Mac', value: 20 },
                    ],
                    // Note: radial-column uses angleKey for categories, radiusKey for values
                    series: [{ type: 'radial-column', angleKey: 'category', radiusKey: 'value', allowNullKeys } as any],
                };

                chart = AgCharts.create(prepareEnterpriseTestOptions(options));
                await waitForChartStability(chart);

                if (expectWarning) {
                    const valueType = nullValue === null ? 'object' : 'undefined';
                    expectWarningsCalls().toEqual(
                        expect.arrayContaining([
                            expect.arrayContaining([
                                expect.stringMatching(
                                    new RegExp(
                                        `invalid value of type \\[${valueType}\\] for \\[${seriesIdPrefix}-1 / angleValue\\] ignored:`
                                    )
                                ),
                            ]),
                        ])
                    );
                } else {
                    expectWarningsCalls().toEqual([]);
                }
            });
        });

        describe('nightingale series', () => {
            const seriesIdPrefix = 'NightingaleSeries';

            it.each(NULL_KEY_CASES)('$name', async ({ nullValue, allowNullKeys, expectWarning }) => {
                const options: AgChartOptions = {
                    data: [
                        { category: nullValue, value: 10 },
                        { category: 'Mac', value: 20 },
                    ],
                    series: [{ type: 'nightingale', angleKey: 'category', radiusKey: 'value', allowNullKeys } as any],
                };

                chart = AgCharts.create(prepareEnterpriseTestOptions(options));
                await waitForChartStability(chart);

                if (expectWarning) {
                    const valueType = nullValue === null ? 'object' : 'undefined';
                    expectWarningsCalls().toEqual(
                        expect.arrayContaining([
                            expect.arrayContaining([
                                expect.stringMatching(
                                    new RegExp(
                                        `invalid value of type \\[${valueType}\\] for \\[${seriesIdPrefix}-1 / angleValue\\] ignored:`
                                    )
                                ),
                            ]),
                        ])
                    );
                } else {
                    expectWarningsCalls().toEqual([]);
                }
            });
        });
    });
});
