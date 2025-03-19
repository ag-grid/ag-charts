import { afterEach, describe, expect, it, jest } from '@jest/globals';

import type { AgChartInstance, AgChartOptions, AgPatternName } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import * as examples from '../../test/examples';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    waitForChartStability,
} from '../../test/utils';

describe('BubbleSeries', () => {
    setupMockConsole();

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        jest.restoreAllMocks();
    });

    const ctx = setupMockCanvas();

    describe('multiple overlapping bubbles', () => {
        it('should render bubble series with the correct relative Z-index', async () => {
            const options: AgChartOptions = {
                data: repeat(null, 30).reduce(
                    (result, _, i) => [
                        {
                            ...(result[0] ?? {}),
                            [`x${i}`]: 0,
                            [`y${i}`]: i,
                            [`s${i}`]: 0.5,
                        },
                        {
                            ...(result[1] ?? {}),
                            [`x${i}`]: 1,
                            [`y${i}`]: 30 - i,
                            [`s${i}`]: 0.5,
                        },
                    ],
                    [{}, {}]
                ),
                series: repeat(null, 30).map((_, i) => ({
                    type: 'bubble',
                    xKey: `x${i}`,
                    yKey: `y${i}`,
                    sizeKey: `s${i}`,
                    size: 20,
                    maxSize: 50,
                })),
                legend: { enabled: false },
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render bubble series with reversed axes', async () => {
            const options: AgChartOptions = {
                ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
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
        });
    });

    describe('pattern fill', () => {
        it.each([
            'vertical-lines',
            'horizontal-lines',
            'forward-slanted-lines',
            'backward-slanted-lines',
            'circles',
            'squares',
            'triangles',
            'diamonds',
            'stars',
            'hearts',
            'crosses',
        ] as AgPatternName[])('it should create a chart with %s pattern', async (pattern) => {
            const options: AgChartOptions = {
                theme: {
                    overrides: {
                        bubble: {
                            series: {
                                fill: {
                                    type: 'pattern',
                                    pattern,
                                    stroke: 'green',
                                    fill: 'orange',
                                    backgroundFill: 'yellow',
                                    strokeWidth: 2,
                                    padding: 2,
                                },
                            },
                        },
                    },
                },
                ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('gradient fill', () => {
        it('should render bubble series with a vertical linear gradient fill', async () => {
            const options: AgChartOptions = {
                theme: {
                    overrides: {
                        bubble: {
                            series: {
                                fill: {
                                    type: 'gradient',
                                    /* @ts-expect-error internal option */
                                    gradient: 'linear',
                                },
                            },
                        },
                    },
                },
                ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render bubble series with a horizontal linear gradient fill', async () => {
            const options: AgChartOptions = {
                theme: {
                    overrides: {
                        bubble: {
                            series: {
                                fill: {
                                    type: 'gradient',
                                    /* @ts-expect-error internal option */
                                    gradient: 'linear',
                                    rotation: 90,
                                },
                            },
                        },
                    },
                },
                ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render bubble series with a series bound vertical linear gradient fill', async () => {
            const options: AgChartOptions = {
                theme: {
                    overrides: {
                        bubble: {
                            series: {
                                fill: {
                                    type: 'gradient',
                                    /* @ts-expect-error internal option */
                                    gradient: 'linear',
                                    bounds: 'series',
                                },
                            },
                        },
                    },
                },
                ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render bubble series with a series bound horizontal linear gradient fill', async () => {
            const options: AgChartOptions = {
                theme: {
                    overrides: {
                        bubble: {
                            series: {
                                fill: {
                                    type: 'gradient',
                                    /* @ts-expect-error internal option */
                                    gradient: 'linear',
                                    rotation: 90,
                                    bounds: 'series',
                                },
                            },
                        },
                    },
                },
                ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render bubble series with an axes bound vertical linear gradient fill', async () => {
            const options: AgChartOptions = {
                theme: {
                    overrides: {
                        bubble: {
                            series: {
                                fill: {
                                    type: 'gradient',
                                    /* @ts-expect-error internal option */
                                    gradient: 'linear',
                                    bounds: 'axis',
                                },
                            },
                        },
                    },
                },
                ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render bubble series with an axes bound horizontal linear gradient fill', async () => {
            const options: AgChartOptions = {
                theme: {
                    overrides: {
                        bubble: {
                            series: {
                                fill: {
                                    type: 'gradient',
                                    /* @ts-expect-error internal option */
                                    gradient: 'linear',
                                    rotation: 90,
                                    bounds: 'axis',
                                },
                            },
                        },
                    },
                },
                ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render bubble series with a default radial gradient fill', async () => {
            const options: AgChartOptions = {
                theme: {
                    overrides: {
                        bubble: {
                            series: {
                                fill: {
                                    type: 'gradient',
                                    /* @ts-expect-error internal option */
                                    bounds: 'axis',
                                },
                            },
                        },
                    },
                },
                ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render bubble series with a series bound radial gradient fill', async () => {
            const options: AgChartOptions = {
                theme: {
                    overrides: {
                        bubble: {
                            series: {
                                fill: {
                                    type: 'gradient',
                                    /* @ts-expect-error internal option */
                                    gradient: 'radial',
                                    bounds: 'series',
                                },
                            },
                        },
                    },
                },
                ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render bubble series with a radial gradient fill', async () => {
            const options: AgChartOptions = {
                theme: {
                    overrides: {
                        bubble: {
                            series: {
                                fill: {
                                    type: 'gradient',
                                    /* @ts-expect-error internal option */
                                    gradient: 'radial',
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
                        },
                    },
                },
                ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('initial animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE;
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await compare();
            });
        }
    });
});
