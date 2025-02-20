import { afterEach, describe, expect, it, jest } from '@jest/globals';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-types';

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

describe('ScatterSeries', () => {
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
                    size: 50,
                })),
                legend: { enabled: false },
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('gradient fill', () => {
        it('should render scatter series with a vertical gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
                            direction: 'vertical',
                        },
                        size: 20,
                        strokeWidth: 0,
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render scatter series with a horizontal gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
                            direction: 'horizontal',
                        },
                        size: 20,
                        strokeWidth: 0,
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render scatter series with a series bound vertical gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
                            direction: 'vertical',
                            bounds: 'series',
                        },
                        size: 20,
                        strokeWidth: 0,
                    },
                ],
                axes: [
                    {
                        position: 'left',
                        type: 'number',
                    },
                    {
                        position: 'bottom',
                        type: 'number',
                        min: 100,
                        max: 500,
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render scatter series with a series bound horizontal gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
                            direction: 'horizontal',
                            bounds: 'series',
                        },
                        size: 20,
                        strokeWidth: 0,
                    },
                ],
                axes: [
                    {
                        position: 'left',
                        type: 'number',
                        min: 60,
                        max: 100,
                    },
                    {
                        position: 'bottom',
                        type: 'number',
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render scatter series with an axes bound vertical gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
                            direction: 'vertical',
                            bounds: 'axes',
                        },
                        size: 20,
                        strokeWidth: 0,
                    },
                ],
                axes: [
                    {
                        position: 'left',
                        type: 'number',
                    },
                    {
                        position: 'bottom',
                        type: 'number',
                        min: 100,
                        max: 500,
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render scatter series with an axes bound horizontal gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
                            direction: 'horizontal',
                            bounds: 'axes',
                        },
                        size: 20,
                        strokeWidth: 0,
                    },
                ],
                axes: [
                    {
                        position: 'left',
                        type: 'number',
                        min: 60,
                        max: 100,
                    },
                    {
                        position: 'bottom',
                        type: 'number',
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    it('should render scatter series with reversed axes', async () => {
        const options: AgChartOptions = {
            ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
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

    describe('initial animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for SIMPLE_SCATTER_CHART_EXAMPLE should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = examples.SIMPLE_SCATTER_CHART_EXAMPLE;
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare();
            });
        }
    });
});
