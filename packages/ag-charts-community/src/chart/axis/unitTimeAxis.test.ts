import { afterEach, describe, expect, it } from '@jest/globals';

import { mapValues } from 'ag-charts-core';
import type {
    AgBaseChartOptions,
    AgCartesianAxisPosition,
    AgCartesianAxisType,
    AgCartesianChartOptions,
    AgPolarChartOptions,
} from 'ag-charts-types';

import type { ChartAxis } from '../chartAxis';
import {
    type ChartOrProxy,
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    createChart,
    extractImageData,
    reverseAxes,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

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

const TIME_AXIS_TIME_STAMP_DATA: AgCartesianChartOptions = {
    data: [
        {
            date: 1646058600000,
            open: 163.06,
        },
        {
            date: 1646145000000,
            open: 164.7,
        },
        {
            date: 1646231400000,
            open: 164.39,
        },
        {
            date: 1646317800000,
            open: 168.47,
        },
        {
            date: 1646404200000,
            open: 164.49,
        },
        {
            date: 1646663400000,
            open: 163.36,
        },
        {
            date: 1646749800000,
            open: 158.82,
        },
        {
            date: 1646836200000,
            open: 161.48,
        },
        {
            date: 1646922600000,
            open: 160.2,
        },
        {
            date: 1647009000000,
            open: 158.93,
        },
        {
            date: 1647264600000,
            open: 151.45,
        },
        {
            date: 1647351000000,
            open: 150.9,
        },
        {
            date: 1647437400000,
            open: 157.05,
        },
        {
            date: 1647523800000,
            open: 158.61,
        },
        {
            date: 1647610200000,
            open: 160.51,
        },
        {
            date: 1647869400000,
            open: 163.51,
        },
        {
            date: 1647955800000,
            open: 165.51,
        },
        {
            date: 1648042200000,
            open: 167.99,
        },
        {
            date: 1648128600000,
            open: 171.06,
        },
        {
            date: 1648215000000,
            open: 173.88,
        },
        {
            date: 1648474200000,
            open: 172.17,
        },
        {
            date: 1648560600000,
            open: 176.69,
        },
        {
            date: 1648647000000,
            open: 178.55,
        },
        {
            date: 1648733400000,
            open: 177.84,
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
            unit: 'day',
        },
        y: {
            type: 'number',
            position: 'left',
        },
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

const TIME_AXIS_YEARLY_DATA: AgCartesianChartOptions = {
    // yearly data not aligned with the start of the year (1st of January)
    data: [
        {
            x: new Date(2023, 3, 5),
            y: 10,
        },
        {
            x: new Date(2024, 3, 5),
            y: 10,
        },
        {
            x: new Date(2025, 3, 5),
            y: 10,
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
            unit: 'year',
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'x',
            yKey: 'y',
        },
    ],
};

const TIME_AXIS_MONTHLY_DATA: AgCartesianChartOptions = {
    data: [
        {
            quarter: new Date(2019, 10, 1),
            iphone: 118,
            mac: 24,
            ipad: 14,
            wearables: 14,
            services: 36,
        },
        {
            quarter: new Date(2019, 11, 1),
            iphone: 118,
            mac: 24,
            ipad: 14,
            wearables: 14,
            services: 36,
        },
        {
            quarter: new Date(2020, 0, 1),
            iphone: 140,
            mac: 16,
            ipad: 14,
            wearables: 12,
            services: 20,
        },
        {
            quarter: new Date(2020, 1, 1),
            iphone: 124,
            mac: 20,
            ipad: 14,
            wearables: 12,
            services: 30,
        },
        {
            quarter: new Date(2020, 2, 1),
            iphone: 112,
            mac: 20,
            ipad: 18,
            wearables: 14,
            services: 36,
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
            unit: 'month',
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'iphone',
            yName: 'iPhone',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'mac',
            yName: 'Mac',
        },
    ],
};
const TIME_AXIS_IRREGULAR_TIME_INTERVAL_DATA: AgCartesianChartOptions = {
    ...TIME_AXIS_MONTHLY_DATA,
    // Monthly data with missing value for April, May, June
    data: [
        {
            quarter: 1577836800000, // 1 Jan 2020
            iphone: 140,
            mac: 16,
            ipad: 14,
            wearables: 12,
            services: 20,
        },
        {
            quarter: 1580515200000, //1 Feb 2020
            iphone: 124,
            mac: 20,
            ipad: 14,
            wearables: 12,
            services: 30,
        },
        {
            quarter: 1583020800000, //1 Mar 2020
            iphone: 112,
            mac: 20,
            ipad: 18,
            wearables: 14,
            services: 36,
        },
        {
            quarter: 1593561600000, //1 July 2020
            iphone: 118,
            mac: 24,
            ipad: 14,
            wearables: 14,
            services: 36,
        },
    ],
};

function applyRotation<T extends AgCartesianChartOptions | AgPolarChartOptions>(opts: T, rotation: number): T {
    return {
        ...opts,
        axes: mapValues(opts.axes ?? {}, (axis) => ({ ...axis, label: { ...axis.label, rotation } })),
    };
}

function applyAxesFlip<T extends AgCartesianChartOptions>(opts: T): T {
    const positionFlip = (position?: AgCartesianAxisPosition) => {
        switch (position) {
            case 'top':
                return 'bottom';
            case 'left':
                return 'right';
            case 'bottom':
                return 'top';
            case 'right':
                return 'left';
            default:
                return position;
        }
    };

    return {
        ...opts,
        axes: mapValues(opts.axes ?? {}, (axis) => ({ ...axis, position: positionFlip(axis.position) })) ?? undefined,
    };
}

type TestCase<T extends AgBaseChartOptions = AgCartesianChartOptions> = {
    options: T;
    assertions: (chart: ChartOrProxy) => Promise<void> | void;
    extraScreenshotActions?: (chart: ChartOrProxy) => Promise<void>;
    compare?: (AgCartesianAxisType | 'unit-time')[];
};
const EXAMPLES: Record<string, TestCase> = {
    ...mixinDerivedCases({
        BASIC_TIME_AXIS_EXAMPLE: {
            options: BASIC_TIME_AXIS_EXAMPLE,
            compare: ['unit-time'],
            assertions: cartesianChartAssertions({ axisTypes: { x: 'unit-time', y: 'number' }, seriesTypes: ['bar'] }),
        },
        TIME_AXIS_TIME_STAMP_DATA: {
            options: TIME_AXIS_TIME_STAMP_DATA,
            compare: ['unit-time'],
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'unit-time', y: 'number' },
                seriesTypes: ['bar'],
            }),
        },
        TIME_AXIS_YEARLY_DATA: {
            options: TIME_AXIS_YEARLY_DATA,
            compare: ['unit-time'],
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'unit-time', y: 'number' },
                seriesTypes: ['line'],
            }),
        },
        TIME_AXIS_MONTHLY_DATA: {
            options: TIME_AXIS_MONTHLY_DATA,
            compare: ['unit-time'],
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'unit-time', y: 'number' },
                seriesTypes: ['bar', 'bar'],
            }),
        },
        TIME_AXIS_IRREGULAR_TIME_INTERVAL_DATA: {
            options: TIME_AXIS_IRREGULAR_TIME_INTERVAL_DATA,
            compare: ['unit-time'],
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'unit-time', y: 'number' },
                seriesTypes: ['bar', 'bar'],
            }),
        },
    }),
};

