import { afterEach, describe, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance, AgChartLegendOptions } from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import * as examples from './test/examples';
import {
    compareImageSnapshot,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';

describe('Scene', () => {
    setupMockConsole();

    let chart: AgChartInstance;

    const ctx = setupMockCanvas();

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const compare = async () => {
        await compareImageSnapshot(chart, ctx);
    };

    describe('on translation only change', () => {
        it(`should render bar series correctly after update`, async () => {
            const options: AgCartesianChartOptions = {
                ...examples.STACKED_BAR_CHART_EXAMPLE,
                legend: { position: 'bottom' },
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            (options.legend as AgChartLegendOptions).position = 'top';
            await chart.update(options);

            await compare();
        });

        it(`should render line series correctly after update`, async () => {
            const options: AgCartesianChartOptions = {
                ...examples.SIMPLE_LINE_CHART_EXAMPLE,
                legend: { position: 'bottom' },
                axes: {
                    y: {
                        type: 'number',
                        position: 'left',
                        title: { text: 'Price in Pence' },
                    },
                    x: {
                        type: 'time',
                        position: 'bottom',
                        title: { text: 'Date' },
                        label: { format: '%B %Y', autoRotate: true },
                        interval: { maxSpacing: 100 },
                        parentLevel: { enabled: false },
                    },
                },
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            (options.legend as AgChartLegendOptions).position = 'top';
            await chart.update(options);

            await compare();
        });
    });
});
