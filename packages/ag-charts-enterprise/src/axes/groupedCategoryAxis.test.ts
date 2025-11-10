import { afterEach, describe, expect, it } from '@jest/globals';

import { AgCharts } from 'ag-charts-community';
import {
    cartesianChartAssertions,
    mapValues,
    repeat,
    reverseAxes,
    waitForChartStability,
} from 'ag-charts-community-test';
import {
    type ChartOrProxy,
    IMAGE_SNAPSHOT_DEFAULTS,
    INTEGRATED_CHARTS_GROUPED_CATEGORY_AXIS_WITH_MINI_CHART_EXAMPLE,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
} from 'ag-charts-community-test';
import type {
    AgBaseChartOptions,
    AgCartesianAxisPosition,
    AgCartesianAxisType,
    AgCartesianChartOptions,
    AgPolarChartOptions,
} from 'ag-charts-types';

import { prepareEnterpriseTestOptions } from '../test/utils';

function applyRotation<T extends AgCartesianChartOptions | AgPolarChartOptions>(opts: T, rotation: number): T {
    return {
        ...opts,
        axes: mapValues(opts.axes ?? {}, (axis) => ({
            ...axis,
            label: { ...axis.label, rotation, avoidCollisions: false },
        })),
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
    compare?: AgCartesianAxisType[];
};

const EXAMPLES: Record<string, TestCase> = {
    ...mixinDerivedCases({
        INTEGRATED_CHARTS_GROUPED_CATEGORY_AXIS_WITH_MINI_CHART_EXAMPLE: {
            options: INTEGRATED_CHARTS_GROUPED_CATEGORY_AXIS_WITH_MINI_CHART_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'grouped-category', y: 'number' },
                seriesTypes: repeat('bar', 3),
            }),
            compare: ['grouped-category'],
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

describe('Grouped Category Axis Examples', () => {
    setupMockConsole();

    let chart: ChartOrProxy;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    for (const [exampleName, example] of Object.entries(EXAMPLES)) {
        it(`for ${exampleName} it should create chart instance as expected`, async () => {
            const options = prepareEnterpriseTestOptions(example.options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            await example.assertions(chart);
        });

        it(`for ${exampleName} it should render to canvas as expected`, async () => {
            const options = prepareEnterpriseTestOptions(example.options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            expect(extractImageData(ctx)).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });
    }
});