function mixinDerivedCases<T extends AgBaseChartOptions>(
    baseCases: Record<string, TestCase<T>>
): Record<string, TestCase<T>> {
    const result = { ...baseCases };

    for (const [name, baseCase] of Object.entries(baseCases)) {
        // Add manual rotation.
        result[name + '_MANUAL_ROTATION'] = {
            ...baseCase,
            options: applyRotation(baseCase.options, -30),
        };

        // Add flipped axes.
        result[name + '_FLIP'] = {
            ...baseCase,
            options: applyAxesFlip(baseCase.options),
        };

        result[name + '_REVERSED_AXES'] = {
            ...baseCase,
            options: reverseAxes(baseCase.options, true),
        };
    }

    return result;
}

function calculateAxisBBox(axis: ChartAxis): { x: number; y: number; width: number; height: number } {
    const bbox = axis.getBBox();

    const { x, y, width, height } = bbox;
    return { x, y, width, height };
}

describe('Time Axis Examples', () => {
    setupMockConsole();
    let chart: any;
    const ctx = setupMockCanvas();

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    for (const [exampleName, example] of Object.entries(EXAMPLES)) {
        it(`for ${exampleName} it should create chart instance as expected`, async () => {
            chart = await createChart(example.options);
            await example.assertions(chart);
        });

        it(`for ${exampleName} it should render to canvas as expected`, async () => {
            const axisCompare = async () => {
                for (const axis of chart.axes) {
                    if (example.compare != null && !example.compare.includes(axis.type as AgCartesianAxisType)) {
                        continue;
                    }

                    await waitForChartStability(chart);
                    const axisBbox = calculateAxisBBox(axis);

                    const imageData = extractImageData({ ...ctx, bbox: axisBbox });

                    expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
                }
            };

            chart = await createChart(example.options);
            await axisCompare();

            if (example.extraScreenshotActions) {
                await example.extraScreenshotActions(chart);
                await axisCompare();
            }
        });
    }

    it('should handle a single value', async () => {
        const options = { ...BASIC_TIME_AXIS_EXAMPLE, data: BASIC_TIME_AXIS_EXAMPLE.data!.slice(0, 1) };
        chart = await createChart(options);
        await compare();
    });

    it('should handle two values', async () => {
        const options: AgCartesianChartOptions = {
            ...BASIC_TIME_AXIS_EXAMPLE,
            data: [
                {
                    date: new Date('2007-01-01T00:00:00.000Z'),
                    sales: 0.15813911278157827,
                },
                {
                    date: new Date('2007-04-28T23:00:00.000Z'),
                    sales: 0.7397676872473231,
                },
            ],
            series: [
                {
                    type: 'bar',
                    xKey: 'date',
                    yKey: 'sales',
                },
            ],
            axes: {
                x: { type: 'unit-time', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
        };
        chart = await createChart(options);
        await compare();
    });

    it('should handle multiple single values', async () => {
        const options: AgCartesianChartOptions = {
            ...BASIC_TIME_AXIS_EXAMPLE,
            data: undefined,
            series: [
                {
                    type: 'line',
                    xKey: 'date',
                    yKey: 'value',
                    yName: 'A',
                    data: [{ date: new Date(2020, 0, 1), value: 1 }],
                },
                {
                    type: 'line',
                    xKey: 'date',
                    yKey: 'value',
                    yName: 'B',
                    data: [{ date: new Date(2021, 0, 1), value: 2 }],
                },
                {
                    type: 'line',
                    xKey: 'date',
                    yKey: 'value',
                    yName: 'C',
                    data: [{ date: new Date(2022, 0, 1), value: 3 }],
                },
            ],
            axes: {
                x: { type: 'unit-time', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
        };
        chart = await createChart(options);
        await compare();
    });

    describe('AG-14639', () => {
        it('should not show label boxing when text is empty', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { date: new Date(2024, 0, 1), value: 2 },
                    { date: new Date(2024, 1, 1), value: 5 },
                    { date: new Date(2024, 2, 1), value: 3 },
                    { date: new Date(2024, 3, 1), value: 1 },
                    { date: new Date(2024, 4, 1), value: 2 },
                    { date: new Date(2024, 5, 1), value: 3 },
                    { date: new Date(2024, 9, 1), value: 1 },
                    { date: new Date(2024, 10, 1), value: 2 },
                    { date: new Date(2024, 11, 1), value: 2 },
                ],
                series: [{ type: 'bar', xKey: 'date', yKey: 'value' }],
                axes: {
                    x: {
                        type: 'time',
                        position: 'bottom',
                        title: { text: 'Continuous Time Axis' },
                        label: {
                            color: 'blue',
                            border: { strokeWidth: 2, stroke: 'red' },
                            fill: 'pink',
                            padding: 8,
                        },
                    },
                    y: { type: 'number', position: 'left' },
                },
            };
            chart = await createChart(options);
            await compare();
        });
    });
});
