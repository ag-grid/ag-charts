import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

import type { AgPolarChartOptions } from '../../../options/agChartOptions';
import { AgCharts } from '../../agChartV2';
import type { Chart } from '../../chart';
import { ChartUpdateType } from '../../chartUpdateType';
import { setupMockConsole } from '../../test/mockConsole';
import type { PolarTestCase } from '../../test/utils';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    deproxy,
    extractImageData,
    polarChartAssertions,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    spyOnAnimationManager,
    toMatchImage,
    waitForChartStability,
} from '../../test/utils';
import * as examples from './test/examples';

expect.extend({ toMatchImageSnapshot, toMatchImage });

const EXAMPLES: Record<string, PolarTestCase> = {
    PIE_SERIES: {
        options: examples.PIE_SERIES,
        assertions: polarChartAssertions({ seriesTypes: ['pie'] }),
    },
    PIE_SERIES_NEGATIVE_VALUES: {
        options: examples.PIE_SERIES_NEGATIVE_VALUES,
        assertions: polarChartAssertions({ seriesTypes: ['pie'] }),
    },
    PIE_SECTORS_DIFFERENT_RADII: {
        options: examples.PIE_SECTORS_DIFFERENT_RADII,
        assertions: polarChartAssertions({ seriesTypes: ['pie'] }),
    },
    PIE_SECTORS_DIFFERENT_RADII_SMALL_RADIUS_MIN: {
        options: examples.PIE_SECTORS_DIFFERENT_RADII_SMALL_RADIUS_MIN,
        assertions: polarChartAssertions({ seriesTypes: ['pie'] }),
    },
    PIE_SECTORS_DIFFERENT_RADII_LARGE_RADIUS_MIN: {
        options: examples.PIE_SECTORS_DIFFERENT_RADII_LARGE_RADIUS_MIN,
        assertions: polarChartAssertions({ seriesTypes: ['pie'] }),
    },
    PIE_SECTORS_DIFFERENT_RADII_SMALL_RADIUS_MAX: {
        options: examples.PIE_SECTORS_DIFFERENT_RADII_SMALL_RADIUS_MAX,
        assertions: polarChartAssertions({ seriesTypes: ['pie'] }),
    },
    PIE_SECTORS_DIFFERENT_RADII_LARGE_RADIUS_MAX: {
        options: examples.PIE_SECTORS_DIFFERENT_RADII_LARGE_RADIUS_MAX,
        assertions: polarChartAssertions({ seriesTypes: ['pie'] }),
    },
    PIE_SECTORS_LABELS: {
        options: examples.PIE_SECTORS_LABELS,
        assertions: polarChartAssertions({ seriesTypes: ['pie'] }),
    },
    DONUT_SERIES: {
        options: examples.DONUT_SERIES,
        assertions: polarChartAssertions({ seriesTypes: ['donut'] }),
    },
    DONUT_SERIES_INNER_TEXT: {
        options: examples.DONUT_SERIES_INNER_TEXT,
        assertions: polarChartAssertions({ seriesTypes: ['donut'] }),
    },
    DONUT_SERIES_RATIO: {
        options: examples.DONUT_SERIES_RATIO,
        assertions: polarChartAssertions({ seriesTypes: ['donut'] }),
    },
    DONUT_SERIES_DIFFERENT_RADII: {
        options: examples.DONUT_SERIES_DIFFERENT_RADII,
        assertions: polarChartAssertions({ seriesTypes: ['donut'] }),
    },
    GROUPED_DONUT_SERIES: {
        options: examples.GROUPED_DONUT_SERIES,
        assertions: polarChartAssertions({ seriesTypes: repeat('donut', 2) }),
    },
    GROUPED_DONUT_SERIES_DIFFERENT_RADII: {
        options: examples.GROUPED_DONUT_SERIES_DIFFERENT_RADII,
        assertions: polarChartAssertions({ seriesTypes: repeat('donut', 2) }),
    },
    PIE_CALLOUT_LABELS_COLLISIONS: {
        options: examples.PIE_CALLOUT_LABELS_COLLISIONS,
        assertions: polarChartAssertions({ seriesTypes: ['pie'] }),
    },
};

describe('PolarSeries', () => {
    setupMockConsole();

    let chart: Chart;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        jest.restoreAllMocks();
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    describe('#create', () => {
        it.each(Object.entries(EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                const options: AgPolarChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = deproxy(AgCharts.create(options));
                await waitForChartStability(chart);
                await example.assertions(chart);
            }
        );

        it.each(Object.entries(EXAMPLES))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                const options: AgPolarChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = deproxy(AgCharts.create(options));
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            }
        );
    });

    describe('initial animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for PIE_SERIES should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgPolarChartOptions = examples.PIE_SERIES;
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare();
            });
        }
    });

    describe('remove animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for PIE_SERIES should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgPolarChartOptions = examples.PIE_SERIES;
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                AgCharts.update(chart, {
                    ...options,
                    data: options.data!.slice(0, options.data!.length - 2),
                });
                await compare();
            });
        }
    });

    describe('add animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for PIE_SERIES should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgPolarChartOptions = examples.PIE_SERIES;
                prepareTestOptions(options);

                chart = AgCharts.create({
                    ...options,
                    data: options.data!.slice(0, options.data!.length - 2),
                });
                await waitForChartStability(chart);

                animate(1200, ratio);
                AgCharts.update(chart, { ...options });

                await compare();
            });
        }
    });

    describe('update animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for PIE_SERIES should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgPolarChartOptions = examples.PIE_SERIES;
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                AgCharts.update(chart, {
                    ...options,
                    data: options.data!.map((d) => (d.os === 'iOS' ? { ...d, share: d.share * 2 } : d)),
                });
                await compare();
            });
        }
    });

    describe('no series cases', () => {
        beforeEach(() => {
            // Increase timeout for legend toggle case.
            jest.setTimeout(10_000);
        });

        it(`for PIE_SERIES it should render identically after legend toggle`, async () => {
            const snapshot = async () => {
                await waitForChartStability(chart);

                return ctx.nodeCanvas?.toBuffer('raw');
            };

            const options: AgPolarChartOptions = { ...examples.PIE_SERIES };
            prepareTestOptions(options);
            options.legend = { enabled: true };

            chart = deproxy(AgCharts.create(options));
            const reference = await snapshot();

            options.data?.forEach((_, idx) => {
                (chart.series[0] as any).toggleSeriesItem(idx, false);
            });
            chart.update(ChartUpdateType.FULL);

            const afterUpdate = await snapshot();
            (expect(afterUpdate) as any).not.toMatchImage(reference);

            options.data?.forEach((_, idx) => {
                (chart.series[0] as any).toggleSeriesItem(idx, true);
            });
            chart.update(ChartUpdateType.FULL);

            const afterFinalUpdate = await snapshot();
            expect(afterFinalUpdate).toMatchImage(reference);
        });
    });
});
