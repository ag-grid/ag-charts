import { afterEach, describe, expect, it } from '@jest/globals';

import {
    type AgChartOptions,
    AgCharts,
    type AgPolarChartOptions,
    type AgRadialColumnSeriesOptions,
    type AgRadialSeriesItemStylerParams,
    type AgRadialSeriesStyle,
    type AgRadialSeriesStylerParams,
} from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    type MockRadialColumnStyler,
    expectWarningsCalls,
    extractImageData,
    hoverAction,
    newFreezableMock,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    testLegendItemName,
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
            axes: {
                angle: {
                    type: 'angle-category',
                    reverse: true,
                },
                radius: {
                    type: 'radius-number',
                    reverse: true,
                },
            },
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
            axes: {
                angle: {
                    type: 'angle-category',
                    reverse: true,
                },
                radius: {
                    type: 'radius-number',
                    reverse: true,
                },
            },
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
            axes: {
                angle: {
                    type: 'angle-category',
                    reverse: true,
                },
                radius: {
                    type: 'radius-number',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it('should render radial column chart with all negative values', async () => {
        const options: AgChartOptions = {
            data: [
                { category: 'A', value: -10 },
                { category: 'B', value: -15 },
                { category: 'C', value: -8 },
                { category: 'D', value: -12 },
            ],
            series: [
                {
                    type: 'radial-column',
                    angleKey: 'category',
                    radiusKey: 'value',
                },
            ],
        };
        prepareEnterpriseTestOptions(options);
        chart = AgCharts.create(options);
        await compare();
    });

    it('should render radial column chart with all negative values and reversed axes', async () => {
        const options: AgChartOptions = {
            data: [
                { category: 'A', value: -10 },
                { category: 'B', value: -15 },
                { category: 'C', value: -8 },
                { category: 'D', value: -12 },
            ],
            series: [
                {
                    type: 'radial-column',
                    angleKey: 'category',
                    radiusKey: 'value',
                },
            ],
            axes: {
                angle: {
                    type: 'angle-category',
                    reverse: true,
                },
                radius: {
                    type: 'radius-number',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options);
        chart = AgCharts.create(options);
        await compare();
    });

    it('should render stacked radial column chart with corner clipping', async () => {
        const options: AgChartOptions = {
            data: [
                { quarter: 'Q1', software: 4.35, hardware: 2.14 },
                { quarter: 'Q2', software: 4.28, hardware: 3.13 },
                { quarter: 'Q3', software: 4.14, hardware: 3.34 },
                { quarter: 'Q4', software: 3.48, hardware: 3.56 },
                { quarter: 'Q5', software: 3.35, hardware: 3.14 },
            ],
            series: [
                {
                    type: 'radial-column',
                    angleKey: 'quarter',
                    radiusKey: 'software',
                    radiusName: 'Software',
                    stackGroup: 'stack',
                },
                {
                    type: 'radial-column',
                    angleKey: 'quarter',
                    radiusKey: 'hardware',
                    radiusName: 'Hardware',
                    stackGroup: 'stack',
                },
            ],
            axes: {
                angle: {
                    type: 'angle-category',
                },
                radius: {
                    type: 'radius-number',
                    nice: false,
                },
            },
        };
        prepareEnterpriseTestOptions(options);
        chart = AgCharts.create(options);
        await compare();
    });

    it('should render single datum radial column with label positioned at top center', async () => {
        const options: AgChartOptions = {
            data: [{ quarter: `Q1'22`, revenue: 4.35 }],
            series: [
                {
                    type: 'radial-column',
                    angleKey: 'quarter',
                    radiusKey: 'revenue',
                    label: {
                        enabled: true,
                    },
                },
            ],
        };
        prepareEnterpriseTestOptions(options);
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

    describe('AG-15782 styler', () => {
        type D = { quarter: string; sw: number; hw: number };
        type C = unknown;
        type O = AgPolarChartOptions<D, C>;
        type M = MockRadialColumnStyler<D, C>;
        let styler: ReturnType<typeof newFreezableMock<D, C, M>>;
        let data: D[];

        beforeEach(() => {
            data = [
                { quarter: `Q1'22`, sw: 4.35, hw: 2.14 },
                { quarter: `Q2'22`, sw: 4.28, hw: 3.13 },
                { quarter: `Q3'22`, sw: 4.14, hw: 3.34 },
                { quarter: `Q4'22`, sw: 3.48, hw: 3.56 },
                { quarter: `Q1'23`, sw: 3.35, hw: 3.14 },
                { quarter: `Q2'23`, sw: 3.28, hw: 3.13 },
                { quarter: `Q3'23`, sw: 3.14, hw: 2.84 },
                { quarter: `Q4'23`, sw: 2.48, hw: 2.46 },
            ];
            styler = newFreezableMock<D, C, M>(
                (params: AgRadialSeriesStylerParams<D, C>): AgRadialSeriesStyle | undefined => {
                    if (params.radiusKey === 'sw') {
                        return {
                            fill: 'cyan',
                            lineDash: [7, 2],
                            lineDashOffset: 5,
                            stroke: 'blue',
                            strokeWidth: 7,
                            strokeOpacity: 0.5,
                        };
                    }
                    if (params.radiusKey === 'hw')
                        return {
                            fill: 'hotpink',
                            stroke: 'darkmagenta',
                            strokeWidth: 4,
                        };
                    return {};
                }
            );
        });
        describe('init', () => {
            let c1: C;
            let c2: C;
            beforeEach(async () => {
                c1 = { name: 'software context 1' };
                c2 = { name: 'hardware context 2' };
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<O>({
                        data,
                        series: [
                            {
                                type: 'radial-column',
                                angleKey: 'quarter',
                                radiusKey: 'sw',
                                radiusName: 'Software',
                                context: c1,
                                fill: 'lime', // ignored
                                fillOpacity: 0.5, // not ignored
                                styler: styler.frozen,
                            },
                            {
                                type: 'radial-column',
                                angleKey: 'quarter',
                                radiusKey: 'hw',
                                context: c2,
                                stroke: 'CornflowerBlue', // ignored
                                strokeOpacity: 0.5, // not ignored
                                strokeWidth: 15, // ignored
                                styler: styler.frozen,
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
            });
            describe('callbacks', () => {
                test('context', () => {
                    styler.expect().nthCalledWithContext(0, c1);
                    styler.expect().nthCalledWithContext(1, c2);
                    styler.expect().toHaveBeenCalledTimes(2);
                });
                test('params', () => {
                    expect(styler.mock.mock.calls).toMatchSnapshot();
                });
            });
        });
        describe('priorities', () => {
            beforeEach(async () => {
                const itemStyler = (params: AgRadialSeriesItemStylerParams<D, C>): AgRadialSeriesStyle => {
                    if (params.radiusKey === 'sw' && params.datum.quarter === `Q1'22`) {
                        return { fill: 'lightskyblue', stroke: 'deepskyblue' };
                    }
                    if (params.radiusKey === 'hw' && params.datum.quarter === `Q3'23`) {
                        return { fill: 'darkkhaki', strokeWidth: 7, strokeOpacity: 1 };
                    }
                    return {};
                };
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<O>({
                        data,
                        series: [
                            {
                                type: 'radial-column',
                                angleKey: 'quarter',
                                radiusKey: 'sw',
                                radiusName: 'Software',
                                fill: 'lime', // ignored
                                fillOpacity: 0.5, // not ignored
                                styler: styler.frozen,
                                itemStyler,
                            },
                            {
                                type: 'radial-column',
                                angleKey: 'quarter',
                                radiusKey: 'hw',
                                stroke: 'CornflowerBlue', // ignored
                                strokeOpacity: 0.5, // not ignored
                                strokeWidth: 15, // ignored
                                styler: styler.frozen,
                                itemStyler,
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
            });
        });
        describe('gradient-pattern', () => {
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<O>({
                        data,
                        series: [
                            {
                                type: 'radial-column',
                                angleKey: 'quarter',
                                radiusKey: 'sw',
                                radiusName: 'Software',
                                styler: () => {
                                    return { fill: { type: 'gradient' } };
                                },
                            },
                            {
                                type: 'radial-column',
                                angleKey: 'quarter',
                                radiusKey: 'hw',
                                styler: () => {
                                    return { fill: { type: 'pattern' } };
                                },
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
            });
        });
        describe('highlights', () => {
            // Manual-test version available at radial-column-series-test#styler-highlight-state
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<O>({
                        data,
                        series: [
                            {
                                type: 'radial-column',
                                angleKey: 'quarter',
                                radiusKey: 'sw',
                                radiusName: 'Software',
                                styler: styler.frozen,
                            },
                            {
                                type: 'radial-column',
                                angleKey: 'quarter',
                                radiusKey: 'hw',
                                styler: styler.frozen,
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });

            const miss = { x: 100, y: 100 } as const;
            const series0datum0 = { x: 400, y: 200 } as const;
            const series0datum2 = { x: 465, y: 275 } as const;
            const series1datum0 = { x: 400, y: 120 } as const;
            const legendItem0 = { x: 375, y: 570 } as const;
            const legendItem1 = { x: 450, y: 570 } as const;

            describe('single', () => {
                async function testHover(p: { readonly x: number; readonly y: number }) {
                    await hoverAction(p.x, p.y)(chart);
                    expect(styler.mock.mock.calls).toMatchSnapshot();
                }
                test('miss', async () => testHover(miss));
                test('series[0].datum[0]', async () => testHover(series0datum0));
                test('series[0].datum[2]', async () => testHover(series0datum2));
                test('series[1].datum[0]', async () => testHover(series1datum0));
                test('legendItem[0]', async () => testHover(legendItem0));
                test('legendItem[1]', async () => testHover(legendItem1));
            });
            describe('sequenced', () => {
                async function hover(p: { readonly x: number; readonly y: number }) {
                    await hoverAction(p.x, p.y)(chart);
                }
                test('1', async () => {
                    await hover(miss);
                    await hover(series0datum0);
                    await hover(miss);
                    await hover(series0datum2);
                    await hover(miss);
                    await hover(series1datum0);
                    await hover(miss);
                    await hover(legendItem0);
                    await hover(legendItem1);
                    expect(styler.mock.mock.calls).toMatchSnapshot();
                });
            });
        });
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

    describe('AG-15743 legendItemName', () => {
        testLegendItemName({
            create: (o) => (chart = AgCharts.create(prepareEnterpriseTestOptions(o))),
            compare,
            chartOptions: {
                data: [
                    { x: 0, s1: 100, s2: 200, s3: 300 },
                    { x: 1, s1: 100, s2: 200, s3: 300 },
                    { x: 3, s1: 100, s2: 200, s3: 300 },
                ],
                series: [
                    { type: 'radial-column', angleKey: 'x', radiusKey: 's1', radiusName: 'series 1' },
                    { type: 'radial-column', angleKey: 'x', radiusKey: 's2', radiusName: 'series 2' },
                    { type: 'radial-column', angleKey: 'x', radiusKey: 's3', radiusName: 'series 3' },
                ],
            },
        });
    });

    describe('null category key', () => {
        const RADIAL_COLUMN_NULL_CATEGORY_KEY_DATA = [
            { category: 'A', value: 10 },
            { category: null, value: 20 },
            { category: 'B', value: 15 },
        ];

        const RADIAL_COLUMN_NULL_CATEGORY_KEY_OPTIONS: AgChartOptions = {
            data: RADIAL_COLUMN_NULL_CATEGORY_KEY_DATA,
            series: [
                {
                    type: 'radial-column',
                    angleKey: 'category',
                    radiusKey: 'value',
                },
            ],
        };

        it('should reject null category key with warning', async () => {
            const options: AgChartOptions = { ...RADIAL_COLUMN_NULL_CATEGORY_KEY_OPTIONS };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [RadialColumnSeries-1 / angleValue] ignored:",
    "[null]",
  ],
]
`);
            await compare();
        });

        it('should accept null category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...RADIAL_COLUMN_NULL_CATEGORY_KEY_OPTIONS,
                series: [
                    {
                        ...RADIAL_COLUMN_NULL_CATEGORY_KEY_OPTIONS.series![0],
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });
    });

    describe('undefined category key', () => {
        const RADIAL_COLUMN_UNDEFINED_CATEGORY_KEY_DATA = [
            { category: 'A', value: 10 },
            { category: undefined, value: 20 },
            { category: 'B', value: 15 },
        ];

        const RADIAL_COLUMN_NULL_AND_UNDEFINED_KEYS_DATA = [
            { category: 'A', value: 10 },
            { category: null, value: 20 },
            { category: undefined, value: 25 },
            { category: 'B', value: 15 },
        ];

        const RADIAL_COLUMN_UNDEFINED_CATEGORY_KEY_OPTIONS: AgChartOptions = {
            data: RADIAL_COLUMN_UNDEFINED_CATEGORY_KEY_DATA,
            series: [
                {
                    type: 'radial-column',
                    angleKey: 'category',
                    radiusKey: 'value',
                },
            ],
        };

        const RADIAL_COLUMN_NULL_AND_UNDEFINED_KEYS_OPTIONS: AgChartOptions = {
            data: RADIAL_COLUMN_NULL_AND_UNDEFINED_KEYS_DATA,
            series: [
                {
                    type: 'radial-column',
                    angleKey: 'category',
                    radiusKey: 'value',
                },
            ],
        };

        it('should reject undefined category key with warning', async () => {
            const options: AgChartOptions = { ...RADIAL_COLUMN_UNDEFINED_CATEGORY_KEY_OPTIONS };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [undefined] for [RadialColumnSeries-1 / angleValue] ignored:",
    "[undefined]",
  ],
]
`);
            await compare();
        });

        it('should accept undefined category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...RADIAL_COLUMN_UNDEFINED_CATEGORY_KEY_OPTIONS,
                series: [
                    {
                        ...RADIAL_COLUMN_UNDEFINED_CATEGORY_KEY_OPTIONS.series![0],
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });

        it('should treat null and undefined as distinct categories', async () => {
            const options: AgChartOptions = {
                ...RADIAL_COLUMN_NULL_AND_UNDEFINED_KEYS_OPTIONS,
                series: [
                    {
                        ...RADIAL_COLUMN_NULL_AND_UNDEFINED_KEYS_OPTIONS.series![0],
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });
    });
});
