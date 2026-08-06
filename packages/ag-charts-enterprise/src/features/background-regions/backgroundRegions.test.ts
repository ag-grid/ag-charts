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

const assertions = cartesianChartAssertions({ seriesTypes: ['scatter'], axisTypes: { x: 'number', y: 'number' } });

const EXAMPLES: Record<string, CartesianTestCase> = {
    NO_RANGES_NUMERIC: { options: NO_RANGES_NUMERIC, assertions },
    XRANGE_NUMERIC: { options: XRANGE_NUMERIC, assertions },
    YRANGE_NUMERIC: { options: YRANGE_NUMERIC, assertions },
    BOTH_RANGES_START_NUMERIC: { options: BOTH_RANGES_START_NUMERIC, assertions },
    BOTH_RANGES_END_NUMERIC: { options: BOTH_RANGES_END_NUMERIC, assertions },
    BOTH_RANGES_NUMERIC: { options: BOTH_RANGES_NUMERIC, assertions },
    OVERLAPPING_RANGES_NUMERIC: { options: OVERLAPPING_RANGES_NUMERIC, assertions },
    // SECONDARY_AXES_NUMERIC: { options: SECONDARY_AXES_NUMERIC, assertions },
    // BOTH_RANGES_TIME: { options: BOTH_RANGES_TIME, assertions },
    // BOTH_RANGES_UNIT_TIME: { options: BOTH_RANGES_UNIT_TIME, assertions },
    // BOTH_RANGES_ORDINAL_TIME: { options: BOTH_RANGES_ORDINAL_TIME, assertions },
    // BOTH_RANGES_CATEGORY: { options: BOTH_RANGES_CATEGORY, assertions },
};

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
