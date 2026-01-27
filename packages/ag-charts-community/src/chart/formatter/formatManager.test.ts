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

    describe('AG-16613 null category value formatting', () => {
        it('should call chart-level formatter.x with null value when allowNullKeys is true', async () => {
            const xFormatter = jest.fn((params: { value: unknown }) =>
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
                    } as any,
                ],
                formatter: {
                    x: xFormatter,
                },
            };

            chart = AgCharts.create(prepareTestOptions(options));
            await waitForChartStability(chart);

            // Verify formatter was called with actual null value
            expect(xFormatter).toHaveBeenCalledWith(expect.objectContaining({ value: null }));
            // Verify the null value is in the domain
            const calls = xFormatter.mock.calls.map((c: [{ value: unknown }]) => c[0].value);
            expect(calls).toContain(null);
            expect(calls).toContain('Mac');
        });

        it('should NOT call chart-level formatter.x for null value when allowNullKeys is false', async () => {
            const xFormatter = jest.fn((params: { value: unknown }) => String(params.value));
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
                        // allowNullKeys defaults to false
                    },
                ],
                formatter: {
                    x: xFormatter,
                },
            };

            chart = AgCharts.create(prepareTestOptions(options));
            await waitForChartStability(chart);

            // Should warn about invalid null value when allowNullKeys is false
            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [BarSeries-1 / xValue] ignored:",
    "[null]",
  ],
]
`);

            // Verify formatter was NOT called with null value (null data point is excluded)
            const calls = xFormatter.mock.calls.map((c: [{ value: unknown }]) => c[0].value);
            expect(calls).not.toContain(null);
            // Should only have 'Mac' in the domain
            expect(calls).toContain('Mac');
        });

        it('should call axis label formatter with null value when allowNullKeys is true', async () => {
            const axisFormatter = jest.fn((params: { value: unknown }) =>
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
                    } as any,
                ],
                axes: {
                    x: {
                        type: 'category',
                        position: 'bottom',
                        label: { formatter: axisFormatter },
                    },
                    y: { type: 'number', position: 'left' },
                },
            };

            chart = AgCharts.create(prepareTestOptions(options));
            await waitForChartStability(chart);

            // Verify axis formatter was called with actual null value
            expect(axisFormatter).toHaveBeenCalledWith(expect.objectContaining({ value: null }));
        });

        it('should call chart-level formatter.x with undefined value when allowNullKeys is true', async () => {
            const xFormatter = jest.fn((params: { value: unknown }) =>
                params.value === undefined ? 'UNDEF' : String(params.value)
            );
            const options: AgCartesianChartOptions = {
                data: [
                    { product: undefined, value: 140 },
                    { product: 'Mac', value: 20 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'product',
                        yKey: 'value',
                        allowNullKeys: true,
                    } as any,
                ],
                formatter: {
                    x: xFormatter,
                },
            };

            chart = AgCharts.create(prepareTestOptions(options));
            await waitForChartStability(chart);

            // Verify formatter was called with actual undefined value
            expect(xFormatter).toHaveBeenCalledWith(expect.objectContaining({ value: undefined }));
        });

        it('should format tooltip heading for null category when allowNullKeys is true', async () => {
            const xFormatter = jest.fn((params: { value: unknown }) =>
                params.value === null ? 'No Product' : String(params.value)
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
                    } as any,
                ],
                formatter: {
                    x: xFormatter,
                },
            };

            chart = AgCharts.create(prepareTestOptions(options));
            await waitForChartStability(chart);

            // Hover over the first bar (null category) - center-left area for first bar
            await hoverAction(200, 200)(chart);
            await waitForChartStability(chart);

            const element = getDocument('body').getElementsByClassName('ag-charts-tooltip')[0];
            // If formatter was called for null, tooltip heading should be 'No Product'
            // If formatter was NOT called for null, tooltip heading will be empty or default
            expect(element?.textContent).toContain('No Product');
        });

        it('should include null in domain when allowNullKeys is true', async () => {
            const xFormatter = jest.fn();
            const options: AgCartesianChartOptions = {
                data: [
                    { product: 'iPhone', value: 140 },
                    { product: null, value: 100 },
                    { product: 'Mac', value: 20 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'product',
                        yKey: 'value',
                        allowNullKeys: true,
                    } as any,
                ],
                formatter: {
                    x: xFormatter,
                },
            };

            chart = AgCharts.create(prepareTestOptions(options));
            await waitForChartStability(chart);

            // Find a call that has the full domain
            const callWithDomain = xFormatter.mock.calls.find(
                (c: [{ domain: unknown[] }]) => Array.isArray(c[0].domain) && c[0].domain.length === 3
            );
            expect(callWithDomain).toBeDefined();
            expect(callWithDomain[0].domain).toContain(null);
            expect(callWithDomain[0].domain).toContain('iPhone');
            expect(callWithDomain[0].domain).toContain('Mac');
        });

        it('should call chart-level formatter.x for tooltip with null category when allowNullKeys is true', async () => {
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
                series: [
                    {
                        type: 'bar',
                        xKey: 'product',
                        yKey: 'value',
                        allowNullKeys: true,
                    } as any,
                ],
                formatter: {
                    x: xFormatter,
                },
            };

            chart = AgCharts.create(prepareTestOptions(options));
            await waitForChartStability(chart);

            // Hover over the first bar (null category)
            await hoverAction(200, 200)(chart);
            await waitForChartStability(chart);

            // Check if formatter was called with source='tooltip' and value=null
            const tooltipCalls = xFormatter.mock.calls.filter(
                (c: [{ source: string; value: unknown }]) => c[0].source === 'tooltip' && c[0].value === null
            );
            // This should pass once the bug is fixed
            expect(tooltipCalls.length).toBeGreaterThan(0);
        });

        it('should call series label formatter with null category when allowNullKeys is true', async () => {
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
                        label: {
                            enabled: true,
                            formatter: labelFormatter,
                        },
                    } as any,
                ],
            };

            chart = AgCharts.create(prepareTestOptions(options));
            await waitForChartStability(chart);

            // Bar label formatter receives yValue, but verify it was called for data with null xKey
            // by checking that the formatter was called for both data points (including the null-keyed one)
            expect(labelFormatter).toHaveBeenCalledTimes(2);
            const formatterDatums = labelFormatter.mock.calls.map((c: any[]) => c[0].datum?.product);
            expect(formatterDatums).toContain(null);
            expect(formatterDatums).toContain('Mac');
        });
    });
});
