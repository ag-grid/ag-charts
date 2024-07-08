import { afterEach, describe, expect, it } from '@jest/globals';

import { type AgChartOptions, AgCharts, _ModuleSupport } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    setupMockCanvas,
    spyOnAnimationManager,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('RangeBarSeries', () => {
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
    const RANGE_COLUMN_OPTIONS: AgChartOptions = {
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

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
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
            axes: [
                {
                    position: 'left',
                    type: 'number',
                    reverse: true,
                },
                {
                    position: 'bottom',
                    type: 'category',
                    reverse: true,
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal range-bar chart with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...switchSeriesType(RANGE_COLUMN_OPTIONS, 'horizontal'),
            axes: [
                {
                    position: 'bottom',
                    type: 'number',
                    reverse: true,
                },
                {
                    position: 'left',
                    type: 'category',
                    reverse: true,
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart with a time x-axis`, async () => {
        const options: AgChartOptions = {
            ...RANGE_COLUMN_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: [
                {
                    position: 'left',
                    type: 'number',
                },
                {
                    position: 'bottom',
                    type: 'time',
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart with a reversed time x-axis`, async () => {
        const options: AgChartOptions = {
            ...RANGE_COLUMN_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: [
                {
                    position: 'left',
                    type: 'number',
                },
                {
                    position: 'bottom',
                    type: 'time',
                    reverse: true,
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal range-bar chart with a time y-axis`, async () => {
        const RANGE_BAR_OPTIONS = switchSeriesType(RANGE_COLUMN_OPTIONS, 'horizontal');
        const options: AgChartOptions = {
            ...RANGE_BAR_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: [
                {
                    position: 'left',
                    type: 'time',
                },
                {
                    position: 'bottom',
                    type: 'number',
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal range-bar chart with a reversed time y-axis`, async () => {
        const RANGE_BAR_OPTIONS = switchSeriesType(RANGE_COLUMN_OPTIONS, 'horizontal');
        const options: AgChartOptions = {
            ...RANGE_BAR_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: [
                {
                    position: 'left',
                    type: 'time',
                    reverse: true,
                },
                {
                    position: 'bottom',
                    type: 'number',
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart with a number x-axis`, async () => {
        const options: AgChartOptions = {
            ...RANGE_COLUMN_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: [
                {
                    position: 'left',
                    type: 'number',
                },
                {
                    position: 'bottom',
                    type: 'number',
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart with a reversed number x-axis`, async () => {
        const options: AgChartOptions = {
            ...RANGE_COLUMN_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: [
                {
                    position: 'left',
                    type: 'number',
                },
                {
                    position: 'bottom',
                    type: 'number',
                    reverse: true,
                },
            ],
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
            axes: [
                {
                    position: 'left',
                    type: 'number',
                },
                {
                    position: 'bottom',
                    type: 'number',
                },
            ],
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
            axes: [
                {
                    position: 'left',
                    type: 'number',
                    reverse: true,
                },
                {
                    position: 'bottom',
                    type: 'number',
                },
            ],
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
                    low: _ModuleSupport.round(datum.low * 0.5, 1),
                    high: _ModuleSupport.round(datum.high * 2, 1),
                })) ?? []),
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    describe('initial animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for RANGE_COLUMN_OPTIONS should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = { ...RANGE_COLUMN_OPTIONS };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await compare();
            });

            it(`for horizontal RANGE_COLUMN_OPTIONS should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = { ...switchSeriesType(RANGE_COLUMN_OPTIONS, 'horizontal') };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await compare();
            });
        }
    });
});
