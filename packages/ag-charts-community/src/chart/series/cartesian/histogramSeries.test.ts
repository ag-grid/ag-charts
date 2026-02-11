import { afterEach, describe, expect, it } from '@jest/globals';

import { mapValues } from 'ag-charts-core';
import type { AgCartesianChartOptions, AgChartOptions } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import { Transformable } from '../../../scene/transformable';
import { type ChartTestCase, COMMUNITY_AND_ENTERPRISE_EXAMPLES as GALLERY_EXAMPLES } from '../../test/examples-gallery';
import type { ChartOrProxy } from '../../test/utils';
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
import {
    HISTOGRAM_DATE_BASED_BUCKETS,
    HISTOGRAM_SCATTER_COMBO_SERIES_LABELS,
    HISTOGRAM_SERIES_LABELS,
} from '../test/examples';

const EXAMPLES: Record<string, ChartTestCase> = {
    SIMPLE_HISTOGRAM: GALLERY_EXAMPLES.SIMPLE_HISTOGRAM_CHART_EXAMPLE,
    HISTOGRAM_WITH_SPECIFIED_BINS: GALLERY_EXAMPLES.HISTOGRAM_WITH_SPECIFIED_BINS_EXAMPLE,
    XY_HISTOGRAM_WITH_MEAN: GALLERY_EXAMPLES.XY_HISTOGRAM_WITH_MEAN_EXAMPLE,
    HISTOGRAM_DATE_BASED_BUCKETS: {
        options: HISTOGRAM_DATE_BASED_BUCKETS,
        enterprise: true,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'time', y: 'number' }, seriesTypes: ['histogram'] }),
    },
};

