import { afterEach, describe, expect, it } from '@jest/globals';

import { type AgChartOptions, AgCharts, AgRadialColumnSeriesOptions } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('RadialColumnSeries', () => {
    setupMockConsole();
    let chart: any;
    const ctx = setupMockCanvas();

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const EXAMPLE_OPTIONS: AgChartOptions = {
        title: {
            text: `Night & Gale Inc revenue by product category`,
        },
        subtitle: {
            text: 'in million U.S. dollars',
        },
        data: [
            { quarter: `Q1'22`, 'Mountain air': 4.35, 'Polar winds': 2.14, 'Donut holes': 3.91 },
            { quarter: `Q2'22`, 'Mountain air': 4.28, 'Polar winds': 3.13, 'Donut holes': 3.04 },
            { quarter: `Q3'22`, 'Mountain air': 4.14, 'Polar winds': 3.34, 'Donut holes': 3.18 },
            { quarter: `Q4'22`, 'Mountain air': 3.48, 'Polar winds': 3.56, 'Donut holes': 3.61 },
            { quarter: `Q1'23`, 'Mountain air': 3.35, 'Polar winds': 3.14, 'Donut holes': 3.91 },
            { quarter: `Q2'23`, 'Mountain air': 3.28, 'Polar winds': 3.13, 'Donut holes': 3.54 },
            { quarter: `Q3'23`, 'Mountain air': 3.14, 'Polar winds': 2.84, 'Donut holes': 3.18 },
            { quarter: `Q4'23`, 'Mountain air': 2.48, 'Polar winds': 2.46, 'Donut holes': 3.21 },
        ],
        series: [
            {
                type: 'radial-column',
                angleKey: 'quarter',
                radiusKey: 'Mountain air',
            },
            {
                type: 'radial-column',
                angleKey: 'quarter',
                radiusKey: 'Polar winds',
            },
            {
                type: 'radial-column',
                angleKey: 'quarter',
                radiusKey: 'Donut holes',
            },
        ],
    };

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    it(`should render radial column chart as expected`, async () => {
        const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
        prepareEnterpriseTestOptions(options as any);
        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render radial column chart as expected with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            axes: [
                {
                    type: 'angle-category',
                    reverse: true,
                },
                {
                    type: 'radius-number',
                    reverse: true,
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);
        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render stacked radial column as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: EXAMPLE_OPTIONS.series?.map((series) => {
                return {
                    ...series,
                    stacked: true,
                };
            }),
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render stacked radial column with per-series data as expected`, async () => {
        const { data, series, ...exampleOptions } = EXAMPLE_OPTIONS;
        const options: AgChartOptions = {
            ...exampleOptions,
            series: series?.map((s) => {
                return {
                    ...s,
                    stacked: true,
                    data: [...(data ?? [])],
                };
            }),
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render stacked radial column as expected with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: EXAMPLE_OPTIONS.series?.map((series) => {
                return {
                    ...series,
                    stacked: true,
                };
            }),
            axes: [
                {
                    type: 'angle-category',
                    reverse: true,
                },
                {
                    type: 'radius-number',
                    reverse: true,
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render normalized radial column as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: EXAMPLE_OPTIONS.series?.map((series) => {
                return {
                    ...series,
                    stacked: true,
                    normalizedTo: 100,
                };
            }),
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render normalized radial column as expected with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: EXAMPLE_OPTIONS.series?.map((series) => {
                return {
                    ...series,
                    stacked: true,
                    normalizedTo: 100,
                };
            }),
            axes: [
                {
                    type: 'angle-category',
                    reverse: true,
                },
                {
                    type: 'radius-number',
                    reverse: true,
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    describe('initial animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for EXAMPLE_OPTIONS should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('remove animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for EXAMPLE_OPTIONS should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                chart.updateDelta({
                    data: options.data!.slice(0, 4),
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
            it(`for EXAMPLE_OPTIONS should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const { data: fullData } = EXAMPLE_OPTIONS;
                const options: AgChartOptions = { ...EXAMPLE_OPTIONS, data: fullData?.slice(0, 4) };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                chart.updateDelta({
                    data: fullData,
                });
                animate(1200, ratio);

                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('update animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for EXAMPLE_OPTIONS should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                chart.updateDelta({
                    data: options.data!.map((d: any) => {
                        return Object.entries(d).reduce((obj, [key, value], i) => {
                            return Object.assign(obj, { [key]: typeof value === 'number' ? value * i : value });
                        }, {});
                    }),
                });
                animate(1200, ratio);

                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('gradient fill', () => {
        it('should render radial column series with a default gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'radial-column',
                        angleKey: 'quarter',
                        radiusKey: 'Mountain air',
                        fill: {
                            type: 'gradient',
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render radial column series with a gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'radial-column',
                        angleKey: 'quarter',
                        radiusKey: 'Mountain air',
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
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render radial column series with an item bound gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'radial-column',
                        angleKey: 'quarter',
                        radiusKey: 'Mountain air',
                        fill: {
                            type: 'gradient',
                            bounds: 'item',
                            colorStops: [
                                {
                                    color: 'green',
                                },
                                {
                                    color: 'white',
                                },
                            ],
                        },
                    } as AgRadialColumnSeriesOptions,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render radial column series with a linear gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'radial-column',
                        angleKey: 'quarter',
                        radiusKey: 'Mountain air',
                        fill: {
                            type: 'gradient',
                            gradient: 'linear',
                            colorStops: [
                                {
                                    color: 'green',
                                },
                                {
                                    color: 'white',
                                },
                            ],
                        },
                    } as AgRadialColumnSeriesOptions,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render radial column series with an item bound linear gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'radial-column',
                        angleKey: 'quarter',
                        radiusKey: 'Mountain air',
                        fill: {
                            type: 'gradient',
                            gradient: 'linear',
                            bounds: 'item',
                            colorStops: [
                                {
                                    color: 'green',
                                },
                                {
                                    color: 'white',
                                },
                            ],
                        },
                    } as AgRadialColumnSeriesOptions,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    test('AG-8290 label boxing', async () => {
        const options = prepareEnterpriseTestOptions({
            data: [
                { department: 'Sales', quality: 40, efficiency: 75 },
                { department: 'Engineering', quality: 45, efficiency: 90 },
                { department: 'HR', quality: 80, efficiency: 60 },
                { department: 'Marketing', quality: 80, efficiency: 60 },
                { department: 'Finance', quality: 85, efficiency: 50 },
            ],
            series: [
                {
                    type: 'radial-column',
                    angleKey: 'department',
                    radiusKey: 'quality',
                    label: {
                        fontWeight: 'bold',
                        padding: 5,
                        border: { strokeWidth: 3, stroke: 'lightblue' },
                        fill: 'lightgrey',
                        fillOpacity: 0.7,
                        cornerRadius: 10,
                    },
                },
            ],
        });

        chart = AgCharts.create(options);
        await compare();
    });

    describe('AG-15448', () => {
        const DATA1 = [
            { quarter: `Q1'22`, revenue: 4.35, status: 1 },
            { quarter: `Q2'22`, revenue: 4.28, status: 1 },
            { quarter: `Q3'22`, revenue: 4.14, status: 1 },
            { quarter: `Q4'22`, revenue: 3.48, status: 2 },
            { quarter: `Q3'23`, revenue: 3.14, status: 2 }, // This overlaps with the DATA2 dataset and can render in the wrong color.
            { quarter: `Q4'23`, revenue: 2.48, status: 1 },
        ];

        const DATA2 = [
            { quarter: `Q1'23`, revenue: 3.35, status: 2 },
            { quarter: `Q2'23`, revenue: 3.28, status: 1 },
            { quarter: `Q3'23`, revenue: 3.14, status: 2 },
        ];

        const TEST_OPTIONS: AgChartOptions<
            { quarter: string; revenue: number; status: number },
            { colors: Record<number, string> }
        > = {
            context: { colors: { 1: 'orange', 2: 'green' } },
            data: DATA1,
            series: [
                {
                    type: 'radial-column',
                    angleKey: 'quarter',
                    radiusKey: 'revenue',
                    label: { formatter: ({ datum, context }) => context?.colors[datum.status] ?? 'none' },
                    itemStyler: ({ datum, context }) => ({
                        fill: context?.colors[datum.status] ?? 'none',
                    }),
                },
            ],
        };

        it('should render updated data in the itemStyler specified colors', async () => {
            const options = { ...TEST_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            await chart.updateDelta({ data: DATA2 });
            await compare();
        });
    });
});
