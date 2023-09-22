import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import type {
    AgCartesianChartOptions,
    AgCartesianSeriesMarkerFormatter,
    AgChartInstance,
    AgChartTheme,
    AgPolarChartOptions,
} from '../../options/agChartOptions';
import type { AreaSeries } from '../series/cartesian/areaSeries';
import type { BarSeries } from '../series/cartesian/barSeries';
import type { PieSeries } from '../series/polar/pieSeries';
import { ChartTheme } from './chartTheme';
import { AgChart } from '../agChartV2';
import { CartesianChart } from '../cartesianChart';
import { PolarChart } from '../polarChart';
import type { LineSeries } from '../series/cartesian/lineSeries';
import { deproxy, waitForChartStability } from '../test/utils';
import { fail } from 'assert';

const data = [
    { label: 'Android', v1: 5.67, v2: 8.63, v3: 8.14, v4: 6.45, v5: 1.37 },
    { label: 'iOS', v1: 7.01, v2: 8.04, v3: 1.338, v4: 6.78, v5: 5.45 },
    { label: 'BlackBerry', v1: 7.54, v2: 1.98, v3: 9.88, v4: 1.38, v5: 4.44 },
    { label: 'Symbian', v1: 9.27, v2: 4.21, v3: 2.53, v4: 6.31, v5: 4.44 },
    { label: 'Windows', v1: 2.8, v2: 1.908, v3: 7.48, v4: 5.29, v5: 8.8 },
];

