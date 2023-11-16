import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

import type { AgChartOptions } from '../../../options/agChartOptions';
import { AgCharts } from '../../agChartV2';
import type { Chart } from '../../chart';
import * as examples from '../../test/examples';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    spyOnAnimationManager,
    waitForChartStability,
} from '../../test/utils';

expect.extend({ toMatchImageSnapshot });

describe('ScatterSeries', () => {
    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    let chart: Chart;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        jest.restoreAllMocks();
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

            chart = AgCharts.create(options) as Chart;
            await compare();
        });
    });

    describe('initial animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for SIMPLE_SCATTER_CHART_EXAMPLE should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = examples.SIMPLE_SCATTER_CHART_EXAMPLE;
                prepareTestOptions(options);

                chart = AgCharts.create(options) as Chart;
                await compare();
            });
        }
    });

    describe('remove animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for SIMPLE_SCATTER_CHART_EXAMPLE should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = examples.SIMPLE_SCATTER_CHART_EXAMPLE;
                prepareTestOptions(options);

                chart = AgCharts.create(options) as Chart;
                await waitForChartStability(chart);

                animate(900, ratio);
                AgCharts.updateDelta(chart, {
                    data: options.data!.slice(Math.floor(options.data!.length / 2)),
                });

                await compare();
            });
        }
    });

    describe('add animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for SIMPLE_SCATTER_CHART_EXAMPLE should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = examples.SIMPLE_SCATTER_CHART_EXAMPLE;
                prepareTestOptions(options);

                chart = AgCharts.create(options) as Chart;
                await waitForChartStability(chart);

                AgCharts.updateDelta(chart, {
                    data: options.data!.slice(Math.floor(options.data!.length / 2)),
                });
                animate(1200, 1);

                await waitForChartStability(chart);

                AgCharts.update(chart, options);
                animate(1200, ratio);

                await compare();
            });
        }
    });

    describe('update animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for SIMPLE_SCATTER_CHART_EXAMPLE should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = examples.SIMPLE_SCATTER_CHART_EXAMPLE;
                prepareTestOptions(options);

                chart = AgCharts.create(options) as Chart;
                await waitForChartStability(chart);

                AgCharts.updateDelta(chart, {
                    data: options.data!.map((d: any, i: number) =>
                        i % 2 === 0 ? { ...d, height: d.height * 1.1 } : d
                    ),
                });
                animate(1200, ratio);

                await compare();
            });
        }
    });
});
