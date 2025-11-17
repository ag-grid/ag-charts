import { afterEach, describe, expect, it } from '@jest/globals';

import { mapValues } from 'ag-charts-core';
import type { AgBaseChartOptions, AgCartesianAxisType, AgCartesianChartOptions } from 'ag-charts-types';

import { DOCS_EXAMPLES } from '../test/examples';
import type { ChartOrProxy } from '../test/utils';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    createChart,
    extractImageData,
    repeat,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

const EXAMPLE_GRID_LINE = {
    width: 2,
    style: [
        { fill: 'red', fillOpacity: 0.1, stroke: 'red' },
        { fill: 'blue', fillOpacity: 0.1, stroke: 'blue' },
        { fill: 'green', fillOpacity: 0.1, stroke: 'green' },
        { fill: 'yellow', fillOpacity: 0.1, stroke: 'yellow' },
    ],
};

const axesToTest = ['category', 'grouped-category', 'unit-time', 'ordinal-time'];

function applyIntervalOn<T extends AgCartesianChartOptions>(opts: T): T {
    return {
        ...opts,
        axes:
            mapValues(opts.axes ?? {}, (axis) =>
                axesToTest.includes(axis.type)
                    ? {
                          ...axis,
                          interval: { ...(axis.interval ?? {}), placement: 'on' },
                          gridLine: EXAMPLE_GRID_LINE,
                          tick: { ...(axis.tick ?? {}), enabled: true },
                      }
                    : axis
            ) ?? undefined,
    };
}

function applyIntervalBetween<T extends AgCartesianChartOptions>(opts: T): T {
    return {
        ...opts,
        axes:
            mapValues(opts.axes ?? {}, (axis) =>
                axesToTest.includes(axis.type)
                    ? {
                          ...axis,
                          interval: { ...(axis.interval ?? {}), placement: 'between' },
                          gridLine: EXAMPLE_GRID_LINE,
                          tick: { ...(axis.tick ?? {}), enabled: true },
                      }
                    : axis
            ) ?? undefined,
    };
}

const DATA = [
    {
        date: new Date('Wednesday, July 28, 2023'),
        open: 4344.88,
    },
    {
        date: new Date('Thursday, July 27, 2023'),
        open: 4380.28,
    },
    {
        date: new Date('Friday, July 28, 2023'),
        open: 4415.33,
    },
    {
        date: new Date('Saturday, July 29, 2023'),
        open: 4396.44,
    },
    {
        date: new Date('Sunday, July 30, 2023'),
        open: 4455.16,
    },
    {
        date: new Date('Monday, July 31, 2023'),
        open: 4584.82,
    },
    {
        date: new Date('Tuesday, August 01, 2023'),
        open: 4578.83,
    },
    {
        date: new Date('Wednesday, August 02, 2023'),
        open: 4550.93,
    },
    {
        date: new Date('Thursday, August 03, 2023'),
        open: 4494.27,
    },
    {
        date: new Date('Friday, August 04, 2023'),
        open: 4513.96,
    },
    {
        date: new Date('Monday, August 07, 2023'),
        open: 4491.58,
    },
    {
        date: new Date('Tuesday, August 08, 2023'),
        open: 4498.03,
    },
    {
        date: new Date('Wednesday, August 09, 2023'),
        open: 4501.57,
    },
    {
        date: new Date('Thursday, August 10, 2023'),
        open: 4487.16,
    },
    {
        date: new Date('Friday, August 11, 2023'),
        open: 4450.69,
    },
    {
        date: new Date('Monday, August 14, 2023'),
        open: 4458.13,
    },
    {
        date: new Date('Tuesday, August 15, 2023'),
        open: 4478.87,
    },
    {
        date: new Date('Wednesday, August 16, 2023'),
        open: 4433.79,
    },
    {
        date: new Date('Thursday, August 17, 2023'),
        open: 4416.32,
    },
];

const BASIC_TIME_AXIS_EXAMPLE: AgCartesianChartOptions = {
    data: DATA,
    axes: {
        x: { type: 'unit-time', position: 'bottom', unit: 'day' },
        y: { type: 'number', position: 'left' },
    },
    series: [
        {
            xKey: 'date',
            xName: 'Date',
            yKey: 'open',
            yName: 'Open Price',
            type: 'bar',
        },
    ],
};

type TestCase<T extends AgBaseChartOptions = AgCartesianChartOptions> = {
    options: T;
    assertions: (chart: ChartOrProxy) => Promise<void> | void;
    extraScreenshotActions?: (chart: ChartOrProxy) => Promise<void>;
    compare?: AgCartesianAxisType[];
};

const EXAMPLES: Record<string, TestCase> = {
    CATEGORY_AXIS_INTERVAL_ON: {
        options: applyIntervalOn(DOCS_EXAMPLES['grouped-column']),
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'category', y: 'number' },
            seriesTypes: repeat('bar', 7),
        }),
    },
    CATEGORY_AXIS_INTERVAL_BETWEEN: {
        options: applyIntervalBetween(DOCS_EXAMPLES['grouped-column']),
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'category', y: 'number' },
            seriesTypes: repeat('bar', 7),
        }),
    },
    CATEGORY_AXIS_HORIZONTAL_INTERVAL_ON: {
        options: applyIntervalOn(DOCS_EXAMPLES['grouped-bar']),
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'number', y: 'category' },
            seriesTypes: ['bar', 'bar'],
        }),
    },
    CATEGORY_AXIS_HORIZONTAL_INTERVAL_BETWEEN: {
        options: applyIntervalBetween(DOCS_EXAMPLES['grouped-bar']),
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'number', y: 'category' },
            seriesTypes: ['bar', 'bar'],
        }),
    },
    UNIT_TIME_AXIS_INTERVAL_ON: {
        options: applyIntervalOn(BASIC_TIME_AXIS_EXAMPLE),
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: ['bar'],
        }),
    },
    UNIT_TIME_INTERVAL_BETWEEN: {
        options: applyIntervalBetween(BASIC_TIME_AXIS_EXAMPLE),
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: ['bar'],
        }),
    },
};

describe('Category Axis', () => {
    setupMockConsole();

    let chart: ChartOrProxy;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await waitForChartStability(chart);

        const newImageData = extractImageData(ctx);
        expect(newImageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    for (const [exampleName, example] of Object.entries(EXAMPLES)) {
        it(`for ${exampleName} it should create chart instance as expected`, async () => {
            chart = await createChart(example.options);
            await example.assertions(chart);
        });

        it(`for ${exampleName} it should render to canvas as expected`, async () => {
            chart = await createChart(example.options);
            await compare();
        });
    }
});