describe('HistogramSeries', () => {
    setupMockConsole();

    let chart: ChartOrProxy;

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

    const createHistogramChart = (example: { options: AgChartOptions }, testOptions: AgCartesianChartOptions = {}) => {
        return AgCharts.create({
            ...prepareTestOptions({}),
            ...(example.options as AgCartesianChartOptions),
            ...testOptions,
        });
    };

    describe('#create', () => {
        it.each(Object.entries(EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                chart = createHistogramChart(example);
                await waitForChartStability(chart);
                await example.assertions(chart);
            }
        );

        it.each(Object.entries(EXAMPLES))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                chart = createHistogramChart(example);
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
                const axes = mapValues((example.options as AgCartesianChartOptions).axes ?? {}, (a) => ({
                    ...a,
                    reverse: true,
                })) ?? [
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
                ];
                chart = createHistogramChart(example, { axes });
                await waitForChartStability(chart);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                const axes = mapValues((example.options as AgCartesianChartOptions).axes ?? {}, (a) => ({
                    ...a,
                    reverse: true,
                })) ?? [
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
                ];
                chart = createHistogramChart(example, { axes });
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
                        // Tweak marker size, so it's large enough to trigger test failures if the fake mouse hover doesn't work below.
                        return { ...s, size: 20, fill: undefined, stroke: undefined, strokeWidth: 1 };
                    }
                    return s;
                }),
            };

            prepareTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const series = chart.series.find((v: any) => v.type === 'scatter');
            if (series == null) fail('No series found');

            const context: SeriesNodeDataContext<any, any> = (series as any)['contextNodeData'];
            const item = context.nodeData.find((n) => n.datum['weight'] === 65.6 && n.datum['age'] === 21);

            const { x, y } = Transformable.toCanvasPoint(series.contentGroup, item.point.x, item.point.y);

            await hoverAction(x, y)(chart);
            await waitForChartStability(chart);

            await compare();
        });
    });

    describe('Series Labels', () => {
        const examples = {
            HISTOGRAM_SERIES_LABELS: {
                options: HISTOGRAM_SERIES_LABELS,
                assertions: cartesianChartAssertions({
                    axisTypes: { x: 'number', y: 'number' },
                    seriesTypes: ['histogram'],
                }),
            },
            HISTOGRAM_SCATTER_COMBO_SERIES_LABELS: {
                options: HISTOGRAM_SCATTER_COMBO_SERIES_LABELS,
                assertions: cartesianChartAssertions({
                    axisTypes: { x: 'number', y: 'number', __AXIS_ID_2: 'number' },
                    seriesTypes: ['histogram', 'scatter'],
                }),
            },
        };

        it.each(Object.entries(examples))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                chart = createHistogramChart(example);
                await waitForChartStability(chart);
                example.assertions(chart);
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

                animate(1200, ratio);
                await chart.updateDelta({
                    data: [
                        ...options.data!.filter(
                            (d: any) => d['engine-size'] > 80 && (d['engine-size'] < 100 || d['engine-size'] > 120)
                        ),
                    ],
                });

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

                await chart.updateDelta({
                    data: [
                        ...options.data!.filter(
                            (d: any) => d['engine-size'] > 80 && (d['engine-size'] < 100 || d['engine-size'] > 120)
                        ),
                    ],
                });
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.update(options);

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

                animate(1200, ratio);
                await chart.updateDelta({
                    data: [
                        ...options.data!.map((d: any, index: number) => ({
                            ...d,
                            'engine-size': d['engine-size'] * (index % 2 === 0 ? 1.1 : 0.9),
                        })),
                    ],
                });

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

    // CRT-1043: Invisible histogram series must still populate nodeData so the remove animation
    // has actual positions to animate from rather than empty data (which causes no animation).
    describe('legend toggle nodeData (CRT-1043)', () => {
        const animate = spyOnAnimationManager();

        it('should populate nodeData for invisible histogram series after legend toggle', async () => {
            animate(1200, 1);

            // Use the histogram-with-specified-bins example — the original reproduction case.
            const options: AgChartOptions = { ...GALLERY_EXAMPLES.HISTOGRAM_WITH_SPECIFIED_BINS_EXAMPLE.options };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // Toggle series invisible (simulates legend click)
            animate(1200, 0.5);
            (options.series![0] as any).visible = false;
            await chart.update(options);
            await waitForChartStability(chart);

            const chartInstance = deproxy(chart);
            const invisibleSeries = chartInstance.series[0] as any;
            const nodeData = invisibleSeries.contextNodeData?.nodeData;

            expect(nodeData!.length).toBeGreaterThan(0);
            expect(nodeData!.some((d: any) => d.frequency > 0)).toBe(true);
        });

        // Verify that bar Rect nodes have intermediate heights during the remove animation,
        // proving the animation system has real positional data to interpolate from (the CRT-1043
        // fix). Visual snapshots are not used because axis domain collapse on a single-series chart
        // makes intermediate frames visually blank despite the animation working internally.
        it('should have bar rects at intermediate heights during legend toggle animation', async () => {
            animate(1200, 1);

            const options: AgChartOptions = { ...GALLERY_EXAMPLES.SIMPLE_HISTOGRAM_CHART_EXAMPLE.options };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // Record initial bar heights from the fully-rendered chart.
            const chartInstance = deproxy(chart);
            const series = chartInstance.series[0] as any;
            const getBarHeights = (): number[] =>
                Array.from(series.datumSelection.nodes() as Iterable<any>, (rect: any) => rect.height as number);

            const initialHeights = getBarHeights();
            expect(initialHeights.length).toBeGreaterThan(0);
            expect(initialHeights.some((h) => h > 1)).toBe(true);

            // Animate at 10% of total (40% through the remove phase which spans 0-25%).
            // Toggle invisible via options update matching the barSeries legend toggle pattern.
            animate(1200, 0.1);
            (options.series![0] as any).visible = false;
            await chart.update(options);
            await waitForChartStability(chart);

            const midHeights = getBarHeights();
            // Bars should still exist and be shorter than their initial heights.
            for (let i = 0; i < initialHeights.length; i++) {
                if (initialHeights[i] > 1) {
                    expect(midHeights[i]).toBeLessThan(initialHeights[i]);
                }
            }
        });
    });

    describe('gradient fill', () => {
        it('should render histogram series with default gradient fill', async () => {
            const options = {
                ...GALLERY_EXAMPLES.SIMPLE_HISTOGRAM_CHART_EXAMPLE.options,
                series: [
                    {
                        type: 'histogram',
                        xKey: 'engine-size',
                        fill: {
                            type: 'gradient',
                        },
                    },
                ],
            };
            prepareTestOptions(options as AgChartOptions);

            chart = AgCharts.create(options as AgChartOptions);
            await waitForChartStability(chart);

            await compare();
        });

        it('should render histogram series with a gradient fill', async () => {
            const options = {
                ...GALLERY_EXAMPLES.SIMPLE_HISTOGRAM_CHART_EXAMPLE.options,
                series: [
                    {
                        type: 'histogram',
                        xKey: 'engine-size',
                        fill: {
                            type: 'gradient',
                            colorStops: [
                                {
                                    color: 'green',
                                },
                                {
                                    color: 'white',
                                },
                            ],
                        },
                    },
                ],
            };
            prepareTestOptions(options as AgChartOptions);

            chart = AgCharts.create(options as AgChartOptions);
            await waitForChartStability(chart);

            await compare();
        });
    });
});
