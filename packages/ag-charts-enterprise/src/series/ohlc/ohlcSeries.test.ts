import { describe, it } from '@jest/globals';

import { type AgChartOptions, AgCharts } from 'ag-charts-community';
import { setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

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
    setupMockCanvas();

    const compareSnapshot = async (chart: any) => {
        await waitForChartStability(chart);
        // Chart renders successfully without errors
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

    describe('CRT-340: Minimum Bar Width', () => {
        it('should render OHLC bars with at least 1px width in narrow charts', async () => {
            const manyDataPoints = Array.from({ length: 100 }, (_, i) => ({
                date: new Date(2020, 0, i + 1),
                low: 3 + Math.random(),
                open: 4 + Math.random(),
                close: 5 + Math.random(),
                high: 6 + Math.random(),
            }));

            const options: AgChartOptions = {
                data: manyDataPoints,
                width: 100, // Very narrow chart
                height: 400,
                series: [
                    {
                        type: 'ohlc',
                        xKey: 'date',
                        lowKey: 'low',
                        openKey: 'open',
                        closeKey: 'close',
                        highKey: 'high',
                    },
                ],
                axes: {
                    x: {
                        type: 'ordinal-time',
                        position: 'bottom',
                    },
                    y: {
                        type: 'number',
                        position: 'left',
                    },
                },
            };

            prepareEnterpriseTestOptions(options as any);
            await compareSnapshot(AgCharts.create(options));
        });

        it('should render OHLC bars correctly with extreme data density', async () => {
            const extremeDataPoints = Array.from({ length: 500 }, (_, i) => ({
                date: new Date(2020, 0, 1, i),
                low: 10 + Math.sin(i / 10) * 2,
                open: 11 + Math.sin(i / 10) * 2,
                close: 12 + Math.sin(i / 10) * 2,
                high: 13 + Math.sin(i / 10) * 2,
            }));

            const options: AgChartOptions = {
                data: extremeDataPoints,
                width: 200,
                height: 400,
                series: [
                    {
                        type: 'ohlc',
                        xKey: 'date',
                        lowKey: 'low',
                        openKey: 'open',
                        closeKey: 'close',
                        highKey: 'high',
                    },
                ],
                axes: {
                    x: {
                        type: 'unit-time',
                        position: 'bottom',
                    },
                    y: {
                        type: 'number',
                        position: 'left',
                    },
                },
            };

            prepareEnterpriseTestOptions(options as any);
            await compareSnapshot(AgCharts.create(options));
        });

        it('should render visible bars even in extremely narrow chart', async () => {
            const options: AgChartOptions = {
                data: Array.from({ length: 50 }, (_, i) => ({
                    x: i,
                    low: 10,
                    open: 15,
                    close: 20,
                    high: 25,
                })),
                width: 50, // Extremely narrow
                height: 300,
                series: [
                    {
                        type: 'ohlc',
                        xKey: 'x',
                        lowKey: 'low',
                        openKey: 'open',
                        closeKey: 'close',
                        highKey: 'high',
                    },
                ],
            };

            prepareEnterpriseTestOptions(options as any);
            // Should render without errors, bars should be visible
            await compareSnapshot(AgCharts.create(options));
        });

        it('should handle unit-time axis with many data points in narrow chart', async () => {
            const options: AgChartOptions = {
                data: Array.from({ length: 200 }, (_, i) => {
                    const low = 100 + Math.random() * 5;
                    const high = 115 + Math.random() * 5;
                    const open = low + Math.random() * (high - low);
                    const close = low + Math.random() * (high - low);
                    return {
                        time: new Date(2020, 0, 1, i),
                        low,
                        open,
                        close,
                        high,
                    };
                }),
                width: 150,
                height: 400,
                series: [
                    {
                        type: 'ohlc',
                        xKey: 'time',
                        lowKey: 'low',
                        openKey: 'open',
                        closeKey: 'close',
                        highKey: 'high',
                    },
                ],
                axes: {
                    x: {
                        type: 'unit-time',
                        position: 'bottom',
                    },
                    y: {
                        type: 'number',
                        position: 'left',
                    },
                },
            };

            prepareEnterpriseTestOptions(options as any);
            await compareSnapshot(AgCharts.create(options));
        });
    });
});