describe('ChartTheme', () => {
    let chart: AgChartInstance;

    beforeEach(() => {
        console.warn = jest.fn();
    });

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as any) = null;
        }
        expect(console.warn).not.toBeCalled();
    });

    describe('cartesian overrides', () => {
        const tooltipRenderer = () => 'testing';
        const markerFormatter: AgCartesianSeriesMarkerFormatter<any> = () => {
            return {};
        };

        const theme: AgChartTheme = {
            baseTheme: 'ag-default',
            palette: {
                fills: ['red', 'green', 'blue'],
                strokes: ['cyan'],
            },
            overrides: {
                common: {
                    title: {
                        fontSize: 24,
                        fontWeight: 'bold',
                    },
                    background: {
                        fill: 'red',
                        // image: {
                        //     url: 'https://example.com',
                        //     width: 10,
                        //     height: 20,
                        // },
                    },
                },
                bar: {
                    series: {
                        label: {
                            enabled: true,
                            color: 'yellow',
                            fontSize: 20,
                        },
                        tooltip: {
                            enabled: false,
                            renderer: tooltipRenderer,
                        },
                    },
                },
                area: {
                    series: {
                        marker: {
                            formatter: markerFormatter,
                        },
                    },
                },
            },
        };
        const cartesianChartOptions: AgCartesianChartOptions = {
            theme,
            title: {
                enabled: true,
                text: 'Test Chart',
                fontWeight: 'normal',
            },
            data,
            series: [
                {
                    type: 'bar',
                    xKey: 'label',
                    yKey: 'v1',
                    yName: 'Reliability',
                    label: {
                        fontSize: 18,
                    },
                },
                {
                    type: 'bar',
                    xKey: 'label',
                    yKey: 'v2',
                    yName: 'Ease of use',
                    label: {
                        fontSize: 18,
                    },
                },
                {
                    type: 'bar',
                    xKey: 'label',
                    yKey: 'v3',
                    yName: 'Performance',
                    label: {
                        fontSize: 18,
                    },
                },
                {
                    type: 'bar',
                    xKey: 'label',
                    yKey: 'v4',
                    yName: 'Price',
                    label: {
                        fontSize: 18,
                    },
                },
                {
                    type: 'bar',
                    xKey: 'label',
                    yKey: 'v5',
                    yName: 'Market share',
                    label: {
                        fontSize: 18,
                    },
                },
                {
                    type: 'area',
                    xKey: 'label',
                    yKey: 'v1',
                    stacked: true,
                },
                {
                    type: 'area',
                    xKey: 'label',
                    yKey: 'v2',
                    stacked: true,
                },
                {
                    type: 'area',
                    xKey: 'label',
                    yKey: 'v3',
                    stacked: true,
                },
                {
                    type: 'area',
                    xKey: 'label',
                    yKey: 'v4',
                    stacked: true,
                },
                {
                    type: 'area',
                    xKey: 'label',
                    yKey: 'v5',
                    stacked: true,
                },
            ],
        };

        const serializedOptions = JSON.stringify(cartesianChartOptions);
        beforeEach(() => {
            chart = deproxy(AgChart.create(cartesianChartOptions)) as CartesianChart;
        });

        test('Options are not mutated after AgChart.create', () => {
            expect(JSON.stringify(cartesianChartOptions)).toBe(serializedOptions);
        });

        test('Cartesian chart instance properties', () => {
            if (!(chart instanceof CartesianChart)) fail();

            expect(chart.title?.enabled).toBe(true);
            expect(chart.title?.fontSize).toBe(24);
            expect(chart.title?.fontWeight).toBe('normal');

            expect((chart as any).background.fill).toBe('red');

            const fills = ['red', 'green', 'blue', 'red', 'green'];
            const strokes = ['cyan', 'cyan', 'cyan', 'cyan', 'cyan'];
            for (let i = 0; i < 5; i++) {
                expect(chart.series[i].type).toBe('bar');
                expect((chart.series[i] as BarSeries).fill).toEqual(fills[i]);
                expect((chart.series[i] as BarSeries).stroke).toEqual(strokes[i]);
                expect((chart.series[i] as BarSeries).label.enabled).toBe(true);
                expect((chart.series[i] as BarSeries).label.color).toBe('yellow');
                expect((chart.series[i] as BarSeries).label.fontSize).toBe(18);
                expect((chart.series[i] as BarSeries).tooltip.enabled).toBe(false);
                expect((chart.series[i] as BarSeries).tooltip.renderer).toBe(tooltipRenderer);
            }

            const areaFills = ['blue', 'red', 'green', 'blue', 'red'];
            const areaStrokes = ['cyan', 'cyan', 'cyan', 'cyan', 'cyan'];
            for (let i = 5; i < 10; i++) {
                expect(chart.series[i].type).toBe('area');
                expect((chart.series[i] as unknown as AreaSeries).fill).toEqual(areaFills[i - 5]);
                expect((chart.series[i] as unknown as AreaSeries).stroke).toEqual(areaStrokes[i - 5]);
                expect((chart.series[i] as unknown as AreaSeries).marker.formatter).toBe(markerFormatter);
            }
        });
    });

    describe('polar overrides', () => {
        const tooltipRenderer = () => 'testing';
        const theme: AgChartTheme = {
            baseTheme: 'ag-default',
            palette: {
                fills: ['red', 'green', 'blue'],
                strokes: ['cyan'],
            },
            overrides: {
                common: {},
                pie: {
                    title: {
                        fontSize: 24,
                        fontWeight: 'bold',
                    },
                    background: {
                        fill: 'red',
                    },
                    series: {
                        calloutLabel: {
                            enabled: true,
                            color: 'yellow',
                            fontSize: 20,
                        },
                        tooltip: {
                            enabled: false,
                            renderer: tooltipRenderer,
                        },
                    },
                },
            },
        };
        const polarChartOptions: AgPolarChartOptions = {
            theme,
            title: {
                enabled: true,
                text: 'Test Chart',
                fontWeight: 'normal',
            },
            data,
            series: [
                {
                    type: 'pie',
                    angleKey: 'v1',
                    calloutLabelKey: 'label',
                    calloutLabel: {
                        fontSize: 18,
                    },
                },
            ],
        };

        const serializedOptions = JSON.stringify(polarChartOptions);

        beforeEach(() => {
            chart = deproxy(AgChart.create(polarChartOptions)) as PolarChart;
        });

        test('Options are not mutated after AgChart.create', () => {
            expect(JSON.stringify(polarChartOptions)).toBe(serializedOptions);
        });

        test('Polar chart instance properties', () => {
            if (!(chart instanceof PolarChart)) fail();

            expect(chart.title?.enabled).toBe(true);
            expect(chart.title?.fontSize).toBe(24);
            expect(chart.title?.fontWeight).toBe('normal');

            expect((chart as any).background.fill).toBe('red');

            expect(chart.series[0].type).toBe('pie');
            expect((chart.series[0] as PieSeries).fills).toEqual(['red', 'green', 'blue']);
            expect((chart.series[0] as PieSeries).strokes).toEqual(['cyan', 'cyan', 'cyan']);
            expect((chart.series[0] as PieSeries).calloutLabel.enabled).toBe(true);
            expect((chart.series[0] as PieSeries).calloutLabel.color).toBe('yellow');
            expect((chart.series[0] as PieSeries).calloutLabel.fontSize).toBe(18);
            expect((chart.series[0] as PieSeries).tooltip.enabled).toBe(false);
            expect((chart.series[0] as PieSeries).tooltip.renderer).toBe(tooltipRenderer);
        });
    });

    describe('common overrides', () => {
        const columnTooltipRenderer = () => 'testing';
        const pieTooltipRenderer = () => 'testing';

        const theme: AgChartTheme = {
            baseTheme: 'ag-default',
            palette: {
                fills: ['red', 'green', 'blue'],
                strokes: ['cyan'],
            },
            overrides: {
                common: {
                    title: {
                        fontSize: 24,
                        fontWeight: 'bold',
                    },
                    background: {
                        fill: 'red',
                    },
                },
                bar: {
                    series: {
                        label: {
                            enabled: true,
                            color: 'blue',
                            fontSize: 22,
                        },
                        tooltip: {
                            enabled: false,
                            renderer: columnTooltipRenderer,
                        },
                    },
                },
                pie: {
                    series: {
                        calloutLabel: {
                            enabled: true,
                            color: 'yellow',
                            fontSize: 20,
                        },
                        tooltip: {
                            enabled: false,
                            renderer: pieTooltipRenderer,
                        },
                    },
                },
            },
        };

        const cartesianChartOptions: AgCartesianChartOptions = {
            theme,
            title: {
                enabled: true,
                text: 'Test Chart',
                fontWeight: 'normal',
            },
            data,
            series: [
                {
                    type: 'bar',
                    xKey: 'label',
                    yKey: 'v1',
                    yName: 'Reliability',
                    label: {
                        fontSize: 18,
                    },
                },
                {
                    type: 'bar',
                    xKey: 'label',
                    yKey: 'v2',
                    yName: 'Ease of use',
                    label: {
                        fontSize: 18,
                    },
                },
                {
                    type: 'bar',
                    xKey: 'label',
                    yKey: 'v3',
                    yName: 'Performance',
                    label: {
                        fontSize: 18,
                    },
                },
                {
                    type: 'bar',
                    xKey: 'label',
                    yKey: 'v4',
                    yName: 'Price',
                    label: {
                        fontSize: 18,
                    },
                },
                {
                    type: 'bar',
                    xKey: 'label',
                    yKey: 'v5',
                    yName: 'Market share',
                    label: {
                        fontSize: 18,
                    },
                },
            ],
        };

        const polarChartOptions: AgPolarChartOptions = {
            theme,
            title: {
                enabled: true,
                text: 'Test Chart',
                fontWeight: 'normal',
            },
            data,
            series: [
                {
                    type: 'pie',
                    angleKey: 'v1',
                    calloutLabelKey: 'label',
                    calloutLabel: {
                        fontSize: 18,
                    },
                },
            ],
        };

        test('Cartesian chart instance properties', async () => {
            chart = deproxy(AgChart.create(cartesianChartOptions));
            if (!(chart instanceof CartesianChart)) fail();

            await waitForChartStability(chart);

            expect(chart.title?.enabled).toBe(true);
            expect(chart.title?.fontSize).toBe(24);
            expect(chart.title?.fontWeight).toBe('normal');

            expect((chart as any).background.fill).toBe('red');

            const fills = ['red', 'green', 'blue', 'red', 'green'];
            const strokes = ['cyan', 'cyan', 'cyan', 'cyan', 'cyan'];
            for (let i = 0; i < 5; i++) {
                expect(chart.series[i].type).toBe('bar');
                expect((chart.series[i] as BarSeries).fill).toEqual(fills[i]);
                expect((chart.series[i] as BarSeries).stroke).toEqual(strokes[i]);
                expect((chart.series[i] as BarSeries).label.enabled).toBe(true);
                expect((chart.series[i] as BarSeries).label.color).toBe('blue');
                expect((chart.series[i] as BarSeries).label.fontSize).toBe(18);
                expect((chart.series[i] as BarSeries).tooltip.enabled).toBe(false);
                expect((chart.series[i] as BarSeries).tooltip.renderer).toBe(columnTooltipRenderer);
            }
        });

        test('Polar chart intstance properties', async () => {
            chart = deproxy(AgChart.create(polarChartOptions));
            if (!(chart instanceof PolarChart)) fail();

            await waitForChartStability(chart);

            expect(chart.title?.enabled).toBe(true);
            expect(chart.title?.fontSize).toBe(24);
            expect(chart.title?.fontWeight).toBe('normal');

            expect((chart as any).background.fill).toBe('red');

            expect(chart.series[0].type).toBe('pie');
            expect((chart.series[0] as PieSeries).fills).toEqual(['red', 'green', 'blue']);
            expect((chart.series[0] as PieSeries).strokes).toEqual(['cyan', 'cyan', 'cyan']);
            expect((chart.series[0] as PieSeries).calloutLabel.enabled).toBe(true);
            expect((chart.series[0] as PieSeries).calloutLabel.color).toBe('yellow');
            expect((chart.series[0] as PieSeries).calloutLabel.fontSize).toBe(18);
            expect((chart.series[0] as PieSeries).tooltip.enabled).toBe(false);
            expect((chart.series[0] as PieSeries).tooltip.renderer).toBe(pieTooltipRenderer);
        });
    });

    describe('Position specific axis styling', () => {
        const theme: AgChartTheme = {
            baseTheme: 'ag-default',
            overrides: {
                area: {
                    axes: {
                        category: {
                            line: {
                                color: 'red',
                            },
                            label: {
                                fontSize: 12,
                            },

                            top: {},
                            right: {
                                line: {
                                    color: 'green',
                                },
                                label: {
                                    fontSize: 14,
                                },
                            },
                            bottom: {
                                line: {
                                    color: 'blue',
                                },
                                label: {
                                    fontSize: 18,
                                },
                            },
                            left: {
                                line: {
                                    color: 'gold',
                                },
                                label: {
                                    fontSize: 20,
                                },
                            },
                        },
                        number: {
                            top: {},
                            right: {
                                line: {
                                    color: 'blue',
                                },
                                label: {
                                    fontSize: 18,
                                },
                            },
                            bottom: {},
                            left: {},
                        },
                    },
                },
            },
        };

        let defaultTheme: ChartTheme;
        beforeEach(() => {
            defaultTheme = new ChartTheme();
        });
        afterEach(() => {
            (defaultTheme as any) = null;
        });

        test('Themed bottom category, unthemed left number', async () => {
            chart = deproxy(
                AgChart.create({
                    theme,
                    data,
                    series: [
                        {
                            type: 'area',
                            xKey: 'label',
                            yKey: 'v1',
                        },
                        {
                            type: 'area',
                            xKey: 'label',
                            yKey: 'v2',
                        },
                        {
                            type: 'area',
                            xKey: 'label',
                            yKey: 'v3',
                        },
                        {
                            type: 'area',
                            xKey: 'label',
                            yKey: 'v4',
                        },
                        {
                            type: 'area',
                            xKey: 'label',
                            yKey: 'v5',
                        },
                    ],
                } as AgCartesianChartOptions)
            );
            if (!(chart instanceof CartesianChart)) fail();
            await waitForChartStability(chart);

            const axis0 = chart.axes[0] as any;
            expect(axis0.type).toBe('number');
            expect(axis0.position).toBe('left');
            expect(axis0.line.color).toBe(defaultTheme.config.area.axes.number.line.color);
            expect(axis0.label.fontSize).toBe(defaultTheme.config.area.axes.number.label.fontSize);

            const axis1 = chart.axes[1] as any;
            expect(axis1.type).toBe('category');
            expect(axis1.position).toBe('bottom');
            expect(axis1.line.color).toBe('blue');
            expect(axis1.label.fontSize).toBe(18);
        });

        test('Specialized chart type themed bottom category, unthemed left number', async () => {
            chart = deproxy(
                AgChart.create({
                    theme,
                    data,
                    series: [
                        {
                            type: 'area',
                            xKey: 'label',
                            yKey: 'v1',
                        },
                        {
                            type: 'area',
                            xKey: 'label',
                            yKey: 'v2',
                        },
                        {
                            type: 'area',
                            xKey: 'label',
                            yKey: 'v3',
                        },
                        {
                            type: 'area',
                            xKey: 'label',
                            yKey: 'v4',
                        },
                        {
                            type: 'area',
                            xKey: 'label',
                            yKey: 'v5',
                        },
                    ],
                } as AgCartesianChartOptions)
            );
            if (!(chart instanceof CartesianChart)) fail();
            await waitForChartStability(chart);

            const axis0 = chart.axes[0] as any;
            expect(axis0.type).toBe('number');
            expect(axis0.position).toBe('left');
            expect(axis0.line.color).toBe(defaultTheme.config.area.axes.number.line.color);
            expect(axis0.label.fontSize).toBe(defaultTheme.config.area.axes.number.label.fontSize);

            const axis1 = chart.axes[1] as any;
            expect(axis1.type).toBe('category');
            expect(axis1.position).toBe('bottom');
            expect(axis1.line.color).toBe('blue');
            expect(axis1.label.fontSize).toBe(18);
        });

        test('Themed right number, unthemed top category', async () => {
            chart = deproxy(
                AgChart.create({
                    theme,
                    data,
                    axes: [
                        {
                            type: 'number',
                            position: 'right',
                        },
                        {
                            type: 'category',
                            position: 'top',
                        },
                    ],
                    series: [
                        {
                            type: 'area',
                            xKey: 'label',
                            yKey: 'v1',
                        },
                        {
                            type: 'area',
                            xKey: 'label',
                            yKey: 'v2',
                        },
                        {
                            type: 'area',
                            xKey: 'label',
                            yKey: 'v3',
                        },
                        {
                            type: 'area',
                            xKey: 'label',
                            yKey: 'v4',
                        },
                        {
                            type: 'area',
                            xKey: 'label',
                            yKey: 'v5',
                        },
                    ],
                } as AgCartesianChartOptions)
            );
            if (!(chart instanceof CartesianChart)) fail();
            await waitForChartStability(chart);

            const axis0 = chart.axes[0] as any;
            expect(axis0.type).toBe('number');
            expect(axis0.position).toBe('right');
            expect(axis0.line.color).toBe('blue');
            expect(axis0.label.fontSize).toBe(18);

            const axis1 = chart.axes[1] as any;
            expect(axis1.type).toBe('category');
            expect(axis1.position).toBe('top');
            expect(axis1.line.color).toBe('red');
            expect(axis1.label.fontSize).toBe(12);
        });

        test('Partially themed axes', async () => {
            chart = deproxy(
                AgChart.create({
                    theme,
                    data,
                    axes: [
                        {
                            type: 'number',
                            position: 'right',
                            line: {
                                color: 'red',
                            },
                            label: {
                                fontStyle: 'italic',
                                fontFamily: 'Tahoma',
                            },
                        },
                        {
                            type: 'category',
                            position: 'bottom',
                            line: {
                                width: 5,
                            },
                            label: {
                                fontWeight: 'bold',
                                rotation: 45,
                            },
                            title: {
                                text: 'Test',
                            },
                        },
                    ],
                    series: [
                        {
                            type: 'area',
                            xKey: 'label',
                            yKey: 'v1',
                        },
                        {
                            type: 'area',
                            xKey: 'label',
                            yKey: 'v2',
                        },
                        {
                            type: 'area',
                            xKey: 'label',
                            yKey: 'v3',
                        },
                        {
                            type: 'area',
                            xKey: 'label',
                            yKey: 'v4',
                        },
                        {
                            type: 'area',
                            xKey: 'label',
                            yKey: 'v5',
                        },
                    ],
                } as AgCartesianChartOptions)
            );
            if (!(chart instanceof CartesianChart)) fail();
            await waitForChartStability(chart);

            const axis0 = chart.axes[0] as any;
            expect(axis0.type).toBe('number');
            expect(axis0.position).toBe('right');
            expect(axis0.line.color).toBe('red');
            expect(axis0.label.fontSize).toBe(18);
            expect(axis0.label.fontStyle).toBe('italic');
            expect(axis0.label.fontFamily).toBe('Tahoma');
            expect(axis0.label.fontWeight).toBe(defaultTheme.config.area.axes.number.label.fontWeight);
            expect(axis0.label.padding).toBe(defaultTheme.config.area.axes.number.label.padding);
            expect(axis0.label.rotation).toBe(defaultTheme.config.area.axes.number.label.rotation);

            const axis1 = chart.axes[1] as any;
            expect(axis1.type).toBe('category');
            expect(axis1.position).toBe('bottom');
            expect(axis1.line.color).toBe('blue');
            expect(axis1.line.width).toBe(5);
            expect(axis1.label.fontSize).toBe(18);
            expect(axis1.label.fontStyle).toBe(defaultTheme.config.area.axes.category.label.fontStyle);
            expect(axis1.label.fontFamily).toBe(defaultTheme.config.area.axes.category.label.fontFamily);
            expect(axis1.label.fontWeight).toBe('bold');
            expect(axis1.label.rotation).toBe(45);
            expect(axis1.title && axis1.title.text).toBe('Test');
            // Since config is provided, the `enabled` should be auto-set to `true`,
            // even though theme's default is `false`.
            expect(axis1.title && axis1.title.enabled).toBe(true);
        });
    });

    describe('series overrides', () => {
        const theme: AgChartTheme = {
            baseTheme: 'ag-default',
            palette: {
                fills: ['red', 'green', 'blue'],
                strokes: ['cyan'],
            },
            overrides: {
                bar: {
                    series: {
                        strokeWidth: 16,
                    },
                },
                line: {
                    series: {
                        strokeWidth: 17,
                    },
                },
                area: {
                    series: {
                        strokeWidth: 18,
                    },
                },
            },
        };

        const cartesianChartOptions: AgCartesianChartOptions = {
            theme,
            data,
            series: [
                {
                    type: 'bar',
                    xKey: 'label',
                    yKey: 'v1',
                    yName: 'Reliability',
                },
                {
                    type: 'bar',
                    xKey: 'label',
                    yKey: 'v2',
                    yName: 'Ease of use',
                },
                {
                    type: 'line',
                    xKey: 'label',
                    yKey: 'v3',
                    yName: 'Performance',
                },
                {
                    type: 'area',
                    xKey: 'label',
                    yKey: 'v4',
                    yName: 'Price',
                },
            ],
        };

        test('Cartesian chart instance properties', async () => {
            chart = deproxy(AgChart.create(cartesianChartOptions));
            if (!(chart instanceof CartesianChart)) fail();
            await waitForChartStability(chart);
            const { series } = chart;

            expect(series[0].type).toEqual('bar');
            expect(series[1].type).toEqual('bar');
            expect(series[2].type).toEqual('line');
            expect(series[3].type).toEqual('area');
            expect((series[0] as BarSeries).strokeWidth).toEqual(16);
            expect((series[1] as BarSeries).strokeWidth).toEqual(16);
            expect((series[2] as LineSeries).strokeWidth).toEqual(17);
            expect((series[3] as unknown as AreaSeries).strokeWidth).toEqual(18);
        });
    });
});
