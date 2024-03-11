import { afterEach, describe, expect, it } from '@jest/globals';

import type {
    AgAxisOrdinalTimeTickOptions,
    AgBaseChartOptions,
    AgCartesianAxisPosition,
    AgCartesianAxisType,
    AgCartesianChartOptions,
    AgPolarChartOptions,
} from 'ag-charts-community';
import { _ModuleSupport, time } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    extractImageData,
    reverseAxes,
    setupMockCanvas,
    waitForChartStability,
} from 'ag-charts-community-test';

import { createEnterpriseChart } from '../../test/utils';

const DATA = [
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
    {
        date: new Date('Friday, August 18, 2023'),
        open: 4344.88,
    },
    {
        date: new Date('Monday, August 21, 2023'),
        open: 4380.28,
    },
    {
        date: new Date('Tuesday, August 22, 2023'),
        open: 4415.33,
    },
    {
        date: new Date('Wednesday, August 23, 2023'),
        open: 4396.44,
    },
    {
        date: new Date('Thursday, August 24, 2023'),
        open: 4455.16,
    },
];

const BASIC_ORDINAL_TIME_AXIS_EXAMPLE: AgCartesianChartOptions = {
    data: DATA,
    axes: [
        { type: 'ordinal-time', position: 'bottom', tick: { interval: time.day.every(7) } },
        { type: 'number', position: 'left' },
    ],
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

const ORDINAL_TIME_AXIS_TICK_VALUES: AgCartesianChartOptions = {
    data: DATA,
    axes: [
        {
            type: 'ordinal-time',
            position: 'bottom',
            tick: {
                values: [
                    new Date('Wednesday, August 09, 2023'),
                    new Date('Friday, August 18, 2023'),
                    new Date('Wednesday, August 23, 2023'),
                ],
            } as AgAxisOrdinalTimeTickOptions,
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
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

const ORDINAL_TIME_AXIS_TICK_MIN_SPACING: AgCartesianChartOptions = {
    data: DATA,
    axes: [
        {
            type: 'ordinal-time',
            position: 'bottom',
            tick: { minSpacing: 300 } as AgAxisOrdinalTimeTickOptions,
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
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

const ORDINAL_TIME_AXIS_TIME_STAMP_DATA: AgCartesianChartOptions = {
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
    axes: [
        {
            type: 'ordinal-time',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
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

function applyRotation<T extends AgCartesianChartOptions | AgPolarChartOptions>(opts: T, rotation: number): T {
    return {
        ...opts,
        axes: opts.axes?.map((axis) => ({ ...axis, label: { ...axis.label, rotation } })),
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
        axes: opts.axes?.map((axis) => ({ ...axis, position: positionFlip(axis.position) })) ?? undefined,
    };
}

type TestCase<T extends AgBaseChartOptions = AgCartesianChartOptions> = {
    options: T;
    assertions: (chart: any) => Promise<void>;
    extraScreenshotActions?: (chart: any) => Promise<void>;
    compare?: AgCartesianAxisType[];
};
const EXAMPLES: Record<string, TestCase> = {
    ...mixinDerivedCases({
        BASIC_ORDINAL_TIME_AXIS_EXAMPLE: {
            options: BASIC_ORDINAL_TIME_AXIS_EXAMPLE,
            compare: ['ordinal-time'],
            assertions: cartesianChartAssertions({ axisTypes: ['ordinal-time', 'number'], seriesTypes: ['bar'] }),
        },
        ORDINAL_TIME_AXIS_TICK_MIN_SPACING: {
            options: ORDINAL_TIME_AXIS_TICK_MIN_SPACING,
            compare: ['ordinal-time'],
            assertions: cartesianChartAssertions({
                axisTypes: ['ordinal-time', 'number'],
                seriesTypes: ['bar'],
            }),
        },
        ORDINAL_TIME_AXIS_TICK_VALUES: {
            options: ORDINAL_TIME_AXIS_TICK_VALUES,
            compare: ['ordinal-time'],
            assertions: cartesianChartAssertions({
                axisTypes: ['ordinal-time', 'number'],
                seriesTypes: ['bar'],
            }),
        },
        ORDINAL_TIME_AXIS_TIME_STAMP_DATA: {
            options: ORDINAL_TIME_AXIS_TIME_STAMP_DATA,
            compare: ['ordinal-time'],
            assertions: cartesianChartAssertions({
                axisTypes: ['ordinal-time', 'number'],
                seriesTypes: ['bar'],
            }),
        },
    }),
};

function mixinDerivedCases<T extends AgBaseChartOptions>(
    baseCases: Record<string, TestCase<T>>
): Record<string, TestCase<T>> {
    const result = { ...baseCases };

    Object.entries(baseCases).forEach(([name, baseCase]) => {
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
    });

    return result;
}

function calculateAxisBBox(axis: _ModuleSupport.ChartAxis): { x: number; y: number; width: number; height: number } {
    const bbox = axis.computeBBox();

    const { x, y, width, height } = bbox;
    return { x, y, width, height };
}

describe('Ordinal Time Axis Examples', () => {
    let chart: any;
    const ctx = setupMockCanvas();

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    for (const [exampleName, example] of Object.entries(EXAMPLES)) {
        it(`for ${exampleName} it should create chart instance as expected`, async () => {
            chart = await createEnterpriseChart(example.options);
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

            chart = await createEnterpriseChart(example.options);
            await axisCompare();

            if (example.extraScreenshotActions) {
                await example.extraScreenshotActions(chart);
                await axisCompare();
            }
        });
    }
});
