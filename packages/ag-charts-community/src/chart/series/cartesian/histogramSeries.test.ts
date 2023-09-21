import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import type { AgChartOptions } from '../../../options/agChartOptions';
import { AgChart } from '../../agChartV2';
import type { Chart } from '../../chart';
import * as examples from '../../test/examples';
import type { TestCase } from '../../test/utils';
import {
    waitForChartStability,
    cartesianChartAssertions,
    IMAGE_SNAPSHOT_DEFAULTS,
    setupMockCanvas,
    extractImageData,
    prepareTestOptions,
    spyOnAnimationManager,
} from '../../test/utils';

expect.extend({ toMatchImageSnapshot });

const EXAMPLES: Record<string, TestCase> = {
    SIMPLE_HISTOGRAM: {
        options: examples.SIMPLE_HISTOGRAM_CHART_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: ['histogram'] }),
    },
    HISTOGRAM_WITH_SPECIFIED_BINS: {
        options: examples.HISTOGRAM_WITH_SPECIFIED_BINS_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: ['histogram'] }),
    },
    XY_HISTOGRAM_WITH_MEAN: {
        options: examples.XY_HISTOGRAM_WITH_MEAN_EXAMPLE,
        assertions: cartesianChartAssertions({
            axisTypes: ['number', 'number'],
            seriesTypes: ['histogram', 'scatter'],
        }),
    },
};

describe('HistogramSeries', () => {
    let chart: Chart;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        (expect(imageData) as any).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    describe('#create', () => {
        beforeEach(() => {
            console.warn = jest.fn();
        });

        afterEach(() => {
            expect(console.warn).not.toBeCalled();
        });

        for (const [exampleName, example] of Object.entries(EXAMPLES)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgChart.create(options) as Chart;
                await waitForChartStability(chart);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
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

    describe('initial animation', () => {
        afterEach(() => {
            jest.restoreAllMocks();
        });

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for SIMPLE_HISTOGRAM should animate at ${ratio * 100}%`, async () => {
                spyOnAnimationManager(1200, ratio);

                const options: AgChartOptions = { ...examples.SIMPLE_HISTOGRAM_CHART_EXAMPLE };
                prepareTestOptions(options);

                chart = AgChart.create(options) as Chart;
                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('remove animation', () => {
        afterEach(() => {
            jest.restoreAllMocks();
        });

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for SIMPLE_HISTOGRAM should animate at ${ratio * 100}%`, async () => {
                spyOnAnimationManager(1200, 1);

                const options: AgChartOptions = { ...examples.SIMPLE_HISTOGRAM_CHART_EXAMPLE };
                prepareTestOptions(options);

                chart = AgChart.create(options) as Chart;
                await waitForChartStability(chart);

                AgChart.updateDelta(chart, {
                    data: [
                        ...options.data!.filter(
                            (d: any) => d['engine-size'] > 80 && (d['engine-size'] < 100 || d['engine-size'] > 120)
                        ),
                    ],
                });
                spyOnAnimationManager(1200, ratio);

                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('add animation', () => {
        afterEach(() => {
            jest.restoreAllMocks();
        });

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for SIMPLE_HISTOGRAM should animate at ${ratio * 100}%`, async () => {
                spyOnAnimationManager(1200, 1);

                const options: AgChartOptions = { ...examples.SIMPLE_HISTOGRAM_CHART_EXAMPLE };
                prepareTestOptions(options);

                chart = AgChart.create(options) as Chart;
                await waitForChartStability(chart);

                AgChart.updateDelta(chart, {
                    data: [
                        ...options.data!.filter(
                            (d: any) => d['engine-size'] > 80 && (d['engine-size'] < 100 || d['engine-size'] > 120)
                        ),
                    ],
                });
                await waitForChartStability(chart);

                AgChart.update(chart, options);
                spyOnAnimationManager(1200, ratio);

                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('update animation', () => {
        afterEach(() => {
            jest.restoreAllMocks();
        });

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for SIMPLE_HISTOGRAM should animate at ${ratio * 100}%`, async () => {
                spyOnAnimationManager(1200, 1);

                const options: AgChartOptions = { ...examples.SIMPLE_HISTOGRAM_CHART_EXAMPLE };
                prepareTestOptions(options);

                chart = AgChart.create(options) as Chart;
                await waitForChartStability(chart);

                AgChart.updateDelta(chart, {
                    data: [
                        ...options.data!.map((d: any, index: number) => ({
                            ...d,
                            'engine-size': d['engine-size'] * (index % 2 === 0 ? 1.1 : 0.9),
                        })),
                    ],
                });
                spyOnAnimationManager(1200, ratio);

                await waitForChartStability(chart);
                await compare();
            });
        }
    });
});
