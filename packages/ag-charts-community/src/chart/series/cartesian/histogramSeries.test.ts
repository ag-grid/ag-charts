import { afterEach, describe, expect, it } from '@jest/globals';

import { AgCharts } from '../../../api/agChart';
import type { AgChartOptions } from '../../../options/agChartOptions';
import { COMMUNITY_AND_ENTERPRISE_EXAMPLES as GALLERY_EXAMPLES, type TestCase } from '../../test/examples-gallery';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    deproxy,
    extractImageData,
    hoverAction,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    waitForChartStability,
} from '../../test/utils';
import type { SeriesNodeDataContext } from '../series';
import { HISTOGRAM_SCATTER_COMBO_SERIES_LABELS, HISTOGRAM_SERIES_LABELS } from '../test/examples';

const EXAMPLES: Record<string, TestCase> = {
    SIMPLE_HISTOGRAM: GALLERY_EXAMPLES.SIMPLE_HISTOGRAM_CHART_EXAMPLE,
    HISTOGRAM_WITH_SPECIFIED_BINS: GALLERY_EXAMPLES.HISTOGRAM_WITH_SPECIFIED_BINS_EXAMPLE,
    XY_HISTOGRAM_WITH_MEAN: GALLERY_EXAMPLES.XY_HISTOGRAM_WITH_MEAN_EXAMPLE,
};

describe('HistogramSeries', () => {
    setupMockConsole();

    let chart: any;

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
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    describe('#create', () => {
        it.each(Object.entries(EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await example.assertions(chart);
            }
        );

        it.each(Object.entries(EXAMPLES))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            }
        );
    });

    describe('#reversed axes', () => {
        for (const [exampleName, example] of Object.entries(EXAMPLES)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                const options: AgChartOptions = {
                    ...example.options,
                    axes: [
                        {
                            type: 'number',
                            position: 'left',
                            reverse: true,
                        },
                        {
                            type: 'number',
                            position: 'bottom',
                            reverse: true,
                        },
                    ],
                };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                const options: AgChartOptions = {
                    ...example.options,
                    axes: [
                        {
                            type: 'number',
                            position: 'left',
                            reverse: true,
                        },
                        {
                            type: 'number',
                            position: 'bottom',
                            reverse: true,
                        },
                    ],
                };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            });
        }
    });

    describe('series highlighting', () => {
        it('should highlight scatter datum when overlapping histogram', async () => {
            const options = {
                ...HISTOGRAM_SCATTER_COMBO_SERIES_LABELS,
                series: HISTOGRAM_SCATTER_COMBO_SERIES_LABELS.series?.map((s) => {
                    if (s.type === 'scatter') {
                        // Tweak marker size so it's large enough to trigger test failures if the
                        // fake mouse hover doesn't work below.
                        return { ...s, marker: { size: 20 } };
                    }

                    return s;
                }),
                container: document.body,
            };

            prepareTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const series = chart.series.find((v: any) => v.type === 'scatter');
            if (series == null) fail('No series found');

            const context: SeriesNodeDataContext<any, any> = series['contextNodeData'];
            const item = context.nodeData.find((n) => n.datum['weight'] === 65.6 && n.datum['age'] === 21);

            const { x, y } = series.rootGroup.inverseTransformPoint(item.point.x, item.point.y);

            await hoverAction(x, y)(chart);
            await waitForChartStability(chart);

            await compare();
        });
    });

    describe('Series Labels', () => {
        const examples = {
            HISTOGRAM_SERIES_LABELS: {
                options: HISTOGRAM_SERIES_LABELS,
                assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: ['histogram'] }),
            },
            HISTOGRAM_SCATTER_COMBO_SERIES_LABELS: {
                options: HISTOGRAM_SCATTER_COMBO_SERIES_LABELS,
                assertions: cartesianChartAssertions({
                    axisTypes: ['number', 'number', 'number'],
                    seriesTypes: ['histogram', 'scatter'],
                }),
            },
        };

        it.each(Object.entries(examples))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await example.assertions(chart);
            }
        );

        it.each(Object.entries(examples))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare();
            }
        );
    });

    describe('initial animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for SIMPLE_HISTOGRAM should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = { ...GALLERY_EXAMPLES.SIMPLE_HISTOGRAM_CHART_EXAMPLE.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('remove animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for SIMPLE_HISTOGRAM should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = { ...GALLERY_EXAMPLES.SIMPLE_HISTOGRAM_CHART_EXAMPLE.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                chart.updateDelta({
                    data: [
                        ...options.data!.filter(
                            (d: any) => d['engine-size'] > 80 && (d['engine-size'] < 100 || d['engine-size'] > 120)
                        ),
                    ],
                });
                animate(1200, ratio);

                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('add animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for SIMPLE_HISTOGRAM should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = { ...GALLERY_EXAMPLES.SIMPLE_HISTOGRAM_CHART_EXAMPLE.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                chart.updateDelta({
                    data: [
                        ...options.data!.filter(
                            (d: any) => d['engine-size'] > 80 && (d['engine-size'] < 100 || d['engine-size'] > 120)
                        ),
                    ],
                });
                await waitForChartStability(chart);

                chart.update(options);
                animate(1200, ratio);

                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('update animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for SIMPLE_HISTOGRAM should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = { ...GALLERY_EXAMPLES.SIMPLE_HISTOGRAM_CHART_EXAMPLE.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                chart.updateDelta({
                    data: [
                        ...options.data!.map((d: any, index: number) => ({
                            ...d,
                            'engine-size': d['engine-size'] * (index % 2 === 0 ? 1.1 : 0.9),
                        })),
                    ],
                });
                animate(1200, ratio);

                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    // See https://ag-grid.atlassian.net/browse/AG-8641
    describe('explicit binCount', () => {
        test('with 0 decimal places', async () => {
            const options: AgChartOptions = {
                data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((x) => {
                    return { x };
                }),
                series: [{ type: 'histogram', xKey: 'x', binCount: 10 }],
            };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        test('with 1 decimal places', async () => {
            const options: AgChartOptions = {
                data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((x) => {
                    return { x: x / 10 };
                }),
                series: [{ type: 'histogram', xKey: 'x', binCount: 10 }],
            };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        test('with 2 decimal places', async () => {
            const options: AgChartOptions = {
                data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((x) => {
                    return { x: x / 100 };
                }),
                series: [{ type: 'histogram', xKey: 'x', binCount: 10 }],
            };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });
});
