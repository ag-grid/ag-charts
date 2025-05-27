import { afterEach, describe, expect, it } from '@jest/globals';

import type { AgChartOptions } from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import { CATEGORY_LINE_ANIMATION_QUARTERS, EXAMPLES } from './test/examples-integrated-charts';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    waitForChartStability,
} from './test/utils';
import type { ChartOrProxy } from './test/utils';

describe('Integrated Charts Examples', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: ChartOrProxy;

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

    it('should execute with London timezone', () => {
        expect(new Date(2023, 0, 1).getTimezoneOffset()).toEqual(0);
    });

    describe('Changing Chart Type', () => {
        let index = 0;
        for (const [exampleName, example] of Object.entries(EXAMPLES)) {
            if (example.enterpriseCharts) continue;

            index++;

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                const startingOptions: AgChartOptions = EXAMPLES[Object.keys(EXAMPLES)[index - 1]]?.options ?? {};
                prepareTestOptions(startingOptions);

                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(startingOptions);
                await waitForChartStability(chart);

                await chart.update(options);
                await compare();
            });
        }
    });

    describe('line series animation', () => {
        describe('initial', () => {
            const animate = spyOnAnimationManager();

            for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
                it(`for CATEGORY_LINE_ANIMATION should animate at ${ratio * 100}%`, async () => {
                    animate(1000, ratio);

                    const options: AgChartOptions = { ...EXAMPLES.CATEGORY_LINE_ANIMATION.options };
                    prepareTestOptions(options);

                    chart = AgCharts.create(options);
                    await waitForChartStability(chart);
                    await compare();
                });
            }
        });

        describe('update by inserting new data', () => {
            const animate = spyOnAnimationManager();

            for (const ratio of [0, 0.4, 0.6, 0.8, 1]) {
                it(`for CATEGORY_LINE_ANIMATION should animate at ${ratio * 100}%`, async () => {
                    animate(1000, 1);

                    const options: AgChartOptions = { ...EXAMPLES.CATEGORY_LINE_ANIMATION.options };
                    prepareTestOptions(options);

                    chart = AgCharts.create(options);
                    await waitForChartStability(chart);

                    animate(1000, ratio);
                    await chart.update({
                        ...options,
                        data: [
                            ...(options.data?.slice(0, 4) ?? []),
                            { quarter: CATEGORY_LINE_ANIMATION_QUARTERS[7], week: 7, iphone: 142, android: 67 },
                            { quarter: CATEGORY_LINE_ANIMATION_QUARTERS[8], week: 8, iphone: 87, android: 120 },
                            ...(options.data?.slice(4, 7) ?? []),
                        ],
                    });

                    await waitForChartStability(chart);
                    await compare();
                });
            }
        });

        describe('update by appending new data', () => {
            const animate = spyOnAnimationManager();

            for (const ratio of [0, 0.4, 0.6, 0.8, 1]) {
                it(`for CATEGORY_LINE_ANIMATION should animate at ${ratio * 100}%`, async () => {
                    animate(1000, 1);

                    const options: AgChartOptions = { ...EXAMPLES.CATEGORY_LINE_ANIMATION.options };
                    prepareTestOptions(options);

                    chart = AgCharts.create(options);
                    await waitForChartStability(chart);

                    animate(1000, ratio);
                    await chart.update({
                        ...options,
                        data: [
                            ...(options.data ?? []),
                            { quarter: CATEGORY_LINE_ANIMATION_QUARTERS[12], week: 7, iphone: 142, android: 67 },
                            { quarter: CATEGORY_LINE_ANIMATION_QUARTERS[13], week: 8, iphone: 87, android: 120 },
                        ],
                    });

                    await waitForChartStability(chart);
                    await compare();
                });
            }
        });

        describe('update by prepending new data', () => {
            const animate = spyOnAnimationManager();

            for (const ratio of [0, 0.4, 0.6, 0.8, 1]) {
                it(`for CATEGORY_LINE_ANIMATION should animate at ${ratio * 100}%`, async () => {
                    animate(1000, 1);

                    const options: AgChartOptions = { ...EXAMPLES.CATEGORY_LINE_ANIMATION.options };
                    prepareTestOptions(options);

                    chart = AgCharts.create(options);
                    await waitForChartStability(chart);

                    animate(1000, ratio);
                    await chart.update({
                        ...options,
                        data: [
                            { quarter: CATEGORY_LINE_ANIMATION_QUARTERS[1], week: 7, iphone: 142, android: 67 },
                            { quarter: CATEGORY_LINE_ANIMATION_QUARTERS[2], week: 8, iphone: 87, android: 120 },
                            ...(options.data ?? []),
                        ],
                    });

                    await waitForChartStability(chart);
                    await compare();
                });
            }
        });

        describe('update by reversing data', () => {
            const animate = spyOnAnimationManager();

            for (const ratio of [0, 0.4, 0.6, 0.8, 1]) {
                it(`for CATEGORY_LINE_ANIMATION should animate at ${ratio * 100}%`, async () => {
                    animate(1000, 1);

                    const options: AgChartOptions = { ...EXAMPLES.CATEGORY_LINE_ANIMATION.options };
                    prepareTestOptions(options);

                    chart = AgCharts.create(options);
                    await waitForChartStability(chart);

                    animate(1000, ratio);
                    await chart.update({
                        ...options,
                        data: [...(options.data?.toReversed() ?? [])],
                    });

                    await waitForChartStability(chart);
                    await compare();
                });
            }
        });
    });
});
