import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { AgChartOptions } from '../options/agChartOptions';
import { AgChart } from './agChartV2';
import type { Chart } from './chart';
import { EXAMPLES } from './test/examples-gallery';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    waitForChartStability,
} from './test/utils';

describe('Gallery Examples', () => {
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

        beforeEach(() => {
            console.warn = jest.fn();
        });

        afterEach(() => {
            expect(console.warn).not.toBeCalled();
        });

        for (const [exampleName, example] of Object.entries(EXAMPLES)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                const options: AgChartOptions = example.options;
                chart = AgChart.create(options) as Chart;
                await waitForChartStability(chart);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                const compare = async () => {
                    await waitForChartStability(chart);

                    const imageData = extractImageData(ctx);
                    expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
                };

                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgChart.create(options) as Chart;
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            });
        }
    });

    describe('AgChartV2#update', () => {
        const ctx = setupMockCanvas();

        beforeEach(() => {
            console.warn = jest.fn();
        });

        afterEach(() => {
            expect(console.warn).not.toBeCalled();
        });

        for (const [exampleName, example] of Object.entries(EXAMPLES)) {
            describe(`for ${exampleName}`, () => {
                let chart: Chart;
                let options: AgChartOptions;

                beforeEach(async () => {
                    options = { ...example.options };
                    prepareTestOptions(options);

                    chart = AgChart.create(options) as Chart;
                    await waitForChartStability(chart);
                });

                afterEach(() => {
                    chart.destroy();
                    chart = null!;
                    options = null!;
                });

                it(`it should update chart instance as expected`, async () => {
                    AgChart.update(chart, options);
                    await waitForChartStability(chart);

                    await example.assertions(chart);
                });

                it(`it should render the same after update`, async () => {
                    const snapshot = async () => {
                        await waitForChartStability(chart);

                        return ctx.nodeCanvas.toBuffer('raw');
                    };

                    AgChart.update(chart, options);

                    const before = await snapshot();
                    AgChart.update(chart, options);
                    const after = await snapshot();

                    expect(after).toMatchImage(before);
                });
            });
        }
    });
});
