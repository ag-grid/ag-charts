import { describe, expect, it } from '@jest/globals';

import { AgCartesianChartOptions, type AgChartOptions, AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

const BOX_PLOT_BAR_OPTIONS: AgChartOptions = {
    data: [
        { year: '2020', min: 3.07, q1: 4.78, median: 5.3, q3: 6.3, max: 7.27 },
        { year: '2021', min: 4.87, q1: 5.8, median: 6.13, q3: 6.66, max: 7.09 },
        { year: '2022', min: 4.4, q1: 4.41, median: 4.64, q3: 4.96, max: 5.2 },
        { year: '2023', min: 7.31, q1: 7.32, median: 7.32, q3: 7.33, max: 7.33 },
    ],
    series: [
        {
            type: 'box-plot',
            xKey: 'year',
            minKey: 'min',
            q1Key: 'q1',
            medianKey: 'median',
            q3Key: 'q3',
            maxKey: 'max',
        },
    ],
};

const CONTINUOUS_DATA = [
    { year: new Date(2020, 0, 1), min: 3.07, q1: 4.78, median: 5.3, q3: 6.3, max: 7.27 },
    { year: new Date(2021, 0, 1), min: 4.87, q1: 5.8, median: 6.13, q3: 6.66, max: 7.09 },
    { year: new Date(2022, 0, 1), min: 4.4, q1: 4.41, median: 4.64, q3: 4.96, max: 5.2 },
    { year: new Date(2023, 0, 1), min: 7.31, q1: 7.32, median: 7.32, q3: 7.33, max: 7.33 },
];

function switchSeriesType<T extends AgCartesianChartOptions>(opts: T, direction: 'horizontal' | 'vertical'): T {
    return {
        ...opts,
        series: opts['series']?.map((s) => ({
            ...s,
            direction,
        })),
    };
}

describe('BoxPlotSeries', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    const compareSnapshot = async (chart: any) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);

        chart.destroy();
    };

    it(`should render a box-plot chart as expected`, async () => {
        const options = BOX_PLOT_BAR_OPTIONS;
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a horizontal box-plot chart as expected`, async () => {
        const options = switchSeriesType(BOX_PLOT_BAR_OPTIONS, 'horizontal');
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a box-plot chart with a time x-axis`, async () => {
        const options: AgChartOptions = {
            ...BOX_PLOT_BAR_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: [
                {
                    position: 'left',
                    type: 'number',
                },
                {
                    position: 'bottom',
                    type: 'time',
                    nice: false,
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a horizontal box-plot chart with a time y-axis`, async () => {
        const options: AgChartOptions = {
            ...switchSeriesType(BOX_PLOT_BAR_OPTIONS, 'horizontal'),
            data: CONTINUOUS_DATA,
            axes: [
                {
                    position: 'bottom',
                    type: 'number',
                },
                {
                    position: 'left',
                    type: 'time',
                    nice: false,
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a box-plot chart as expected with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...BOX_PLOT_BAR_OPTIONS,
            axes: [
                {
                    type: 'category',
                    position: 'bottom',
                    reverse: true,
                },
                {
                    type: 'number',
                    position: 'left',
                    reverse: true,
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a horizontal box-plot chart as expected with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...switchSeriesType(BOX_PLOT_BAR_OPTIONS, 'horizontal'),
            axes: [
                {
                    type: 'category',
                    position: 'left',
                    reverse: true,
                },
                {
                    type: 'number',
                    position: 'bottom',
                    reverse: true,
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a box-plot chart with a reversed time x-axis`, async () => {
        const options: AgChartOptions = {
            ...BOX_PLOT_BAR_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: [
                {
                    position: 'left',
                    type: 'number',
                },
                {
                    position: 'bottom',
                    type: 'time',
                    nice: false,
                    reverse: true,
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a horizontal box-plot chart with a reversed time y-axis`, async () => {
        const options: AgChartOptions = {
            ...switchSeriesType(BOX_PLOT_BAR_OPTIONS, 'horizontal'),
            data: CONTINUOUS_DATA,
            axes: [
                {
                    position: 'bottom',
                    type: 'number',
                },
                {
                    position: 'left',
                    type: 'time',
                    nice: false,
                    reverse: true,
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    describe('initial animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for BOX_PLOT_BAR_OPTIONS should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = { ...BOX_PLOT_BAR_OPTIONS };
                prepareEnterpriseTestOptions(options);

                await compareSnapshot(AgCharts.create(options));
            });
        }
    });
});
