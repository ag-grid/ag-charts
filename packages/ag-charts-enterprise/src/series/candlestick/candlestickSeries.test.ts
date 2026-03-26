import { afterEach, describe, expect, it } from '@jest/globals';

import { type AgChartOptions, AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    deproxy,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

const CANDLESTICK_OPTIONS: AgChartOptions = {
    data: [
        { year: new Date(2020, 0, 1), low: 3.07, close: 4.78, open: 6.3, high: 7.27 },
        { year: new Date(2021, 0, 1), low: 4.87, open: 5.8, close: 6.66, high: 7.09 },
        { year: new Date(2022, 0, 1), low: 4.4, close: 4.41, open: 4.96, high: 5.2 },
        { year: new Date(2023, 0, 1), low: 7.31, open: 7.32, close: 7.33, high: 7.33 },
    ],
    series: [
        {
            type: 'candlestick',
            xKey: 'year',
            lowKey: 'low',
            openKey: 'open',
            closeKey: 'close',
            highKey: 'high',
        },
    ],
};

describe('CandlestickSeries', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    const compareSnapshot = async (chart: any) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);

        chart.destroy();
    };

    it(`should render a candlestick chart as expected with default ordinal time x-axis`, async () => {
        const options = CANDLESTICK_OPTIONS;
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a candlestick chart with a unit time x-axis`, async () => {
        const options: AgChartOptions = {
            ...CANDLESTICK_OPTIONS,
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

    it(`should render a candlestick chart as expected with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...CANDLESTICK_OPTIONS,
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

    it(`should render a candlestick chart with a reversed unit time x-axis`, async () => {
        const options: AgChartOptions = {
            ...CANDLESTICK_OPTIONS,
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

    it(`should render a candlestick chart with RTL enabled`, async () => {
        const options: AgChartOptions = {
            ...CANDLESTICK_OPTIONS,
            enableRtl: true,
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    describe('gradient fill', () => {
        it('should render candlestick series with a default gradient fill', async () => {
            const options = {
                ...CANDLESTICK_OPTIONS,
                series: [
                    {
                        ...CANDLESTICK_OPTIONS.series![0],
                        item: {
                            up: {
                                fill: {
                                    type: 'gradient',
                                },
                            },
                            down: {
                                fill: {
                                    type: 'gradient',
                                },
                            },
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);
            await compareSnapshot(AgCharts.create(options as AgChartOptions));
        });

        it('should render candlestick series with a gradient fill', async () => {
            const options = {
                ...CANDLESTICK_OPTIONS,
                series: [
                    {
                        ...CANDLESTICK_OPTIONS.series![0],
                        item: {
                            up: {
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
                            down: {
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
            await compareSnapshot(AgCharts.create(options as AgChartOptions));
        });
    });

    describe('Series Matching - AG-16450', () => {
        let chart: any;

        afterEach(() => {
            if (chart) {
                chart.destroy();
                (chart as unknown) = undefined;
            }
        });

        describe('Candlestick series matching', () => {
            it('should not recreate candlestick series when direction property is omitted on update', async () => {
                const options = prepareEnterpriseTestOptions({
                    data: [
                        { year: new Date(2020, 0, 1), low: 3.07, close: 4.78, open: 6.3, high: 7.27 },
                        { year: new Date(2021, 0, 1), low: 4.87, open: 5.8, close: 6.66, high: 7.09 },
                    ],
                    legend: { enabled: true },
                    series: [
                        {
                            type: 'candlestick',
                            xKey: 'year',
                            lowKey: 'low',
                            openKey: 'open',
                            closeKey: 'close',
                            highKey: 'high',
                            tooltip: {
                                renderer: () => 'test',
                            },
                        },
                    ],
                });

                const chartInstance = AgCharts.create(options);
                chart = deproxy(chartInstance);
                await waitForChartStability(chart);

                const seriesIdBefore = chart.series[0]?.id;
                const legendDataBefore = chart.ctx.legendManager.getData();

                // Update with identical options (direction omitted)
                await chartInstance.updateDelta({
                    series: [
                        {
                            type: 'candlestick',
                            xKey: 'year',
                            lowKey: 'low',
                            openKey: 'open',
                            closeKey: 'close',
                            highKey: 'high',
                            tooltip: {
                                renderer: () => 'test',
                            },
                        },
                    ],
                });
                await waitForChartStability(chart);

                const seriesIdAfter = chart.series[0]?.id;
                const legendDataAfter = chart.ctx.legendManager.getData();

                // Series should be the same instance (not recreated)
                expect(seriesIdAfter).toBe(seriesIdBefore);

                // Legend should still have only one item for the same series
                expect(legendDataAfter).toHaveLength(1);
                expect(legendDataBefore).toHaveLength(1);
                expect(legendDataAfter[0].seriesId).toBe(legendDataBefore[0].seriesId);

                // Verify legend visually
                const imageData = extractImageData(ctx);
                expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
            });
        });

        describe('Candlestick legend regression', () => {
            it('should not accumulate legend items when updating candlestick tooltip renderer', async () => {
                const options = prepareEnterpriseTestOptions({
                    data: [
                        { year: new Date(2020, 0, 1), low: 3.07, close: 4.78, open: 6.3, high: 7.27, value: 10 },
                        { year: new Date(2021, 0, 1), low: 4.87, open: 5.8, close: 6.66, high: 7.09, value: 20 },
                    ],
                    series: [
                        {
                            type: 'candlestick',
                            xKey: 'year',
                            lowKey: 'low',
                            openKey: 'open',
                            closeKey: 'close',
                            highKey: 'high',
                            tooltip: { renderer: () => 'tooltip 1' },
                        },
                        { type: 'line', xKey: 'year', yKey: 'value', yName: 'Value' },
                    ],
                });

                const chartInstance = AgCharts.create(options);
                chart = deproxy(chartInstance);
                await waitForChartStability(chart);

                const legendDataBefore = chart.ctx.legendManager.getData();
                expect(legendDataBefore).toHaveLength(2);

                // Update candlestick tooltip renderer multiple times
                await chartInstance.updateDelta({
                    series: [
                        {
                            type: 'candlestick',
                            xKey: 'year',
                            lowKey: 'low',
                            openKey: 'open',
                            closeKey: 'close',
                            highKey: 'high',
                            tooltip: { renderer: () => 'tooltip 1' },
                        },
                        { type: 'line', xKey: 'year', yKey: 'value', yName: 'Value' },
                    ],
                });
                await waitForChartStability(chart);

                let legendDataAfter = chart.ctx.legendManager.getData();
                expect(legendDataAfter).toHaveLength(2);

                await chartInstance.updateDelta({
                    series: [
                        {
                            type: 'candlestick',
                            xKey: 'year',
                            lowKey: 'low',
                            openKey: 'open',
                            closeKey: 'close',
                            highKey: 'high',
                            tooltip: { renderer: () => 'tooltip 2' },
                        },
                        { type: 'line', xKey: 'year', yKey: 'value', yName: 'Value' },
                    ],
                });
                await waitForChartStability(chart);

                legendDataAfter = chart.ctx.legendManager.getData();

                // Should still have exactly 2 items (no accumulation)
                expect(legendDataAfter).toHaveLength(2);

                // Verify no duplicate series IDs
                const seriesIds = legendDataAfter.map((d: any) => d.seriesId);
                const uniqueSeriesIds = new Set(seriesIds);
                expect(uniqueSeriesIds.size).toBe(2);

                // Verify legend visually shows exactly 2 items
                const imageData = extractImageData(ctx);
                expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
            });
        });
    });
});
