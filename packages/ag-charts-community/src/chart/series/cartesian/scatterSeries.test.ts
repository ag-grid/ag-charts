import { afterEach, describe, expect, it, jest } from '@jest/globals';

import type { AgChartInstance, AgChartOptions, AgPatternName, AgScatterSeriesOptions } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import * as examples from '../../test/examples';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    PATTERN_SNAPSHOT_DEFAULTS,
    extractImageData,
    looserSnapshotDefaults,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    waitForChartStability,
} from '../../test/utils';

describe('ScatterSeries', () => {
    setupMockConsole();

    const compare = async (defaults = IMAGE_SNAPSHOT_DEFAULTS) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(defaults);
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
        it('should render scatter series with a vertical linear gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
                            gradient: 'linear',
                        },
                        size: 20,
                        strokeWidth: 0,
                    } as AgScatterSeriesOptions,
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare(looserSnapshotDefaults(0.05, 5));
        });

        it('should render scatter series with a horizontal linear gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
                            gradient: 'linear',
                            rotation: 90,
                        },
                        size: 20,
                        strokeWidth: 0,
                    } as AgScatterSeriesOptions,
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare(looserSnapshotDefaults(0.07));
        });

        it('should render scatter series with a series bound vertical linear gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
                            gradient: 'linear',
                            bounds: 'series',
                        },
                        size: 20,
                        strokeWidth: 0,
                    } as AgScatterSeriesOptions,
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
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });

        it('should render scatter series with a series bound horizontal linear gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
                            gradient: 'linear',
                            rotation: 90,
                            bounds: 'series',
                        },
                        size: 20,
                        strokeWidth: 0,
                    } as AgScatterSeriesOptions,
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
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });

        it('should render scatter series with an axes bound vertical linear gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
                            gradient: 'linear',
                            bounds: 'axis',
                        },
                        size: 20,
                        strokeWidth: 0,
                    } as AgScatterSeriesOptions,
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
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });

        it('should render scatter series with an axes bound horizontal linear gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
                            gradient: 'linear',
                            rotation: 90,
                            bounds: 'axis',
                        },
                        size: 20,
                        strokeWidth: 0,
                    } as AgScatterSeriesOptions,
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
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });

        it('should render scatter series with a default radial gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
                        },
                        size: 30,
                        strokeWidth: 0,
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });

        it('should render scatter series with a series bound radial gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
                            gradient: 'radial',
                            bounds: 'series',
                        },
                        size: 30,
                        strokeWidth: 0,
                    } as AgScatterSeriesOptions,
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });

        it('should render scatter series with a radial gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
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
                        size: 30,
                        strokeWidth: 0,
                    } as AgScatterSeriesOptions,
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
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
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'pattern',
                            pattern,
                        },
                        size: 20,
                        stroke: 'orange',
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare(looserSnapshotDefaults(0.1, 40));
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
        await compare(PATTERN_SNAPSHOT_DEFAULTS);
    });

    describe('initial animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for SIMPLE_SCATTER_CHART_EXAMPLE should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = examples.SIMPLE_SCATTER_CHART_EXAMPLE;
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare(looserSnapshotDefaults(0.05, 5));
            });
        }
    });
});
