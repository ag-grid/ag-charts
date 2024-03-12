import { afterEach, describe, expect, it } from '@jest/globals';

import type { AgCartesianChartOptions, AgChartInstance, AgChartLegendOptions } from '../options/agChartOptions';
import { AgCharts } from './agChartV2';
import * as examples from './test/examples';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
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
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    describe('on translation only change', () => {
        it(`should render bar series correctly after update`, async () => {
            const options: AgCartesianChartOptions = {
                ...examples.STACKED_BAR_CHART_EXAMPLE,
                legend: { position: 'bottom' },
            };
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            (options.legend as AgChartLegendOptions).position = 'top';
            AgCharts.update(chart, options);

            await compare();
        });

        it(`should render line series correctly after update`, async () => {
            const options: AgCartesianChartOptions = {
                ...examples.SIMPLE_LINE_CHART_EXAMPLE,
                legend: { position: 'bottom' },
            };
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            (options.legend as AgChartLegendOptions).position = 'top';
            AgCharts.update(chart, options);

            await compare();
        });
    });
});
