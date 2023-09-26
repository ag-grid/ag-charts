import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as examples from '../chart/test/examples';
import { extractImageData, IMAGE_SNAPSHOT_DEFAULTS, setupMockCanvas, waitForChartStability } from '../chart/test/utils';
import type { AgCartesianChartOptions, AgChartInstance, AgChartLegendOptions } from '../options/agChartOptions';
import { AgChart } from './../chart/agChartV2';

describe('Scene', () => {
    let chart: AgChartInstance;

    const ctx = setupMockCanvas();

    beforeEach(() => {
        console.warn = jest.fn();
    });

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        expect(console.warn).not.toBeCalled();
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
            chart = AgChart.create(options);
            await waitForChartStability(chart);

            (options.legend as AgChartLegendOptions).position = 'top';
            AgChart.update(chart, options);

            await compare();
        });

        it(`should render line series correctly after update`, async () => {
            const options: AgCartesianChartOptions = {
                ...examples.SIMPLE_LINE_CHART_EXAMPLE,
                legend: { position: 'bottom' },
            };
            chart = AgChart.create(options);
            await waitForChartStability(chart);

            (options.legend as AgChartLegendOptions).position = 'top';
            AgChart.update(chart, options);

            await compare();
        });
    });
});
