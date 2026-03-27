import { afterEach, describe, expect, it } from '@jest/globals';

import {
    type AgCartesianChartOptions,
    type AgChartOptions,
    AgCharts,
    type AgNumberAxisOptions,
} from 'ag-charts-community';
import {
    clickAction,
    delay,
    extractImageData,
    scrollAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { isDate } from 'ag-charts-core';

import { prepareEnterpriseTestOptions } from '../../test/utils';

// Note: We set crosshair: { enabled: false } and tooltip: { range: 'exact'} to avoid the highlight
// styling from being rendered styling because there is a race condition with the clickAction and
// data-update handling, which sometimes triggers the highlight rendering, and sometimes doesn't. We're
// not explicitly testing highlight rendering, so this allows us to treat highlighted & unhighlighted
// charts as equal.
const BASE_OPTIONS: AgCartesianChartOptions = {
    tooltip: { range: 'exact' },
    dataSource: {
        // @ts-expect-error Set undocumented options to instantly resolve for tests
        requestThrottle: 0,
        updateThrottle: 0,
        updateDuringInteraction: true,
    },
    navigator: {
        enabled: true,
    },
    zoom: {
        scrollingStep: 0.5, // Make sure we zoom enough in a single step so we can detect it
        minVisibleItems: 1,
    },
};

const DATE_OPTIONS: AgCartesianChartOptions = {
    ...BASE_OPTIONS,
    axes: {
        y: { type: 'number', position: 'left', crosshair: { enabled: false } },
        x: {
            type: 'time',
            position: 'bottom',
            min: new Date('2024-01-01 00:00:00'),
            max: new Date('2024-01-07 00:00:00'),
            crosshair: { enabled: false },
        },
    },
    series: [{ type: 'line', xKey: 'time', yKey: 'price' }],
};

const NUMERIC_OPTIONS: AgCartesianChartOptions = {
    ...BASE_OPTIONS,
    axes: {
        x: { type: 'number', position: 'bottom', crosshair: { enabled: false } },
        y: { type: 'number', position: 'left', crosshair: { enabled: false } },
    },
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
};

describe('DataSource', () => {
    setupMockConsole();

    let chart: any;
    const ctx = setupMockCanvas();

    let cx: number = 0;
    let cy: number = 0;

    async function prepareChart(
        dataSourceOptions?: AgChartOptions['dataSource'],
        baseOptions: AgCartesianChartOptions = DATE_OPTIONS
    ) {
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
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot();
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

    it('should clip asynchronous data outside domain', async () => {
        const response = delay(1).then(() => [
            { time: new Date('2024-01-01 00:00:00'), price: 0 },
            { time: new Date('2024-01-02 00:00:00'), price: 50 },
            { time: new Date('2024-01-03 00:00:00'), price: 25 },
            { time: new Date('2024-01-04 00:00:00'), price: 75 },
            { time: new Date('2024-01-05 00:00:00'), price: 50 },
            { time: new Date('2024-01-06 00:00:00'), price: 25 },
            { time: new Date('2024-01-07 00:00:00'), price: 50 },
        ]);
        await prepareChart(
            {
                getData: () => response,
            },
            {
                ...DATE_OPTIONS,
                axes: {
                    ...DATE_OPTIONS.axes!,
                    y: {
                        ...(DATE_OPTIONS.axes!.y! as AgNumberAxisOptions),
                        type: 'number',
                        min: 40,
                        max: 100,
                    },
                },
            }
        );
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
                getData: async ({ windowStart, windowEnd }) => {
                    const day = 1000 * 60 * 60 * 24;
                    const data = await response;
                    return data.filter((d) => {
                        const time = d.time.getTime();
                        const isDay = time % day === 0;
                        const hasWindow =
                            isDate(windowStart) &&
                            isDate(windowEnd) &&
                            windowEnd.getTime() - windowStart.getTime() < day * 4;
                        const isWindow = hasWindow && time >= windowStart.getTime() && time <= windowEnd.getTime();
                        return isDay || isWindow;
                    });
                },
            };
        });

        it('should load a window at the end', async () => {
            await prepareChart(dataSource, {
                ...DATE_OPTIONS,
                initialState: { zoom: { ratioX: { start: 0.5, end: 1 } } },
            });
            await response;
            await compare();
        });

        it('should load a window in the middle', async () => {
            await prepareChart(dataSource, {
                ...DATE_OPTIONS,
                initialState: { zoom: { ratioX: { start: 0.25, end: 0.75 } } },
            });
            await response;
            await compare();
        });

        it('should change the window after a change in zoom', async () => {
            await prepareChart(dataSource);
            await response;
            await compare();
            await scrollAction(cx, cy, -1)(chart);
            await compare();
        });
    });

    describe('numeric data', () => {
        it('should load numeric data', async () => {
            const response = delay(1).then(() => [
                { x: 1, y: 0 },
                { x: 2, y: 50 },
                { x: 3, y: 25 },
                { x: 4, y: 75 },
                { x: 5, y: 50 },
                { x: 6, y: 25 },
                { x: 7, y: 50 },
            ]);
            await prepareChart({ getData: () => response }, NUMERIC_OPTIONS);
            await response;
            await compare();
        });
    });
});
