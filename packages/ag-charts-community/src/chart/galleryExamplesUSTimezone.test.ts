/**
 * @timezone US/Pacific
 */

import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';

import type { AgChartOptions } from '../options/agChartOptions';
import { AgChart } from './agChartV2';
import type { Chart } from './chart';
import { isAgCartesianChartOptions } from './mapping/types';
import {
    waitForChartStability,
    IMAGE_SNAPSHOT_DEFAULTS,
    setupMockCanvas,
    extractImageData,
    prepareTestOptions,
} from './test/utils';
import { EXAMPLES } from './test/examples-gallery';

const TIME_AXIS_EXAMPLES = Object.entries(EXAMPLES)
    .filter(([, { options }]) => {
        if (isAgCartesianChartOptions(options)) {
            return options.axes?.some((axis) => axis.type === 'time') ?? false;
        }

        return false;
    })
    .reduce<typeof EXAMPLES>((out, [name, testCase]) => {
        out[name] = testCase;
        return out;
    }, {});

describe('Gallery Examples (US TZ)', () => {
    let chart: Chart;

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

    it('should execute with Los Angeles timezone', () => {
        expect(new Date(2023, 0, 1).getTimezoneOffset()).toEqual(480);
    });

    const ctx = setupMockCanvas();
    for (const [exampleName, example] of Object.entries(TIME_AXIS_EXAMPLES)) {
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
