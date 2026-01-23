import { afterEach, describe, expect, it, jest } from '@jest/globals';

import type {
    AgCartesianChartOptions,
    AgChartInstance,
    AgChartOptions,
    AgPatternName,
    AgScatterSeriesItemStylerParams,
    AgScatterSeriesOptions,
    AgScatterSeriesStylerParams,
    AgScatterSeriesStylerResult,
    AgSeriesMarkerStyle,
} from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import * as examples from '../../test/examples';
import { type MockScatterStyler, newFreezableMock } from '../../test/freezableMock';
import { testLegendItemName } from '../../test/legendItemName';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    PATTERN_SNAPSHOT_DEFAULTS,
    expectWarningsCalls,
    extractImageData,
    hoverAction,
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

    describe('null category key', () => {
        it('should reject null category key with warning', async () => {
            const options: AgChartOptions = examples.SCATTER_NULL_CATEGORY_KEY_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [ScatterSeries-1 / xValue] ignored:",
    "[null]",
  ],
]
`);
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
            await compare(looserSnapshotDefaults(0.07, 5));
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
                axes: {
                    y: {
                        position: 'left',
                        type: 'number',
                    },
                    x: {
                        position: 'bottom',
                        type: 'number',
                        min: 100,
                        max: 500,
                    },
                },
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
                axes: {
                    y: {
                        position: 'left',
                        type: 'number',
                        min: 60,
                        max: 100,
                    },
                    x: {
                        position: 'bottom',
                        type: 'number',
                    },
                },
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
                axes: {
                    y: {
                        position: 'left',
                        type: 'number',
                    },
                    x: {
                        position: 'bottom',
                        type: 'number',
                        min: 100,
                        max: 500,
                    },
                },
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
                axes: {
                    y: {
                        position: 'left',
                        type: 'number',
                        min: 60,
                        max: 100,
                    },
                    x: {
                        position: 'bottom',
                        type: 'number',
                    },
                },
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
            axes: {
                y: {
                    type: 'number',
                    position: 'left',
                    reverse: true,
                },
                x: {
                    type: 'number',
                    position: 'bottom',
                    reverse: true,
                },
            },
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
    describe('AG-11673 styler', () => {
        type D = { height: number; weight: number; age: number; name: string };
        type C = unknown;
        type M = MockScatterStyler<D, C>;
        let styler: ReturnType<typeof newFreezableMock<D, C, M>>;
        const maleHeightWeight: D[] = [
            { height: 174.4, weight: 65.6, age: 21, name: 'Liam' },
            { height: 175.3, weight: 71.8, age: 23, name: 'Noah' },
            { height: 193.5, weight: 80.7, age: 28, name: 'Oliver' },
            { height: 186.5, weight: 75.6, age: 23, name: 'Elijah' },
            { height: 187.2, weight: 78.8, age: 22, name: 'James' },
            { height: 181.5, weight: 74.8, age: 21, name: 'Benjamin' },
            { height: 184.7, weight: 86.4, age: 26, name: 'Lucas' },
            { height: 175.1, weight: 62.1, age: 23, name: 'Ethan' },
            { height: 184.1, weight: 81.6, age: 21, name: 'Alexander' },
            { height: 184.5, weight: 78.4, age: 27, name: 'Mason' },
        ];
        const femaleHeightWeight: D[] = [
            { height: 161.2, weight: 51.6, age: 22, name: 'Melody' },
            { height: 167.5, weight: 59.8, age: 20, name: 'Ava' },
            { height: 159.5, weight: 49.2, age: 19, name: 'Sophia' },
            { height: 157.4, weight: 63.7, age: 25, name: 'Isabella' },
            { height: 155.8, weight: 53.6, age: 21, name: 'Mia' },
            { height: 170.2, weight: 59.1, age: 23, name: 'Amelia' },
            { height: 159.1, weight: 47.6, age: 26, name: 'Harper' },
            { height: 166.9, weight: 69.8, age: 22, name: 'Evelyn' },
            { height: 176.2, weight: 66.8, age: 28, name: 'Abigail' },
            { height: 160.2, weight: 75.2, age: 40, name: 'Charlotte' },
        ];
        beforeEach(() => {
            styler = newFreezableMock<D, C, M>(
                (params: AgScatterSeriesStylerParams<D, C>): AgScatterSeriesStylerResult | undefined => {
                    // FIXME: there's no `params.title` value
                    if (params.seriesId === 'ScatterSeries-1') {
                        return {
                            fill: {
                                type: 'gradient',
                                colorStops: [{ color: 'dodgerblue', stop: 0.1 }, { color: 'lightcyan' }],
                            },
                            stroke: 'lime', // not ignored (but no effect)
                        };
                    } else if (params.seriesId === 'ScatterSeries-2') {
                        return { shape: 'heart', fill: 'fuchsia', lineDash: [5, 3] };
                    }
                    return {};
                }
            );
        });
        describe('init', () => {
            let c1: C;
            let c2: C;
            beforeEach(async () => {
                c1 = { name: 'male context' };
                c2 = { name: 'female context' };
                chart = AgCharts.create(
                    prepareTestOptions({
                        legend: { item: { marker: { size: 40 } } },
                        series: [
                            {
                                type: 'scatter',
                                title: 'Male',
                                data: maleHeightWeight,
                                xKey: 'height',
                                yKey: 'weight',
                                size: 30,
                                context: c1,

                                styler: styler.frozen,
                                shape: 'star', // not ignored
                                strokeWidth: 0, // not ignored
                                fill: 'magenta', // ignored
                            },
                            {
                                type: 'scatter',
                                title: 'Female',
                                data: femaleHeightWeight,
                                xKey: 'height',
                                yKey: 'weight',
                                size: 30,
                                context: c2,

                                styler: styler.frozen,
                                shape: 'plus', // ignored
                                fillOpacity: 0.5, // not ignored
                                strokeWidth: 3, // not ignored
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
            });
            test('highlight', async () => {
                await hoverAction(200, 165)(chart);
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
        describe('fill types', () => {
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareTestOptions({
                        legend: {},
                        series: [
                            {
                                type: 'scatter',
                                title: 'Male',
                                data: maleHeightWeight,
                                xKey: 'height',
                                yKey: 'weight',
                                size: 30,
                                styler: () => {
                                    return {
                                        fill: {
                                            type: 'gradient',
                                            colorStops: [{ color: 'dodgerblue', stop: 0.1 }, { color: 'lightcyan' }],
                                        },
                                    };
                                },
                            },
                            {
                                type: 'scatter',
                                title: 'Female',
                                data: femaleHeightWeight,
                                xKey: 'height',
                                yKey: 'weight',
                                size: 30,
                                styler: () => {
                                    return {
                                        fill: {
                                            type: 'pattern',
                                            pattern: 'stars',
                                        },
                                    };
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
        describe('priorities', () => {
            beforeEach(async () => {
                const itemStyler = (params: AgScatterSeriesItemStylerParams<D, C>): AgSeriesMarkerStyle => {
                    if (params.datum.name === 'Mason') {
                        return {
                            fill: {
                                type: 'pattern',
                                pattern: 'stars',
                            },
                            fillOpacity: 1,
                            strokeWidth: 5,
                        };
                    }
                    if (params.datum.name == 'Charlotte') {
                        return {
                            fill: {
                                type: 'gradient',
                                colorStops: [{ color: 'deeppink', stop: 0.1 }, { color: 'pink' }],
                            },
                        };
                    }
                    if (params.datum.name == 'Harper') {
                        return {
                            lineDash: [1, 0],
                            shape: 'square',
                        };
                    }
                    return {};
                };
                const opts: AgCartesianChartOptions<D, C> = {
                    legend: { item: { marker: { size: 40 } } },
                    series: [
                        {
                            type: 'scatter',
                            title: 'Male',
                            data: maleHeightWeight,
                            xKey: 'height',
                            yKey: 'weight',
                            size: 30,

                            styler: styler.frozen,
                            itemStyler,
                            shape: 'star', // not ignored
                            strokeWidth: 0, // not ignored
                            fill: 'magenta', // ignored
                        },
                        {
                            type: 'scatter',
                            title: 'Female',
                            data: femaleHeightWeight,
                            xKey: 'height',
                            yKey: 'weight',
                            size: 30,

                            styler: styler.frozen,
                            itemStyler,
                            shape: 'plus', // ignored
                            fillOpacity: 0.5, // not ignored
                            strokeWidth: 3, // not ignored
                        },
                    ],
                };
                chart = AgCharts.create(prepareTestOptions(opts));
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
            });
        });
        describe('size', () => {
            beforeEach(async () => {
                const opts: AgCartesianChartOptions<D, C> = {
                    series: [
                        {
                            type: 'scatter',
                            data: maleHeightWeight,
                            xKey: 'height',
                            yKey: 'weight',
                            size: 4,
                            styler: () => {
                                return { size: 45 };
                            },
                        },
                    ],
                };
                chart = AgCharts.create(prepareTestOptions(opts));
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
            });
        });
    });

    describe('showInLegend', () => {
        const commonOptions = {
            series: [
                {
                    type: 'scatter',
                    data: [{ x: 10, y: 20 }],
                    xKey: 'x',
                    yKey: 'y',
                    title: 'Male',
                },
                {
                    type: 'scatter',
                    data: [{ x: 20, y: 20 }],
                    xKey: 'x',
                    yKey: 'y',
                    title: 'Female',
                },
            ],
            legend: {},
        } satisfies AgCartesianChartOptions;

        it('should hide scatter series from legend when showInLegend is false', async () => {
            const options = prepareTestOptions({
                ...commonOptions,
                title: { text: 'Two series, only female series should be shown in legend' },
                series: [commonOptions.series[0], { ...commonOptions.series[1], showInLegend: false }],
            });

            chart = AgCharts.create(options);
            await compare();
        });

        it('should show scatter series in legend when showInLegend is true (default)', async () => {
            const options = prepareTestOptions({
                ...commonOptions,
                title: { text: 'One series, only male series should be shown in legend' },
                series: [{ ...commonOptions.series[0], showInLegend: true }],
            });

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('predict axes', () => {
        it('number', async () => {
            const options: AgChartOptions = {
                data: [
                    {
                        quarter: 1,
                        iphone: 140,
                    },
                    {
                        quarter: 2,
                        iphone: 124,
                    },
                    {
                        quarter: 3,
                        iphone: 112,
                    },
                    {
                        quarter: 4,
                        iphone: 118,
                    },
                ],
                series: [{ type: 'scatter', xKey: 'quarter', yKey: 'iphone' }],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('category', async () => {
            const options: AgChartOptions = {
                data: [
                    {
                        quarter: "Q1'18",
                        iphone: 140,
                    },
                    {
                        quarter: "Q2'18",
                        iphone: 124,
                    },
                    {
                        quarter: "Q3'18",
                        iphone: 112,
                    },
                    {
                        quarter: "Q4'18",
                        iphone: 118,
                    },
                ],
                series: [{ type: 'scatter', xKey: 'quarter', yKey: 'iphone' }],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('time', async () => {
            const options: AgChartOptions = {
                data: [
                    {
                        quarter: new Date('2018-01-01'),
                        iphone: 140,
                    },
                    {
                        quarter: new Date('2018-04-01'),
                        iphone: 124,
                    },
                    {
                        quarter: new Date('2018-07-01'),
                        iphone: 112,
                    },
                    {
                        quarter: new Date('2018-10-01'),
                        iphone: 118,
                    },
                ],
                series: [{ type: 'scatter', xKey: 'quarter', yKey: 'iphone' }],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('AG-15743 legendItemName', () => {
        testLegendItemName({
            create: (o) => (chart = AgCharts.create(prepareTestOptions(o))),
            compare,
            chartOptions: {
                data: [
                    { He_V: 10, He_P: 95, Ne_V: 10, Ne_P: 90, Ar_V: 10, Ar_P: 80 },
                    { He_V: 15, He_P: 81, Ne_V: 15, Ne_P: 80, Ar_V: 15, Ar_P: 60 },
                    { He_V: 20, He_P: 68, Ne_V: 20, Ne_P: 70, Ar_V: 20, Ar_P: 40 },
                ],
                series: [
                    { type: 'scatter', xKey: 'He_V', yKey: 'He_P', yName: 'Helium' },
                    { type: 'scatter', xKey: 'Ne_V', yKey: 'Ne_P', yName: 'Neon' },
                    { type: 'scatter', xKey: 'Ar_V', yKey: 'Ar_P', yName: 'Argon' },
                ],
            },
        });
    });
});
