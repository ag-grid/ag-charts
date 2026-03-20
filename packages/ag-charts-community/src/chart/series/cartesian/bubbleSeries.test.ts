import { afterEach, describe, expect, it, jest } from '@jest/globals';

import type {
    AgBubbleSeriesItemStylerParams,
    AgBubbleSeriesStylerParams,
    AgBubbleSeriesStylerResult,
    AgCartesianChartOptions,
    AgChartInstance,
    AgChartOptions,
    AgColorRepeat,
    AgImageFillFit,
    AgPatternName,
    AgSeriesMarkerStyle,
} from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import * as examples from '../../test/examples';
import { type MockBubbleStyler, newFreezableMock } from '../../test/freezableMock';
import { testLegendItemName } from '../../test/legendItemName';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    PATTERN_SNAPSHOT_DEFAULTS,
    expectWarningsCalls,
    extractImageData,
    hoverAction,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    waitForChartStability,
} from '../../test/utils';

describe('BubbleSeries', () => {
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
            await compare();
        });
    });

    describe('null category key', () => {
        it('should reject null category key with warning', async () => {
            const options: AgChartOptions = examples.BUBBLE_NULL_CATEGORY_KEY_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [BubbleSeries-1 / xValue] ignored:",
    "[null]",
  ],
]
`);
            await compare();
        });

        it('should accept null category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = examples.BUBBLE_NULL_CATEGORY_KEY_ALLOWED_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });
    });

    describe('undefined category key', () => {
        it('should reject undefined category key with warning', async () => {
            const options: AgChartOptions = examples.BUBBLE_UNDEFINED_CATEGORY_KEY_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [undefined] for [BubbleSeries-1 / xValue] ignored:",
    "[undefined]",
  ],
]
`);
            await compare();
        });

        it('should accept undefined category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = examples.BUBBLE_UNDEFINED_CATEGORY_KEY_ALLOWED_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });

        it('should treat null and undefined as distinct categories when allowNullKeys is true', async () => {
            const options: AgChartOptions = examples.BUBBLE_NULL_AND_UNDEFINED_KEYS_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
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
                                },
                            },
                        },
                    },
                },
                ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });
    });

    describe('image fill', () => {
        it.each(['repeat', 'no-repeat'] as AgColorRepeat[])(
            'it should create a chart with repeat %s image',
            async (repetition) => {
                const options: AgChartOptions = {
                    theme: {
                        overrides: {
                            bubble: {
                                series: {
                                    fillOpacity: 1,
                                    fill: {
                                        type: 'image',
                                        url: `${process.cwd()}/packages/ag-charts-website/public/example-assets/docs-images/ag-grid-logomark.png`,
                                        width: 25,
                                        height: 25,
                                        repeat: repetition,
                                    },
                                },
                            },
                        },
                    },
                    ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
                };

                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare(PATTERN_SNAPSHOT_DEFAULTS);
            }
        );

        it.each(['contain', 'cover', 'stretch', 'none'] as AgImageFillFit[])(
            'it should create a chart with fit %s image',
            async (fit) => {
                const options: AgChartOptions = {
                    theme: {
                        overrides: {
                            bubble: {
                                series: {
                                    fillOpacity: 1,
                                    fill: {
                                        type: 'image',
                                        url: `${process.cwd()}/packages/ag-charts-website/public/example-assets/docs-images/ag-grid-logomark.png`,
                                        fit,
                                    },
                                },
                            },
                        },
                    },
                    ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
                };

                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare(PATTERN_SNAPSHOT_DEFAULTS);
            }
        );
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
    describe('AG-11673 styler', () => {
        type D = { height: number; weight: number; age: number; name: string };
        type C = unknown;
        type M = MockBubbleStyler<D, C>;
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
                (params: AgBubbleSeriesStylerParams<D, C>): AgBubbleSeriesStylerResult | undefined => {
                    // FIXME: there's no `params.title` value
                    if (params.seriesId === 'BubbleSeries-1') {
                        return {
                            fill: {
                                type: 'gradient',
                                colorStops: [{ color: 'dodgerblue', stop: 0.1 }, { color: 'lightcyan' }],
                            },
                            stroke: 'lime', // not ignored (but no effect)
                        };
                    } else if (params.seriesId === 'BubbleSeries-2') {
                        return { shape: 'heart', fill: 'fuchsia', size: 2, maxSize: 200, lineDash: [5, 3] };
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
                                type: 'bubble',
                                title: 'Male',
                                data: maleHeightWeight,
                                xKey: 'height',
                                yKey: 'weight',
                                sizeKey: 'age',
                                size: 30,
                                maxSize: 100,
                                context: c1,

                                styler: styler.frozen,
                                shape: 'star', // not ignored
                                strokeWidth: 0, // not ignored
                                fill: 'magenta', // ignored
                            },
                            {
                                type: 'bubble',
                                title: 'Female',
                                data: femaleHeightWeight,
                                xKey: 'height',
                                yKey: 'weight',
                                sizeKey: 'age',
                                size: 30,
                                maxSize: 100,
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
                                type: 'bubble',
                                title: 'Male',
                                data: maleHeightWeight,
                                xKey: 'height',
                                yKey: 'weight',
                                sizeKey: 'age',
                                size: 30,
                                maxSize: 100,
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
                                type: 'bubble',
                                title: 'Female',
                                data: femaleHeightWeight,
                                xKey: 'height',
                                yKey: 'weight',
                                sizeKey: 'age',
                                size: 30,
                                maxSize: 100,
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
                const itemStyler = (params: AgBubbleSeriesItemStylerParams<D, C>): AgSeriesMarkerStyle => {
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
                            type: 'bubble',
                            title: 'Male',
                            data: maleHeightWeight,
                            xKey: 'height',
                            yKey: 'weight',
                            sizeKey: 'age',
                            size: 30,
                            maxSize: 100,

                            styler: styler.frozen,
                            itemStyler,
                            shape: 'star', // not ignored
                            strokeWidth: 0, // not ignored
                            fill: 'magenta', // ignored
                        },
                        {
                            type: 'bubble',
                            title: 'Female',
                            data: femaleHeightWeight,
                            xKey: 'height',
                            yKey: 'weight',
                            sizeKey: 'age',
                            size: 30,
                            maxSize: 100,

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
    });

    describe('cutout drawing mode', () => {
        it('should render bubble series with cutout highlight drawing mode', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 10, y: 20, size: 15 },
                    { x: 20, y: 30, size: 25 },
                    { x: 30, y: 40, size: 20 },
                    { x: 40, y: 50, size: 30 },
                    { x: 50, y: 60, size: 18 },
                ],
                series: [
                    {
                        type: 'bubble',
                        xKey: 'x',
                        yKey: 'y',
                        sizeKey: 'size',
                        title: 'Bubble Series',
                        highlight: {
                            highlightedItem: {
                                fill: 'blue',
                                fillOpacity: 0.2,
                                stroke: 'black',
                            },
                        },
                    },
                ],
                highlight: {
                    drawingMode: 'cutout',
                },
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);

            await waitForChartStability(chart);
            await hoverAction(200, 300)(chart);
            await compare();
        });

        it('should render scatter series with cutout highlight drawing mode', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 10, y: 15 },
                    { x: 20, y: 25 },
                    { x: 30, y: 35 },
                    { x: 40, y: 45 },
                    { x: 50, y: 55 },
                ],
                series: [
                    {
                        type: 'scatter',
                        xKey: 'x',
                        yKey: 'y',
                        title: 'Scatter Series',
                        shape: 'diamond',
                        highlight: {
                            highlightedItem: {
                                fill: 'green',
                                fillOpacity: 0.5,
                                stroke: 'pink',
                            },
                        },
                        size: 25,
                    },
                ],
                highlight: {
                    drawingMode: 'cutout',
                },
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);

            await waitForChartStability(chart);
            await hoverAction(250, 350)(chart);
            await compare();
        });

        it('should render multi-series bubble with cutout highlight drawing mode', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { category: 'A', series1: 10, series2: 15, size1: 20, size2: 25 },
                    { category: 'B', series1: 20, series2: 25, size1: 30, size2: 35 },
                    { category: 'C', series1: 30, series2: 35, size1: 25, size2: 30 },
                    { category: 'D', series1: 40, series2: 45, size1: 35, size2: 40 },
                ],
                series: [
                    {
                        type: 'bubble',
                        xKey: 'category',
                        yKey: 'series1',
                        sizeKey: 'size1',
                        title: 'Series 1',
                        highlight: {
                            highlightedItem: {
                                fillOpacity: 0,
                                stroke: 'black',
                            },
                        },
                    },
                    {
                        type: 'bubble',
                        xKey: 'category',
                        yKey: 'series2',
                        sizeKey: 'size2',
                        title: 'Series 2',
                        highlight: {
                            highlightedItem: {
                                fill: 'yellow',
                                fillOpacity: 0.2,
                                stroke: 'pink',
                                lineDash: [4, 2],
                            },
                        },
                    },
                ],
                highlight: {
                    drawingMode: 'cutout',
                },
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);

            await waitForChartStability(chart);
            await hoverAction(180, 280)(chart);
            await compare();
        });
    });

    describe('showInLegend', () => {
        const commonOptions = {
            series: [
                {
                    type: 'bubble',
                    data: [{ x: 10, y: 20, size: 15 }],
                    xKey: 'x',
                    yKey: 'y',
                    sizeKey: 'size',
                    title: 'Male',
                },
                {
                    type: 'bubble',
                    data: [{ x: 20, y: 20, size: 10 }],
                    xKey: 'x',
                    yKey: 'y',
                    sizeKey: 'size',
                    title: 'Female',
                },
            ],
            legend: {},
        } satisfies AgCartesianChartOptions;

        it('should hide bubble series from legend when showInLegend is false', async () => {
            const options = prepareTestOptions({
                ...commonOptions,
                title: { text: 'Two series, only female series should be shown in legend' },
                series: [commonOptions.series[0], { ...commonOptions.series[1], showInLegend: false }],
            });

            chart = AgCharts.create(options);
            await compare();
        });

        it('should show bubble series in legend when showInLegend is true (default)', async () => {
            const options = prepareTestOptions({
                ...commonOptions,
                title: { text: 'One series, only male series should be shown in legend' },
                series: [{ ...commonOptions.series[0], showInLegend: true }],
            });

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
                    { He_V: 10, He_P: 95, He_m: 2, Ne_V: 10, Ne_P: 90, Ne_m: 10, Ar_V: 10, Ar_P: 80, Ar_m: 18 },
                    { He_V: 15, He_P: 81, He_m: 2, Ne_V: 15, Ne_P: 80, Ne_m: 10, Ar_V: 15, Ar_P: 60, Ar_m: 18 },
                    { He_V: 20, He_P: 68, He_m: 2, Ne_V: 20, Ne_P: 70, Ne_m: 10, Ar_V: 20, Ar_P: 40, Ar_m: 18 },
                ],
                series: [
                    { type: 'bubble', xKey: 'He_V', yKey: 'He_P', sizeKey: 'He_m', maxSize: 20, yName: 'Helium' },
                    { type: 'bubble', xKey: 'Ne_V', yKey: 'Ne_P', sizeKey: 'Ne_m', maxSize: 20, yName: 'Neon' },
                    { type: 'bubble', xKey: 'Ar_V', yKey: 'Ar_P', sizeKey: 'Ar_m', maxSize: 20, yName: 'Argon' },
                ],
            },
        });
    });
});
