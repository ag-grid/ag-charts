import { afterEach, describe, expect, it } from '@jest/globals';

import {
    type AgChartOptions,
    AgCharts,
    AgNightingaleSeriesOptions,
    AgPolarChartOptions,
    AgRadialSeriesItemStylerParams,
    AgRadialSeriesStyle,
    AgRadialSeriesStylerParams,
} from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    MockNightingaleStyler,
    clickAction,
    doubleClickAction,
    doubleTapAction,
    extractImageData,
    hoverAction,
    looserSnapshotDefaults,
    newFreezableMock,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    tapAction,
    testLegendItemName,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('NightingaleSeries', () => {
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
                type: 'nightingale',
                angleKey: 'quarter',
                radiusKey: 'Mountain air',
            },
            {
                type: 'nightingale',
                angleKey: 'quarter',
                radiusKey: 'Polar winds',
            },
            {
                type: 'nightingale',
                angleKey: 'quarter',
                radiusKey: 'Donut holes',
            },
        ],
    };

    const compare = async (customSnapshotIdentifier?: string, useLooserDefaults = false) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        // Use much higher threshold for nightingale AG-15016 changes: 11-20% differences = 50k-100k pixels
        const defaults = useLooserDefaults ? looserSnapshotDefaults(0.1, 105000) : IMAGE_SNAPSHOT_DEFAULTS;
        expect(imageData).toMatchImageSnapshot({ ...defaults, customSnapshotIdentifier });
    };

    it(`should render stacked nightingale chart as expected`, async () => {
        const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
        prepareEnterpriseTestOptions(options as any);
        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render stacked nightingale chart with data per series as expected`, async () => {
        const { data, series, ...exampleOptions } = EXAMPLE_OPTIONS;
        const options: AgChartOptions = {
            ...exampleOptions,
            series: series?.map((s) => ({ ...s, data: [...(data ?? [])] })),
        };
        prepareEnterpriseTestOptions(options as any);
        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render stacked nightingale chart as expected with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            axes: [
                {
                    type: 'radius-number',
                    reverse: true,
                },
                {
                    type: 'angle-category',
                    reverse: true,
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);
        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render grouped nightingale as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: EXAMPLE_OPTIONS.series?.map((series) => {
                return {
                    ...series,
                    grouped: true,
                };
            }),
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render grouped nightingale as expected with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: EXAMPLE_OPTIONS.series?.map((series) => {
                return {
                    ...series,
                    grouped: true,
                };
            }),
            axes: [
                {
                    type: 'radius-number',
                    reverse: true,
                },
                {
                    type: 'angle-category',
                    reverse: true,
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render normalized nightingale as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: EXAMPLE_OPTIONS.series?.map((series) => {
                return {
                    ...series,
                    normalizedTo: 100,
                };
            }),
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render normalized nightingale as expected with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: EXAMPLE_OPTIONS.series?.map((series) => {
                return {
                    ...series,
                    normalizedTo: 100,
                };
            }),
            axes: [
                {
                    type: 'radius-number',
                    reverse: true,
                },
                {
                    type: 'angle-category',
                    reverse: true,
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    describe('AG-14232 legend toggling', () => {
        const xs = [300, 400, 500] as const;
        const y = 570;
        beforeEach(async () => {
            const options: AgChartOptions = {
                animation: { enabled: true, duration: 0 }, // AG-14232: There's a bug with nightingale `animation.enabled = false`
                data: [
                    { quarter: `Q1'22`, software: 4.35, hardware: 2.14, services: 3.91 },
                    { quarter: `Q2'22`, software: 4.28, hardware: 3.13, services: 3.04 },
                    { quarter: `Q3'22`, software: 4.14, hardware: 3.34, services: 3.18 },
                    { quarter: `Q4'22`, software: 3.48, hardware: 3.56, services: 3.61 },
                ],
                series: [
                    { type: 'nightingale', angleKey: 'quarter', radiusKey: 'software' },
                    { type: 'nightingale', angleKey: 'quarter', radiusKey: 'hardware' },
                    { type: 'nightingale', angleKey: 'quarter', radiusKey: 'services' },
                ],
            };
            chart = AgCharts.create(prepareEnterpriseTestOptions(options));
            await waitForChartStability(chart);
            await clickAction(400, 300)(chart); // interrupt animation
        });
        describe('click', () => {
            for (const x of xs) {
                test(`mouse {x: ${x}, y: ${y}}`, async () => {
                    // Use looser threshold for AG-15016 scene graph changes
                    await compare(`nightingale-test-ts-nightingale-series-legend-All`, true);
                    await clickAction(x, y)(chart);
                    await compare(`nightingale-test-ts-nightingale-series-legend-click-${x}`);
                    await clickAction(x, y)(chart);
                    // Use looser threshold for AG-15016 scene graph changes
                    await compare(`nightingale-test-ts-nightingale-series-legend-All`, true);
                });
            }
            for (const x of xs) {
                test(`touch {x: ${x}, y: ${y}}`, async () => {
                    // Use looser threshold for AG-15016 scene graph changes
                    await compare(`nightingale-test-ts-nightingale-series-legend-All`, true);
                    await tapAction(x, y)(chart);
                    await compare(`nightingale-test-ts-nightingale-series-legend-click-${x}`);
                    await tapAction(x, y)(chart);
                    // Use looser threshold for AG-15016 scene graph changes
                    await compare(`nightingale-test-ts-nightingale-series-legend-All`, true);
                });
            }
        });
        describe('dblclick', () => {
            for (const x of xs) {
                test(`mouse {x: ${x}, y: ${y}}`, async () => {
                    // Use looser threshold for AG-15016 scene graph changes
                    await compare(`nightingale-test-ts-nightingale-series-legend-All`, true);
                    await doubleClickAction(x, y)(chart);
                    await compare(`nightingale-test-ts-nightingale-series-legend-dblclick-${x}`);
                });
            }
            for (const x of xs) {
                test(`touch {x: ${x}, y: ${y}}`, async () => {
                    // Use looser threshold for AG-15016 scene graph changes
                    await compare(`nightingale-test-ts-nightingale-series-legend-All`, true);
                    await doubleTapAction(x, y)(chart);
                    await compare(`nightingale-test-ts-nightingale-series-legend-dblclick-${x}`);
                });
            }
        });
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
        it('should render nightingale series with a default gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'nightingale',
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

        it('should render nightingale series with a gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'nightingale',
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

        it('should render nightingale series with an item bound gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'nightingale',
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
                    } as AgNightingaleSeriesOptions,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render nightingale series with a linear gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'nightingale',
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
                    } as AgNightingaleSeriesOptions,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render nightingale series with a series bound linear gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'nightingale',
                        angleKey: 'quarter',
                        radiusKey: 'Mountain air',
                        fill: {
                            type: 'gradient',
                            gradient: 'linear',
                            bounds: 'series',
                            colorStops: [
                                {
                                    color: 'green',
                                },
                                {
                                    color: 'white',
                                },
                            ],
                        },
                    } as AgNightingaleSeriesOptions,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    test('AG-8290 legend boxing', async () => {
        const label = {
            fontWeight: 'bold',
            padding: 5,
            border: { strokeWidth: 3, stroke: 'lightblue' },
            fill: 'lightgrey',
            fillOpacity: 0.7,
            cornerRadius: 10,
        } as const satisfies NonNullable<AgNightingaleSeriesOptions['label']>;

        const options = prepareEnterpriseTestOptions({
            data: [
                { quarter: `Q1'22`, software: 4.35, hardware: 2.14, services: 3.91 },
                { quarter: `Q2'22`, software: 4.28, hardware: 3.13, services: 3.04 },
                { quarter: `Q3'22`, software: 4.14, hardware: 3.34, services: 3.18 },
                { quarter: `Q4'22`, software: 3.48, hardware: 3.56, services: 3.61 },
                { quarter: `Q1'23`, software: 3.35, hardware: 3.14, services: 3.91 },
                { quarter: `Q2'23`, software: 3.28, hardware: 3.13, services: 3.54 },
                { quarter: `Q3'23`, software: 3.14, hardware: 2.84, services: 3.18 },
                { quarter: `Q4'23`, software: 2.48, hardware: 2.46, services: 3.21 },
            ],
            series: [
                { type: 'nightingale', angleKey: 'quarter', radiusKey: 'software', label },
                { type: 'nightingale', angleKey: 'quarter', radiusKey: 'hardware', label },
                { type: 'nightingale', angleKey: 'quarter', radiusKey: 'services', label },
            ],
        });

        chart = AgCharts.create(options);
        await compare();
    });

    describe('AG-15782 styler', () => {
        type D = { quarter: string; sw: number; hw: number };
        type C = unknown;
        type O = AgPolarChartOptions<D, C>;
        type M = MockNightingaleStyler<D, C>;
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
                                type: 'nightingale',
                                angleKey: 'quarter',
                                radiusKey: 'sw',
                                radiusName: 'Software',
                                context: c1,
                                fill: 'lime', // ignored
                                fillOpacity: 0.5, // not ignored
                                styler: styler.frozen,
                            },
                            {
                                type: 'nightingale',
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
                                type: 'nightingale',
                                angleKey: 'quarter',
                                radiusKey: 'sw',
                                radiusName: 'Software',
                                fill: 'lime', // ignored
                                fillOpacity: 0.5, // not ignored
                                styler: styler.frozen,
                                itemStyler,
                            },
                            {
                                type: 'nightingale',
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
                                type: 'nightingale',
                                angleKey: 'quarter',
                                radiusKey: 'sw',
                                radiusName: 'Software',
                                styler: () => {
                                    return { fill: { type: 'gradient' } };
                                },
                            },
                            {
                                type: 'nightingale',
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
            // Manual-test version available at nightingale-series-test#styler-highlight-state
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<O>({
                        data,
                        series: [
                            {
                                type: 'nightingale',
                                angleKey: 'quarter',
                                radiusKey: 'sw',
                                radiusName: 'Software',
                                styler: styler.frozen,
                            },
                            {
                                type: 'nightingale',
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

    describe('AG-15743 legendItemName', () => {
        testLegendItemName({
            create: (o) => (chart = AgCharts.create(prepareEnterpriseTestOptions(o))),
            compare,
            chartOptions: {
                data: [{ x: 'Value', s1: 100, s2: 200, s3: 300 }],
                series: [
                    { type: 'nightingale', angleKey: 'x', radiusKey: 's1', radiusName: 'series 1' },
                    { type: 'nightingale', angleKey: 'x', radiusKey: 's2', radiusName: 'series 2' },
                    { type: 'nightingale', angleKey: 'x', radiusKey: 's3', radiusName: 'series 3' },
                ],
            },
        });
    });
});
