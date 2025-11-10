import { afterEach, describe, expect, it } from '@jest/globals';

import {
    ChartOrProxy,
    DOCS_EXAMPLES,
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    extractImageData,
    mapValues,
    repeat,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { AgBaseChartOptions, AgCartesianAxisType, AgCartesianChartOptions } from 'ag-charts-types';

import { createEnterpriseChart } from '../test/utils';

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

function applyZoom<T extends AgCartesianChartOptions>(opts: T): T {
    return {
        ...opts,
        initialState: { zoom: { ratioX: { start: 0.1 } } },
        zoom: { enabled: true },
    };
}

type TestCase<T extends AgBaseChartOptions = AgCartesianChartOptions> = {
    options: T;
    assertions: (chart: ChartOrProxy) => Promise<void> | void;
    extraScreenshotActions?: (chart: ChartOrProxy) => Promise<void>;
    compare?: AgCartesianAxisType[];
};

const EXAMPLES: Record<string, TestCase> = {
    CATEGORY_AXIS_INTERVAL_ON_ZOOMED: {
        options: applyZoom(applyIntervalOn(DOCS_EXAMPLES['grouped-column'])),
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'category', y: 'number' },
            seriesTypes: repeat('bar', 7),
        }),
    },
    CATEGORY_AXIS_INTERVAL_BETWEEN_ZOOMED: {
        options: applyZoom(applyIntervalBetween(DOCS_EXAMPLES['grouped-column'])),
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'category', y: 'number' },
            seriesTypes: repeat('bar', 7),
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
            chart = await createEnterpriseChart(example.options);
            await example.assertions(chart);
        });

        it(`for ${exampleName} it should render to canvas as expected`, async () => {
            chart = await createEnterpriseChart(example.options);
            await compare();
        });
    }
});
