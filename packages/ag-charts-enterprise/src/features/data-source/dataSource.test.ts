import { afterEach, describe, expect, it } from '@jest/globals';

import { type AgChartOptions, AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    clickAction,
    delay,
    extractImageData,
    scrollAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('DataSource', () => {
    setupMockConsole();

    let chart: any;
    const ctx = setupMockCanvas();

    const EXAMPLE_OPTIONS: AgChartOptions = {
        axes: [
            {
                type: 'number',
                position: 'left',
            },
            {
                type: 'time',
                position: 'bottom',
                nice: false,
                min: new Date('2024-01-01 00:00:00'),
                max: new Date('2024-01-07 00:00:00'),
            },
        ],
        series: [
            {
                type: 'line',
                xKey: 'time',
                yKey: 'price',
            },
        ],
        navigator: {
            enabled: true,
        },
        zoom: {
            scrollingStep: 0.5, // Make sure we zoom enough in a single step so we can detect it
            minVisibleItemsX: 1,
            minVisibleItemsY: 1,
        },
    };

    let cx: number = 0;
    let cy: number = 0;

    async function prepareChart(dataSourceOptions?: AgChartOptions['dataSource'], baseOptions = EXAMPLE_OPTIONS) {
        const options: AgChartOptions = {
            ...baseOptions,
            dataSource: { ...baseOptions.dataSource, ...(dataSourceOptions ?? {}) } as AgChartOptions['dataSource'],
        };

        prepareEnterpriseTestOptions(options);
        cx = options.width! / 2;
        cy = options.height! / 2;

        chart = AgCharts.create(options);

        // Click once in the chart to ensure the chart is active / mouse is over it to ensure the first scroll wheel
        // event is triggered.
        await waitForChartStability(chart);
        await clickAction(cx, cy)(chart);
    }

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const compare = async () => {
        await waitForChartStability(chart);
        await delay(100);
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    it('should load data asynchronously', async () => {
        const response = delay(1).then(() => [
            { time: new Date('2024-01-01 00:00:00'), price: 0 },
            { time: new Date('2024-01-02 00:00:00'), price: 50 },
            { time: new Date('2024-01-03 00:00:00'), price: 25 },
            { time: new Date('2024-01-04 00:00:00'), price: 75 },
            { time: new Date('2024-01-05 00:00:00'), price: 50 },
            { time: new Date('2024-01-06 00:00:00'), price: 25 },
            { time: new Date('2024-01-07 00:00:00'), price: 50 },
        ]);
        await prepareChart({
            getData: () => response,
        });
        await response;
        await compare();
    });

    describe('with window', () => {
        let response: Promise<Array<{ time: Date; price: number }>>;
        let dataSource: AgChartOptions['dataSource'];

        beforeEach(() => {
            response = delay(1).then(() => [
                { time: new Date('2024-01-01 00:00:00'), price: 0 },
                { time: new Date('2024-01-01 12:00:00'), price: 30 },
                { time: new Date('2024-01-02 00:00:00'), price: 50 },
                { time: new Date('2024-01-02 12:00:00'), price: 40 },
                { time: new Date('2024-01-03 00:00:00'), price: 25 },
                { time: new Date('2024-01-03 12:00:00'), price: 60 },
                { time: new Date('2024-01-04 00:00:00'), price: 75 },
                { time: new Date('2024-01-04 12:00:00'), price: 60 },
                { time: new Date('2024-01-05 00:00:00'), price: 50 },
                { time: new Date('2024-01-05 12:00:00'), price: 30 },
                { time: new Date('2024-01-06 00:00:00'), price: 25 },
                { time: new Date('2024-01-06 12:00:00'), price: 40 },
                { time: new Date('2024-01-07 00:00:00'), price: 50 },
            ]);
            dataSource = {
                getData: ({ windowStart, windowEnd }) => {
                    const day = 1000 * 60 * 60 * 24;
                    return response.then((data) =>
                        data.filter((d) => {
                            const time = d.time.getTime();
                            const isDay = time % day === 0;
                            const hasWindow =
                                windowStart != null &&
                                windowEnd != null &&
                                windowEnd.getTime() - windowStart.getTime() < day * 4;
                            const isWindow = hasWindow && time >= windowStart.getTime() && time <= windowEnd.getTime();
                            return isDay || isWindow;
                        })
                    );
                },
            };
        });

        it('should load a window at the end', async () => {
            await prepareChart(dataSource, {
                ...EXAMPLE_OPTIONS,
                navigator: { min: 0.5, max: 1.0 },
            });
            await response;
            await compare();
        });

        it('should load a window in the middle', async () => {
            await prepareChart(dataSource, {
                ...EXAMPLE_OPTIONS,
                navigator: { min: 0.25, max: 0.75 },
            });
            await response;
            await compare();
        });

        it('should change the window after a change in zoom', async () => {
            await prepareChart(dataSource, {
                ...EXAMPLE_OPTIONS,
            });
            await response;
            await compare();
            await scrollAction(cx, cy, -1)(chart);
            await compare();
        });
    });
});
