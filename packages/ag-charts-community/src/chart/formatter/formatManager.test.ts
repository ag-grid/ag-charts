import { describe, expect, it } from '@jest/globals';

import { getDocument } from 'ag-charts-core';
import type { AgCartesianChartOptions, AgChartInstance, AgPolarChartOptions } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    expectWarningsCalls,
    extractImageData,
    hoverAction,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

describe('Format Manager', () => {
    setupMockConsole();

    const ctx = setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        jest.restoreAllMocks();
    });

    const compare = async (defaults = IMAGE_SNAPSHOT_DEFAULTS) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(defaults);
    };

    it('should return the correct sources', async () => {
        const options: AgCartesianChartOptions = {
            data: [
                { product: 'iPhone', value: 140 },
                { product: 'Mac', value: 20 },
            ],
            series: [
                {
                    type: 'bar',
                    xKey: 'product',
                    yKey: 'value',
                    yName: 'iPhone',
                    label: {
                        enabled: true,
                    },
                },
            ],
            formatter: (params) => params.source,
        };

        chart = AgCharts.create(prepareTestOptions(options));

        await waitForChartStability(chart);

        await compare();
    });

    it('should return the correct bound series', async () => {
        const xFormatter = jest.fn();
        const yFormatter = jest.fn();
        const options: AgCartesianChartOptions = {
            data: [
                { product: 'iPhone', value: 140 },
                { product: 'Mac', value: 20 },
            ],
            series: [
                {
                    type: 'bar',
                    xKey: 'product',
                    yKey: 'value',
                    yName: 'iPhone',
                    label: {
                        enabled: true,
                    },
                },
            ],
            formatter: {
                x: xFormatter,
                y: yFormatter,
            },
        };

        chart = AgCharts.create(prepareTestOptions(options));

        await waitForChartStability(chart);

        expect(xFormatter.mock.calls.at(0)?.at(0)).toEqual({
            boundSeries: [
                {
                    key: 'product',
                    name: undefined,
                    seriesId: 'BarSeries-1',
                },
            ],
            datum: undefined,
            domain: ['iPhone', 'Mac'],
            key: undefined,
            legendItemName: undefined,
            property: 'x',
            seriesId: undefined,
            source: 'axis-label',
            type: 'category',
            value: 'iPhone',
        });
        expect(yFormatter.mock.calls.at(0)?.at(0)).toEqual({
            boundSeries: [
                {
                    key: 'value',
                    name: 'iPhone',
                    seriesId: 'BarSeries-1',
                },
            ],
            datum: undefined,
            domain: [0, 150],
            visibleDomain: [0, 150],
            fractionDigits: 0,
            key: undefined,
            legendItemName: undefined,
            property: 'y',
            seriesId: undefined,
            source: 'axis-label',
            type: 'number',
            value: 0,
        });
        expect(yFormatter.mock.calls.at(-1)?.at(0)).toEqual({
            boundSeries: [
                {
                    key: 'value',
                    name: 'iPhone',
                    seriesId: 'BarSeries-1',
                },
            ],
            datum: {
                product: 'Mac',
                value: 20,
            },
            domain: [0, 140],
            visibleDomain: [0, 140],
            fractionDigits: 2,
            key: 'value',
            legendItemName: undefined,
            property: 'y',
            seriesId: 'BarSeries-1',
            source: 'series-label',
            type: 'number',
            value: 20,
        });
    });

    it('should format pie series legend items', async () => {
        const options: AgPolarChartOptions = {
            data: [
                { product: 'iPhone', value: 140 },
                { product: 'Mac', value: 20 },
            ],
            series: [
                {
                    type: 'pie',
                    legendItemKey: 'product',
                    angleKey: 'value',
                    sectorLabelKey: 'product',
                    calloutLabelKey: 'product',
                },
            ],
            formatter: (params) => `${String(params.value)} (${params.source})`,
        };

        chart = AgCharts.create(prepareTestOptions(options));

        await waitForChartStability(chart);

        await compare();
    });

    it('should format by property', async () => {
        const options: AgCartesianChartOptions = {
            data: [
                { product: 'iPhone', value: 140, growth: 5 },
                { product: 'Mac', value: 20, growth: 10 },
            ],
            series: [
                {
                    type: 'bubble',
                    xKey: 'product',
                    yKey: 'value',
                    sizeKey: 'growth',
                    yName: 'iPhone',
                    label: {
                        enabled: true,
                    },
                },
            ],
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
            formatter: {
                x: () => 'x',
                y: () => 'y',
                size: () => 'size',
            },
        };

        chart = AgCharts.create(prepareTestOptions(options));

        await waitForChartStability(chart);

        await compare();
    });

    it('should format tooltips', async () => {
        const options: AgCartesianChartOptions = {
            data: [
                { product: 'iPhone', value: 140, growth: 5 },
                { product: 'Mac', value: 20, growth: 10 },
            ],
            series: [
                {
                    type: 'bubble',
                    xKey: 'product',
                    yKey: 'value',
                    sizeKey: 'growth',
                    yName: 'iPhone',
                    label: {
                        enabled: true,
                    },
                },
            ],
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
            formatter: {
                x: 'Apple %s',
                y: '#{f}',
                size: '#{f}',
            },
        };

        chart = AgCharts.create(prepareTestOptions(options));
        await waitForChartStability(chart);

        await hoverAction(250, 150)(chart);
        await waitForChartStability(chart);

        const element = getDocument('body').getElementsByClassName('ag-charts-tooltip')[0];
        expect(element.textContent).toMatchInlineSnapshot(`"product Apple iPhone iPhone 140.000 growth 5.000000"`);
    });

    describe('AG-16613 null/undefined category value formatting', () => {
        // Cartesian series configurations with standard xKey/yKey pattern
        const CARTESIAN_SERIES = [
            { type: 'bar' as const, xKey: 'product', yKey: 'value' },
            { type: 'line' as const, xKey: 'product', yKey: 'value' },
            { type: 'area' as const, xKey: 'product', yKey: 'value' },
            { type: 'scatter' as const, xKey: 'product', yKey: 'value' },
        ];

        // Bubble requires sizeKey
        const BUBBLE_SERIES = { type: 'bubble' as const, xKey: 'product', yKey: 'value', sizeKey: 'size' };

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

        const SERIES_ID_MAP: Record<string, string> = {
            bar: 'BarSeries',
            line: 'LineSeries',
            area: 'AreaSeries',
            scatter: 'ScatterSeries',
        };

        function formatNullValue(value: unknown): string {
            if (value === null) return 'NULL';
            if (value === undefined) return 'UNDEF';
            return String(value);
        }

        describe.each(CARTESIAN_SERIES)('$type series', ({ type, xKey, yKey }) => {
            const seriesIdPrefix = SERIES_ID_MAP[type];

            it.each(NULL_KEY_CASES)(
                'chart-level formatter.x: $name',
                async ({ nullValue, allowNullKeys, expectWarning }) => {
                    const xFormatter = jest.fn((params: { value: unknown }) => formatNullValue(params.value));

                    const options: AgCartesianChartOptions = {
                        data: [
                            { [xKey]: nullValue, [yKey]: 140 },
                            { [xKey]: 'Mac', [yKey]: 20 },
                        ],
                        series: [{ type, xKey, yKey, allowNullKeys } as any],
                        formatter: { x: xFormatter },
                    };

                    chart = AgCharts.create(prepareTestOptions(options));
                    await waitForChartStability(chart);

                    if (expectWarning) {
                        const valueType = nullValue === null ? 'object' : 'undefined';
                        // Different series types may emit different numbers of warnings (xKey, xValue, etc.)
                        // Verify at least one warning contains the expected pattern
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
                    }

                    const calls = xFormatter.mock.calls.map((c: [{ value: unknown }]) => c[0].value);
                    if (allowNullKeys) {
                        expect(calls).toContain(nullValue);
                    } else {
                        expect(calls).not.toContain(nullValue);
                    }
                    expect(calls).toContain('Mac');
                }
            );

            it('axis label formatter receives null value when allowNullKeys is true', async () => {
                const axisFormatter = jest.fn((params: { value: unknown }) =>
                    params.value === null ? 'NULL' : String(params.value)
                );

                const options: AgCartesianChartOptions = {
                    data: [
                        { [xKey]: null, [yKey]: 140 },
                        { [xKey]: 'Mac', [yKey]: 20 },
                    ],
                    series: [{ type, xKey, yKey, allowNullKeys: true } as any],
                    axes: {
                        x: { type: 'category', position: 'bottom', label: { formatter: axisFormatter } },
                        y: { type: 'number', position: 'left' },
                    },
                };

                chart = AgCharts.create(prepareTestOptions(options));
                await waitForChartStability(chart);

                expect(axisFormatter).toHaveBeenCalledWith(expect.objectContaining({ value: null }));
            });

            it('domain includes null when allowNullKeys is true', async () => {
                const xFormatter = jest.fn();

                const options: AgCartesianChartOptions = {
                    data: [
                        { [xKey]: 'iPhone', [yKey]: 140 },
                        { [xKey]: null, [yKey]: 100 },
                        { [xKey]: 'Mac', [yKey]: 20 },
                    ],
                    series: [{ type, xKey, yKey, allowNullKeys: true } as any],
                    formatter: { x: xFormatter },
                };

                chart = AgCharts.create(prepareTestOptions(options));
                await waitForChartStability(chart);

                const callWithDomain = xFormatter.mock.calls.find(
                    (c: [{ domain: unknown[] }]) => Array.isArray(c[0].domain) && c[0].domain.length === 3
                );
                expect(callWithDomain).toBeDefined();
                expect(callWithDomain[0].domain).toContain(null);
                expect(callWithDomain[0].domain).toContain('iPhone');
                expect(callWithDomain[0].domain).toContain('Mac');
            });
        });

        describe('bubble series', () => {
            const { type, xKey, yKey, sizeKey } = BUBBLE_SERIES;

            it.each(NULL_KEY_CASES)(
                'chart-level formatter.x: $name',
                async ({ nullValue, allowNullKeys, expectWarning }) => {
                    const xFormatter = jest.fn((params: { value: unknown }) => formatNullValue(params.value));

                    const options: AgCartesianChartOptions = {
                        data: [
                            { [xKey]: nullValue, [yKey]: 140, [sizeKey]: 10 },
                            { [xKey]: 'Mac', [yKey]: 20, [sizeKey]: 5 },
                        ],
                        series: [{ type, xKey, yKey, sizeKey, allowNullKeys } as any],
                        formatter: { x: xFormatter },
                    };

                    chart = AgCharts.create(prepareTestOptions(options));
                    await waitForChartStability(chart);

                    if (expectWarning) {
                        const valueType = nullValue === null ? 'object' : 'undefined';
                        expectWarningsCalls().toEqual(
                            expect.arrayContaining([
                                expect.arrayContaining([
                                    expect.stringMatching(
                                        new RegExp(
                                            `invalid value of type \\[${valueType}\\] for \\[BubbleSeries-1 / xValue\\] ignored:`
                                        )
                                    ),
                                ]),
                            ])
                        );
                    }

                    const calls = xFormatter.mock.calls.map((c: [{ value: unknown }]) => c[0].value);
                    if (allowNullKeys) {
                        expect(calls).toContain(nullValue);
                    } else {
                        expect(calls).not.toContain(nullValue);
                    }
                    expect(calls).toContain('Mac');
                }
            );

            it('domain includes null when allowNullKeys is true', async () => {
                const xFormatter = jest.fn();

                const options: AgCartesianChartOptions = {
                    data: [
                        { [xKey]: 'iPhone', [yKey]: 140, [sizeKey]: 10 },
                        { [xKey]: null, [yKey]: 100, [sizeKey]: 8 },
                        { [xKey]: 'Mac', [yKey]: 20, [sizeKey]: 5 },
                    ],
                    series: [{ type, xKey, yKey, sizeKey, allowNullKeys: true } as any],
                    formatter: { x: xFormatter },
                };

                chart = AgCharts.create(prepareTestOptions(options));
                await waitForChartStability(chart);

                const callWithDomain = xFormatter.mock.calls.find(
                    (c: [{ domain: unknown[] }]) => Array.isArray(c[0].domain) && c[0].domain.length === 3
                );
                expect(callWithDomain).toBeDefined();
                expect(callWithDomain[0].domain).toContain(null);
            });
        });

        // Bar-specific tests for tooltip and label formatting (these use specific hover positions)
        describe('bar series tooltip and label formatting', () => {
            it('formats tooltip heading for null category when allowNullKeys is true', async () => {
                const xFormatter = jest.fn((params: { value: unknown }) =>
                    params.value === null ? 'No Product' : String(params.value)
                );

                const options: AgCartesianChartOptions = {
                    data: [
                        { product: null, value: 140 },
                        { product: 'Mac', value: 20 },
                    ],
                    series: [{ type: 'bar', xKey: 'product', yKey: 'value', allowNullKeys: true } as any],
                    formatter: { x: xFormatter },
                };

                chart = AgCharts.create(prepareTestOptions(options));
                await waitForChartStability(chart);

                await hoverAction(200, 200)(chart);
                await waitForChartStability(chart);

                const element = getDocument('body').getElementsByClassName('ag-charts-tooltip')[0];
                expect(element?.textContent).toContain('No Product');
            });

            it('calls formatter.x for tooltip with null category when allowNullKeys is true', async () => {
                const xFormatter = jest.fn((params: { value: unknown; source: string }) => {
                    if (params.source === 'tooltip' && params.value === null) {
                        return 'Tooltip Null';
                    }
                    return params.value === null ? 'NULL' : String(params.value);
                });

                const options: AgCartesianChartOptions = {
                    data: [
                        { product: null, value: 140 },
                        { product: 'Mac', value: 20 },
                    ],
                    series: [{ type: 'bar', xKey: 'product', yKey: 'value', allowNullKeys: true } as any],
                    formatter: { x: xFormatter },
                };

                chart = AgCharts.create(prepareTestOptions(options));
                await waitForChartStability(chart);

                await hoverAction(200, 200)(chart);
                await waitForChartStability(chart);

                const tooltipCalls = xFormatter.mock.calls.filter(
                    (c: [{ source: string; value: unknown }]) => c[0].source === 'tooltip' && c[0].value === null
                );
                expect(tooltipCalls.length).toBeGreaterThan(0);
            });

            it('calls series label formatter for data with null category when allowNullKeys is true', async () => {
                const labelFormatter = jest.fn((params: { value: unknown }) =>
                    params.value === null ? 'NULL' : String(params.value)
                );

                const options: AgCartesianChartOptions = {
                    data: [
                        { product: null, value: 140 },
                        { product: 'Mac', value: 20 },
                    ],
                    series: [
                        {
                            type: 'bar',
                            xKey: 'product',
                            yKey: 'value',
                            allowNullKeys: true,
                            label: { enabled: true, formatter: labelFormatter },
                        } as any,
                    ],
                };

                chart = AgCharts.create(prepareTestOptions(options));
                await waitForChartStability(chart);

                expect(labelFormatter).toHaveBeenCalledTimes(2);
                const formatterDatums = labelFormatter.mock.calls.map((c: any[]) => c[0].datum?.product);
                expect(formatterDatums).toContain(null);
                expect(formatterDatums).toContain('Mac');
            });
        });

        // Polar series tests (pie, donut) using legendItemKey
        // Note: Pie/donut series emit warnings for both legendItemKey and legendItemValue
        const POLAR_SERIES = [
            { type: 'pie' as const, legendItemKey: 'product', angleKey: 'value' },
            { type: 'donut' as const, legendItemKey: 'product', angleKey: 'value' },
        ];

        describe.each(POLAR_SERIES)('$type series', ({ type, legendItemKey, angleKey }) => {
            const seriesIdPrefix = type === 'pie' ? 'PieSeries' : 'DonutSeries';

            describe('null category key', () => {
                it('should reject null category key with warning', async () => {
                    const options: AgPolarChartOptions = {
                        data: [
                            { [legendItemKey]: null, [angleKey]: 140 },
                            { [legendItemKey]: 'Mac', [angleKey]: 20 },
                        ],
                        series: [{ type, legendItemKey, angleKey } as any],
                    };

                    chart = AgCharts.create(prepareTestOptions(options));
                    await waitForChartStability(chart);

                    // Pie/donut emit warnings for both legendItemKey and legendItemValue
                    expectWarningsCalls().toEqual([
                        [
                            `AG Charts - invalid value of type [object] for [${seriesIdPrefix}-1 / legendItemKey] ignored:`,
                            '[null]',
                        ],
                        [
                            `AG Charts - invalid value of type [object] for [${seriesIdPrefix}-1 / legendItemValue] ignored:`,
                            '[null]',
                        ],
                    ]);
                });

                it('should accept null category key when allowNullKeys is true', async () => {
                    const options: AgPolarChartOptions = {
                        data: [
                            { [legendItemKey]: null, [angleKey]: 140 },
                            { [legendItemKey]: 'Mac', [angleKey]: 20 },
                        ],
                        series: [{ type, legendItemKey, angleKey, allowNullKeys: true } as any],
                    };

                    chart = AgCharts.create(prepareTestOptions(options));
                    await waitForChartStability(chart);

                    expectWarningsCalls().toEqual([]);
                });
            });

            describe('undefined category key', () => {
                it('should reject undefined category key with warning', async () => {
                    const options: AgPolarChartOptions = {
                        data: [
                            { [legendItemKey]: undefined, [angleKey]: 140 },
                            { [legendItemKey]: 'Mac', [angleKey]: 20 },
                        ],
                        series: [{ type, legendItemKey, angleKey } as any],
                    };

                    chart = AgCharts.create(prepareTestOptions(options));
                    await waitForChartStability(chart);

                    // Pie/donut emit warnings for both legendItemKey and legendItemValue
                    expectWarningsCalls().toEqual([
                        [
                            `AG Charts - invalid value of type [undefined] for [${seriesIdPrefix}-1 / legendItemKey] ignored:`,
                            '[undefined]',
                        ],
                        [
                            `AG Charts - invalid value of type [undefined] for [${seriesIdPrefix}-1 / legendItemValue] ignored:`,
                            '[undefined]',
                        ],
                    ]);
                });

                it('should accept undefined category key when allowNullKeys is true', async () => {
                    const options: AgPolarChartOptions = {
                        data: [
                            { [legendItemKey]: undefined, [angleKey]: 140 },
                            { [legendItemKey]: 'Mac', [angleKey]: 20 },
                        ],
                        series: [{ type, legendItemKey, angleKey, allowNullKeys: true } as any],
                    };

                    chart = AgCharts.create(prepareTestOptions(options));
                    await waitForChartStability(chart);

                    expectWarningsCalls().toEqual([]);
                });
            });
        });
    });
});
