import { afterEach, describe, it } from 'vitest';

import {
    type ChartOrProxy,
    DOCS_EXAMPLES,
    applyIntervalBetween,
    applyIntervalOn,
    cartesianChartAssertions,
    compareImageSnapshot,
    repeat,
    setupMockCanvas,
    setupMockConsole,
} from 'ag-charts-community-test';
import type { AgBaseChartOptions, AgCartesianAxisType, AgCartesianChartOptions } from 'ag-charts-types';

import { createEnterpriseChart } from '../test/utils';

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
        if (chart != null) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await compareImageSnapshot(chart, ctx);
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
