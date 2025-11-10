import { afterEach, describe, expect, it } from '@jest/globals';
import { MatchImageSnapshotOptions } from 'jest-image-snapshot';

import {
    type AgChartOptions,
    AgCharts,
    AgMarkerShapeFn,
    AgPolarChartOptions,
    AgRadarAreaSeriesOptions,
    AgRadarAreaSeriesStyle,
} from 'ag-charts-community';
import {
    MockRadarAreaStyler,
    extractImageData,
    hoverAction,
    newFreezableMock,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    testLegendItemName,
    waitForChartStability,
} from 'ag-charts-community-test';
import { NonNullablePath } from 'ag-charts-core';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('RadarAreaSeries', () => {
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
        data: [
            { subject: 'Maths', gradeA: 7, gradeB: 4.2 },
            { subject: 'Physics', gradeA: 4.3, gradeB: 8.5 },
            { subject: 'Biology', gradeA: 3, gradeB: 3 },
            { subject: 'History', gradeA: 6.5, gradeB: 4.3 },
            { subject: 'P.E.', gradeA: 9.8, gradeB: 6.4 },
        ],
        series: [
            {
                type: 'radar-area',
                angleKey: 'subject',
                radiusKey: 'gradeA',
            },
            {
                type: 'radar-area',
                angleKey: 'subject',
                radiusKey: 'gradeB',
            },
        ],
        legend: {
            enabled: true,
        },
    };

    const compare = async (options?: MatchImageSnapshotOptions) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(options);
    };

    it(`should render polar chart as expected`, async () => {
        const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render polar chart as expected with reversed circle axes`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            axes: {
                angle: {
                    type: 'angle-category',
                    shape: 'circle',
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

    it(`should render polar chart as expected with reversed polygon axes`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            axes: {
                angle: {
                    type: 'angle-category',
                    shape: 'polygon',
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

    it(`should render polar chart with circle axes as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            axes: { angle: { type: 'angle-category', shape: 'circle' }, radius: { type: 'radius-number' } },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should avoid polar chart label collisions`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            data: Array.from({ length: 95 }).map((_, i) => ({
                subject: `Subject ${i}`,
                gradeA: 2 * ((i % 5) + 1),
                gradeB: 2 * (((i + 3) % 5) + 1),
            })),
            axes: {
                angle: { type: 'angle-category', label: { avoidCollisions: true, minSpacing: 2 } },
                radius: { type: 'radius-number' },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render polar chart with invalid data disconnected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            data: [
                { subject: 'Maths', gradeA: 7, gradeB: 4.2 },
                { subject: 'Physics', gradeA: undefined, gradeB: 8.5 },
                { subject: 'Biology', gradeA: 3, gradeB: 3 },
                { subject: 'History', gradeA: 6.5, gradeB: 4.3 },
                { subject: 'P.E.', gradeA: 9.8, gradeB: 6.4 },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render polar chart with invalid data connected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            data: [
                { subject: 'Maths', gradeA: 7, gradeB: 4.2 },
                { subject: 'Physics', gradeA: undefined, gradeB: 8.5 },
                { subject: 'Biology', gradeA: 3, gradeB: 3 },
                { subject: 'History', gradeA: 6.5, gradeB: 4.3 },
                { subject: 'P.E.', gradeA: 9.8, gradeB: 6.4 },
            ],
            series: EXAMPLE_OPTIONS.series!.map((series) => ({
                ...series,
                connectMissingData: true,
            })),
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should support legend.item.showSeriesStroke`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            legend: { item: { showSeriesStroke: true } },
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

    describe('gradient fill', () => {
        it('should render radar area series with a default gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'radar-area',
                        angleKey: 'subject',
                        radiusKey: 'gradeA',
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

        it('should render radar area series with a gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'radar-area',
                        angleKey: 'subject',
                        radiusKey: 'gradeA',
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

        it('should render radar area series with a linear gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'radar-area',
                        angleKey: 'subject',
                        radiusKey: 'gradeA',
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
                    } as AgRadarAreaSeriesOptions,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render radar area series with a series bound linear gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'radar-area',
                        angleKey: 'subject',
                        radiusKey: 'gradeA',
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
                    } as AgRadarAreaSeriesOptions,
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
                    type: 'radar-area',
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
        type D = { tank: number; damage: number; healer: number; trait: string };
        type C = unknown;
        type O = AgPolarChartOptions<D, C>;
        type M = MockRadarAreaStyler<D, C>;
        let styler: ReturnType<typeof newFreezableMock<D, C, M>>;
        let data: D[];

        beforeEach(() => {
            const shieldPath: AgMarkerShapeFn = ({ path, x, y, size }) => {
                const s = size / 2;
                path.clear();
                path.moveTo(x + s * 0.7, y - s);
                path.lineTo(x + s * 0.7, y + s * 0.3);
                path.lineTo(x, y + s);
                path.lineTo(x - s * 0.7, y + s * 0.3);
                path.lineTo(x - s * 0.7, y - s);
                path.closePath();
            };
            data = [
                { tank: 90, damage: 70, healer: 40, trait: 'Strength' },
                { tank: 40, damage: 85, healer: 50, trait: 'Agility' },
                { tank: 35, damage: 60, healer: 95, trait: 'Intelligence' },
                { tank: 95, damage: 60, healer: 70, trait: 'Vitality' },
                { tank: 50, damage: 55, healer: 90, trait: 'Spirit' },
                { tank: 60, damage: 75, healer: 65, trait: 'Luck' },
            ];
            styler = newFreezableMock<D, C, M>((params): AgRadarAreaSeriesStyle | undefined => {
                switch (params.radiusKey) {
                    case 'tank':
                        return {
                            stroke: '#3b82f6',
                            strokeWidth: 3,
                            fill: '#93c5fd',
                            fillOpacity: 0.16,
                            marker: {
                                fill: '#3b82f6',
                                fillOpacity: 0.9,
                                shape: shieldPath,
                                size: 18,
                                stroke: '#1e3a8a',
                                strokeWidth: 1.5,
                            },
                        };
                    case 'damage':
                        return {
                            stroke: '#ef4444',
                            strokeWidth: 2.5,
                            strokeOpacity: 0.85,
                            lineDash: [6, 4],
                            fill: '#fca5a5',
                            fillOpacity: 0.13,
                            marker: {
                                fill: '#ef4444',
                                fillOpacity: 0.85,
                                size: 14,
                                stroke: '#7f1d1d',
                                strokeWidth: 1.2,
                            },
                        };
                    case 'healer':
                        return {
                            stroke: '#10b981',
                            strokeWidth: 3,
                            strokeOpacity: 0.9,
                            lineDash: [3, 3],
                            fill: '#6ee7b7',
                            fillOpacity: 0.15,
                            marker: {
                                fill: '#10b981',
                                fillOpacity: 0.9,
                                shape: 'plus',
                                size: 18,
                                stroke: '#065f46',
                                strokeWidth: 1.5,
                            },
                        };
                    default:
                        break;
                }
            });
        });
        describe('init', () => {
            let c1: C;
            let c2: C;
            beforeEach(async () => {
                c1 = { name: 'healer - magic powers' };
                c2 = { name: 'tank - heavy armor' };
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<O>({
                        data,
                        series: [
                            {
                                type: 'radar-area',
                                context: c1,
                                angleKey: 'trait',
                                radiusKey: 'healer',
                                stroke: 'limegreen', // ignored
                                strokeWidth: 30, // ignored
                                strokeOpacity: 0.3, // ignored
                                lineDash: [7, 7, 4, 4], // ignored
                                fill: 'lime', // ignored
                                fillOpacity: 1, // ignored
                                marker: {
                                    fill: 'mediumseagreen', // ignored
                                    fillOpacity: 0.2, // ignored
                                    shape: 'heart', // ignored
                                    size: 40, // ignored
                                    stroke: 'seagreen', // ignored
                                    strokeWidth: 5, // ignored
                                },
                                styler: styler.frozen,
                            },
                            {
                                type: 'radar-area',
                                context: c2,
                                angleKey: 'trait',
                                radiusKey: 'tank',
                                stroke: 'fuchsia', // ignored
                                strokeWidth: 3, // not ignored
                                strokeOpacity: 0.9, // not ignored
                                // marker should be enabled
                                styler: styler.frozen,
                            },
                            {
                                type: 'radar-area',
                                angleKey: 'trait',
                                radiusKey: 'damage',
                                // should use all style properties from the styler
                                marker: {}, // should be enabled, but with the styler's styling
                                styler: styler.frozen,
                            },
                        ],
                        legend: {
                            position: 'bottom',
                            item: { line: { length: 40 } },
                        },
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
                    styler.expect().nthCalledWithoutContext(2);
                    styler.expect().toHaveBeenCalledTimes(3);
                });
                test('params', () => {
                    expect(styler.mock.mock.calls).toMatchSnapshot();
                });
            });
        });
        describe('priorities', () => {
            beforeEach(async () => {
                const itemStyler: NonNullablePath<AgRadarAreaSeriesOptions, 'marker', 'itemStyler'> = (params) => {
                    if (params.radiusKey === 'healer' && params.datum['trait'] === 'Intelligence') {
                        return { fill: 'gold', size: 30, stroke: 'lime' };
                    }
                    if (params.radiusKey === 'tank' && params.datum['trait'] === 'Vitality') {
                        return { fill: 'gold', size: 36, stroke: 'mediumblue' };
                    }
                    if (params.radiusKey === 'damage' && params.datum['trait'] === 'Agility') {
                        return { fill: 'gold', size: 32, strokeWidth: 3, shape: 'star' };
                    }
                };

                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<O>({
                        data,
                        series: [
                            {
                                type: 'radar-area',
                                angleKey: 'trait',
                                radiusKey: 'healer',
                                stroke: 'limegreen', // ignored
                                strokeWidth: 30, // ignored
                                strokeOpacity: 0.3, // ignored
                                lineDash: [7, 7, 4, 4], // ignored
                                fill: 'lime', // ignored
                                fillOpacity: 1, // ignored
                                marker: {
                                    itemStyler,
                                    fill: 'mediumseagreen', // ignored
                                    fillOpacity: 0.2, // ignored
                                    shape: 'heart', // ignored
                                    size: 40, // ignored
                                    stroke: 'seagreen', // ignored
                                    strokeWidth: 5, // ignored
                                },
                                styler: styler.frozen,
                            },
                            {
                                type: 'radar-area',
                                angleKey: 'trait',
                                radiusKey: 'tank',
                                stroke: 'fuchsia', // ignored
                                strokeWidth: 3, // not ignored
                                strokeOpacity: 0.9, // not ignored
                                styler: styler.frozen,
                                marker: { itemStyler },
                            },
                            {
                                type: 'radar-area',
                                angleKey: 'trait',
                                radiusKey: 'damage',
                                // should use all style properties from the styler
                                styler: styler.frozen,
                                marker: { itemStyler },
                            },
                        ],
                        legend: {
                            position: 'bottom',
                            item: { line: { length: 40 } },
                        },
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
                                type: 'radar-area',
                                angleKey: 'trait',
                                radiusKey: 'healer',
                                marker: { size: 30 },
                                styler: (): AgRadarAreaSeriesStyle | undefined => {
                                    return {
                                        fill: { type: 'gradient' },
                                        marker: { fill: { type: 'pattern' } },
                                    };
                                },
                            },
                            {
                                type: 'radar-area',
                                angleKey: 'trait',
                                radiusKey: 'tank',
                                marker: { size: 30 },
                                styler: (): AgRadarAreaSeriesStyle | undefined => {
                                    return {
                                        fill: { type: 'pattern' },
                                        marker: { fill: { type: 'gradient' } },
                                    };
                                },
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                // The 'pattern' fill type is rendered slightly different on GitHub CI, but the difference isn't
                // noticeable without an image-diff aid. I've counted the exact number of pixels that differ.
                await compare({ failureThreshold: 358, failureThresholdType: 'pixel' });
            });
        });
        describe('highlights', () => {
            // Manual-test version available at radar-area-series-test#styler-highlight-state
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<O>({
                        data,
                        series: [
                            {
                                type: 'radar-area',
                                angleKey: 'trait',
                                radiusKey: 'healer',
                                styler: styler.frozen,
                            },
                            {
                                type: 'radar-area',
                                angleKey: 'trait',
                                radiusKey: 'tank',
                                strokeWidth: 3,
                                strokeOpacity: 0.9,
                                styler: styler.frozen,
                            },
                            {
                                type: 'radar-area',
                                angleKey: 'trait',
                                radiusKey: 'damage',
                                styler: styler.frozen,
                            },
                        ],
                        legend: {
                            position: 'bottom',
                            item: { line: { length: 40 } },
                        },
                    })
                );
                await waitForChartStability(chart);
            });

            const miss = { x: 10, y: 10 } as const;
            const series0datum0 = { x: 400, y: 186 } as const;
            const series0datum2 = { x: 587, y: 385 } as const;
            const series1datum0 = { x: 400, y: 70 } as const;
            const legendItem0 = { x: 300, y: 572 } as const;
            const legendItem1 = { x: 400, y: 572 } as const;

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
                    // Wait for delayed unhighlights to complete
                    await new Promise((resolve) => setTimeout(resolve, 150)); // Wait for 100ms delay + buffer
                    await waitForChartStability(chart);
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
                data: [
                    { x: 0, s1: 100, s2: 200, s3: 300 },
                    { x: 1, s1: 100, s2: 200, s3: 300 },
                    { x: 3, s1: 100, s2: 200, s3: 300 },
                ],
                series: [
                    { type: 'radar-area', angleKey: 'x', radiusKey: 's1', radiusName: 'series 1' },
                    { type: 'radar-area', angleKey: 'x', radiusKey: 's2', radiusName: 'series 2' },
                    { type: 'radar-area', angleKey: 'x', radiusKey: 's3', radiusName: 'series 3' },
                ],
            },
        });
    });
});
