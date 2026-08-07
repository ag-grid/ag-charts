import { describe } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import {
    type CartesianTestCase,
    cartesianChartAssertions,
    compareImageSnapshot,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { AgCartesianChartOptions } from 'ag-charts-types';

import { prepareEnterpriseTestOptions } from '../../test/utils';

const NUMERIC: AgCartesianChartOptions = {
    data: [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
    ],
    series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
    axes: { x: { type: 'number', position: 'bottom' }, y: { type: 'number', position: 'left' } },
};

const TIME: AgCartesianChartOptions = {
    data: [
        { x: new Date('2026-01-01'), y: 0 },
        { x: new Date('2026-01-02'), y: 100 },
    ],
    series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
    axes: { x: { type: 'time', position: 'bottom' }, y: { type: 'number', position: 'left' } },
};

const UNIT_TIME: AgCartesianChartOptions = {
    data: [
        { x: new Date('2026-01-01'), y: 0 },
        { x: new Date('2026-02-01'), y: 20 },
        { x: new Date('2026-03-01'), y: 40 },
        { x: new Date('2026-04-01'), y: 60 },
        { x: new Date('2026-05-01'), y: 40 },
        { x: new Date('2026-06-01'), y: 100 },
    ],
    series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
    axes: {
        x: { type: 'unit-time', position: 'bottom', interval: { step: 'month' } },
        y: { type: 'number', position: 'left' },
    },
};

const ORDINAL_TIME: AgCartesianChartOptions = {
    data: [
        { x: new Date('2026-01-01'), y: 0 },
        { x: new Date('2026-02-01'), y: 20 },
        { x: new Date('2026-03-01'), y: 40 },
        { x: new Date('2026-04-01'), y: 60 },
        { x: new Date('2026-05-01'), y: 40 },
        { x: new Date('2026-06-01'), y: 100 },
    ],
    series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
    axes: { x: { type: 'ordinal-time', position: 'bottom' }, y: { type: 'number', position: 'left' } },
};

const CATEGORY: AgCartesianChartOptions = {
    data: [
        { x: 'one', y: 20 },
        { x: 'two', y: 40 },
        { x: 'three', y: 60 },
        { x: 'four', y: 40 },
        { x: 'five', y: 100 },
    ],
    series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
    axes: { x: { type: 'category', position: 'bottom' }, y: { type: 'number', position: 'left' } },
};

const NO_RANGES_NUMERIC = {
    ...NUMERIC,
    seriesArea: {
        backgroundRegions: [
            {
                fill: 'lightsalmon',
            },
        ],
    },
};

const XRANGE_NUMERIC = {
    ...NUMERIC,
    seriesArea: {
        backgroundRegions: [
            {
                fill: 'lightsalmon',
                xRange: { start: 20, end: 80 },
            },
        ],
    },
};

const YRANGE_NUMERIC = {
    ...NUMERIC,
    seriesArea: {
        backgroundRegions: [
            {
                fill: 'lightsalmon',
                yRange: { start: 20, end: 80 },
            },
        ],
    },
};

const BOTH_RANGES_START_NUMERIC = {
    ...NUMERIC,
    seriesArea: {
        backgroundRegions: [
            {
                fill: 'lightsalmon',
                xRange: { start: 20 },
                yRange: { start: 20 },
            },
        ],
    },
};

const BOTH_RANGES_END_NUMERIC = {
    ...NUMERIC,
    seriesArea: {
        backgroundRegions: [
            {
                fill: 'lightsalmon',
                xRange: { end: 80 },
                yRange: { end: 80 },
            },
        ],
    },
};

const BOTH_RANGES_NUMERIC = {
    ...NUMERIC,
    seriesArea: {
        backgroundRegions: [
            {
                fill: 'lightsalmon',
                xRange: { start: 20, end: 80 },
                yRange: { start: 20, end: 80 },
            },
        ],
    },
};

const OVERLAPPING_RANGES_NUMERIC = {
    ...NUMERIC,
    seriesArea: {
        backgroundRegions: [
            {
                fill: 'lightsalmon',
                xRange: { start: 20, end: 60 },
                yRange: { start: 20, end: 60 },
            },
            {
                fill: 'thistle',
                xRange: { start: 40, end: 80 },
                yRange: { start: 40, end: 80 },
            },
        ],
    },
};

const SECONDARY_AXIS_NUMERIC: AgCartesianChartOptions = {
    series: [
        {
            type: 'scatter',
            legendItemName: 'one',
            xKey: 'x',
            yKey: 'y',
            data: [
                { x: 0, y: 0 },
                { x: 100, y: 100 },
            ],
        },
        {
            type: 'scatter',
            legendItemName: 'two',
            xKey: 'x',
            yKey: 'y',
            xKeyAxis: 'xSecondary',
            data: [
                { x: 0, y: 0 },
                { x: 100, y: 100 },
            ],
        },
    ],
    axes: {
        x: { type: 'number', position: 'bottom' },
        y: { type: 'number', position: 'left' },
        xSecondary: { type: 'number', position: 'top' },
    },
    seriesArea: {
        backgroundRegions: [
            {
                fill: 'lightsalmon',
                xRange: { axis: 'xSecondary', start: 20, end: 60 },
                yRange: { start: 20, end: 60 },
            },
            {
                fill: 'thistle',
                xRange: { start: 40, end: 80 },
                yRange: { start: 40, end: 80 },
            },
        ],
    },
};

const BOTH_RANGES_TIME = {
    ...TIME,
    seriesArea: {
        backgroundRegions: [
            {
                fill: 'lightsalmon',
                xRange: {
                    start: new Date('2026-01-01 06:00:00'),
                    end: new Date('2026-01-01 18:00:00'),
                },
                yRange: { start: 20, end: 80 },
            },
        ],
    },
};

const BOTH_RANGES_UNIT_TIME = {
    ...UNIT_TIME,
    seriesArea: {
        backgroundRegions: [
            {
                fill: 'lightsalmon',
                xRange: {
                    start: new Date('2026-02-01'),
                    end: new Date('2026-04-01'),
                },
                yRange: { start: 20, end: 80 },
            },
        ],
    },
};

const BOTH_RANGES_ORDINAL_TIME = {
    ...ORDINAL_TIME,
    seriesArea: {
        backgroundRegions: [
            {
                fill: 'lightsalmon',
                xRange: {
                    start: new Date('2026-02-01'),
                    end: new Date('2026-04-01'),
                },
                yRange: { start: 20, end: 80 },
            },
        ],
    },
};

const BOTH_RANGES_CATEGORY = {
    ...CATEGORY,
    seriesArea: {
        backgroundRegions: [
            { fill: 'lightsalmon', xRange: { start: 'two', end: 'four' }, yRange: { start: 20, end: 80 } },
        ],
    },
};

const THEMED = {
    ...NUMERIC,
    seriesArea: {
        backgroundRegions: [
            {
                fill: { type: 'gradient' as const, colorStops: [{ color: 'orangered' }, { color: 'lightsalmon' }] },
                fillOpacity: 0.8,
                stroke: 'crimson',
                strokeOpacity: 0.8,
                strokeWidth: 8,
                label: {
                    border: {
                        stroke: 'indigo',
                        strokeOpacity: 0.8,
                        strokeWidth: 4,
                    },
                    color: 'indigo',
                    cornerRadius: 8,
                    fill: { type: 'gradient' as const, colorStops: [{ color: 'mediumpurple' }, { color: 'thistle' }] },
                    fontFamily: 'serif',
                    fontSize: 14,
                    fontWeight: 'bold' as const,
                    padding: { top: 12, right: 20, bottom: 12, left: 20 },
                    position: 'inside' as const,
                    text: 'Themed Region',
                },
                xRange: { start: 20, end: 80 },
                yRange: { start: 20, end: 80 },
            },
        ],
    },
};

const assertions = cartesianChartAssertions({ seriesTypes: ['scatter'], axisTypes: { x: 'number', y: 'number' } });

const EXAMPLES: Record<string, CartesianTestCase> = {
    NO_RANGES_NUMERIC: { options: NO_RANGES_NUMERIC, assertions },
    XRANGE_NUMERIC: { options: XRANGE_NUMERIC, assertions },
    YRANGE_NUMERIC: { options: YRANGE_NUMERIC, assertions },
    BOTH_RANGES_START_NUMERIC: { options: BOTH_RANGES_START_NUMERIC, assertions },
    BOTH_RANGES_END_NUMERIC: { options: BOTH_RANGES_END_NUMERIC, assertions },
    BOTH_RANGES_NUMERIC: { options: BOTH_RANGES_NUMERIC, assertions },
    OVERLAPPING_RANGES_NUMERIC: { options: OVERLAPPING_RANGES_NUMERIC, assertions },
    SECONDARY_AXIS_NUMERIC: {
        options: SECONDARY_AXIS_NUMERIC,
        assertions: cartesianChartAssertions({
            seriesTypes: ['scatter', 'scatter'],
            axisTypes: { x: 'number', y: 'number', __AXIS_ID_2: 'number' },
        }),
    },
    BOTH_RANGES_TIME: {
        options: BOTH_RANGES_TIME,
        assertions: cartesianChartAssertions({ seriesTypes: ['scatter'], axisTypes: { x: 'time', y: 'number' } }),
    },
    BOTH_RANGES_UNIT_TIME: {
        options: BOTH_RANGES_UNIT_TIME,
        assertions: cartesianChartAssertions({ seriesTypes: ['scatter'], axisTypes: { x: 'unit-time', y: 'number' } }),
    },
    BOTH_RANGES_ORDINAL_TIME: {
        options: BOTH_RANGES_ORDINAL_TIME,
        assertions: cartesianChartAssertions({
            seriesTypes: ['scatter'],
            axisTypes: { x: 'ordinal-time', y: 'number' },
        }),
    },
    BOTH_RANGES_CATEGORY: {
        options: BOTH_RANGES_CATEGORY,
        assertions: cartesianChartAssertions({ seriesTypes: ['bar'], axisTypes: { x: 'category', y: 'number' } }),
    },
    THEMED: { options: THEMED, assertions },
};

const labelPositions = [
    'top',
    'left',
    'right',
    'bottom',
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
    'inside',
    'inside-left',
    'inside-right',
    'inside-top',
    'inside-bottom',
    'inside-top-left',
    'inside-bottom-left',
    'inside-top-right',
    'inside-bottom-right',
] as const;
for (const position of labelPositions) {
    EXAMPLES[`LABEL_${position}`] = {
        options: {
            ...NUMERIC,
            seriesArea: {
                backgroundRegions: [
                    {
                        fill: 'lightsalmon',
                        xRange: { start: 20, end: 80 },
                        yRange: { start: 20, end: 80 },
                        label: {
                            position,
                            text: position,
                            fontSize: 20,
                        },
                    },
                ],
            },
        },
        assertions,
    };
}

describe('Background Regions', () => {
    setupMockConsole();
    let chart: any;

    afterEach(async () => {
        if (chart) {
            await waitForChartStability(chart);
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await compareImageSnapshot(chart, ctx);
    };

    it.each(Object.entries(EXAMPLES))(
        'for %s it should create chart instance as expected',
        async (_exampleName, example) => {
            const options: AgCartesianChartOptions = { ...example.options };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            await example.assertions(chart);

            if (example.warnings) {
                for (const [index, message] of example.warnings.entries()) {
                    expect(console.warn).toHaveBeenNthCalledWith(
                        index + 1,
                        ...(Array.isArray(message) ? message : [message])
                    );
                }
            }
            if (!example.warnings?.length) {
                expect(console.warn).not.toHaveBeenCalled();
            }
        }
    );

    it.each(Object.entries(EXAMPLES))(
        'for %s it should render to canvas as expected',
        async (_exampleName, example) => {
            const options: AgCartesianChartOptions = { ...example.options };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();

            if (example.extraScreenshotActions) {
                await example.extraScreenshotActions(chart);
                await compare();
            }
        }
    );
});
