import { afterEach, describe, expect, it } from '@jest/globals';

import type { AgChartOptions } from '../options/agChartOptions';
import { AgCharts } from './agChartV2';
import type { Chart } from './chart';
import { EXAMPLES } from './test/examples-integrated-charts';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';

describe('Integrated Charts Examples', () => {
    setupMockConsole();

    let chart: Chart;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    it('should execute with London timezone', () => {
        expect(new Date(2023, 0, 1).getTimezoneOffset()).toEqual(0);
    });

    describe('Changing Chart Type', () => {
        const ctx = setupMockCanvas();

        let index = 0;
        for (const [exampleName, example] of Object.entries(EXAMPLES)) {
            if (example.enterpriseCharts) continue;

            index++;

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                const compare = async () => {
                    await waitForChartStability(chart);

                    const imageData = extractImageData(ctx);
                    expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
                };

                const startingOptions: AgChartOptions = EXAMPLES[index - 1]?.options ?? {};
                prepareTestOptions(startingOptions);

                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(startingOptions) as Chart;
                await waitForChartStability(chart);

                AgCharts.update(chart, options);
                await compare();
            });
        }
    });
});
