import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import type { AgChartOptions } from '../../../options/agChartOptions';
import { AgChart } from '../../agChartV2';
import type { Chart } from '../../chart';
import * as examples from '../../test/examples';
import {
    repeat,
    waitForChartStability,
    IMAGE_SNAPSHOT_DEFAULTS,
    setupMockCanvas,
    extractImageData,
    prepareTestOptions,
    spyOnAnimationManager,
} from '../../test/utils';

expect.extend({ toMatchImageSnapshot });

describe('ScatterSeries', () => {
    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        (expect(imageData) as any).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    let chart: Chart;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    describe('multiple overlapping bubbles', () => {
        beforeEach(() => {
            console.warn = jest.fn();
        });

        it('should render bubble series with the correct relative Z-index', async () => {
            const options: AgChartOptions = {
                data: repeat(null, 30).reduce(
                    (result, _, i) => [
                        {
                            ...(result[0] ?? {}),
                            [`x${i}`]: 0,
                            [`y${i}`]: i,
                        },
                        {
                            ...(result[1] ?? {}),
                            [`x${i}`]: 1,
                            [`y${i}`]: 30 - i,
                        },
                    ],
                    [{}, {}]
                ),
                series: repeat(null, 30).map((_, i) => ({
                    type: 'scatter',
                    xKey: `x${i}`,
                    yKey: `y${i}`,
                    marker: {
                        size: 50,
                    },
                })),
                legend: { enabled: false },
            };

            prepareTestOptions(options);

            chart = AgChart.create(options) as Chart;
            await compare();
        });
    });

    describe('initial animation', () => {
        afterEach(() => {
            jest.restoreAllMocks();
        });

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for SIMPLE_SCATTER_CHART_EXAMPLE should animate at ${ratio * 100}%`, async () => {
                spyOnAnimationManager(1200, ratio);

                const options: AgChartOptions = examples.SIMPLE_SCATTER_CHART_EXAMPLE;
                prepareTestOptions(options);

                chart = AgChart.create(options) as Chart;
                await waitForChartStability(chart);
                await compare();
            });
        }
    });
});
