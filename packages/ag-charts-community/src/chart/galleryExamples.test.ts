import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import type { AgChartOptions } from '../options/agChartOptions';
import { AgCharts } from './agChartV2';
import type { Chart } from './chart';
import { EXAMPLES } from './test/examples-gallery';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';

describe('Gallery Examples', () => {
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

    describe('AgChartV2#create', () => {
        const ctx = setupMockCanvas();

        it.each(Object.entries(EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                const options: AgChartOptions = example.options;
                chart = AgCharts.create(options) as Chart;
                await waitForChartStability(chart);
                await example.assertions(chart);
            }
        );

        it.each(Object.entries(EXAMPLES))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                const compare = async () => {
                    await waitForChartStability(chart);

                    const imageData = extractImageData(ctx);
                    expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
                };

                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options) as Chart;
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            }
        );
    });

    describe('AgChartV2#update', () => {
        const ctx = setupMockCanvas();

        describe.each(Object.entries(EXAMPLES))('for %s', (_exampleName, example) => {
            let options: AgChartOptions;

            beforeEach(async () => {
                options = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options) as Chart;
                await waitForChartStability(chart);
            });

            afterEach(() => {
                options = null!;
            });

            it(`it should update chart instance as expected`, async () => {
                AgCharts.update(chart, options);
                await waitForChartStability(chart);

                await example.assertions(chart);
            });

            it(`it should render the same after update`, async () => {
                const snapshot = async () => {
                    await waitForChartStability(chart);

                    return ctx.nodeCanvas.toBuffer('raw');
                };

                AgCharts.update(chart, options);

                const before = await snapshot();
                AgCharts.update(chart, options);
                const after = await snapshot();

                expect(after).toMatchImage(before);
            });
        });
    });
});
