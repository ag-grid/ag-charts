import { fail } from 'assert';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { classCast } from 'ag-charts-test';
import type { AgCartesianChartOptions, AgChartTheme, AgPolarChartOptions } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import { CartesianChart } from '../cartesianChart';
import { PolarChart } from '../polarChart';
import { AreaSeries } from '../series/cartesian/areaSeries';
import { BarSeries } from '../series/cartesian/barSeries';
import { LineSeries } from '../series/cartesian/lineSeries';
import { PieSeries } from '../series/polar/pieSeries';
import type { ChartOrProxy } from '../test/utils';
import { deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from '../test/utils';

const data = [
    { label: 'Android', v1: 5.67, v2: 8.63, v3: 8.14, v4: 6.45, v5: 1.37 },
    { label: 'iOS', v1: 7.01, v2: 8.04, v3: 1.338, v4: 6.78, v5: 5.45 },
    { label: 'BlackBerry', v1: 7.54, v2: 1.98, v3: 9.88, v4: 1.38, v5: 4.44 },
    { label: 'Symbian', v1: 9.27, v2: 4.21, v3: 2.53, v4: 6.31, v5: 4.44 },
    { label: 'Windows', v1: 2.8, v2: 1.908, v3: 7.48, v4: 5.29, v5: 8.8 },
];

describe('ChartTheme', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: ChartOrProxy;

    afterEach(async () => {
        if (chart) {
            await waitForChartStability(chart);
            chart.destroy();
            (chart as any) = null;
        }
    });

    describe('cartesian overrides', () => {
        const tooltipRenderer = () => 'testing';
        const markerFormatter = () => {
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
                            itemStyler: markerFormatter,
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
                fontWeight: 'normal' as const,
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
            chart = deproxy(AgCharts.create(cartesianChartOptions));
        });

        test('Options are not mutated after AgCharts.create', () => {
            expect(JSON.stringify(cartesianChartOptions)).toBe(serializedOptions);
        });

        test('Cartesian chart instance properties', () => {
            if (!(chart instanceof CartesianChart)) fail();

            expect(chart.title?.enabled).toBe(true);
            expect(chart.title?.opts.fontSize).toBe(24);
            expect(chart.title?.opts.fontWeight).toBe('normal');

            expect(chart.ctx.chartState.getValue('options', 'background').fill).toBe('red');

            const fills = ['red', 'green', 'blue', 'red', 'green'];
            const strokes = ['cyan', 'cyan', 'cyan', 'cyan', 'cyan'];
            for (let i = 0; i < 5; i++) {
                expect(chart.series[i].type).toBe('bar');
                const barSeries = classCast(chart.series[i], BarSeries);
                expect(barSeries.properties.fill).toEqual(fills[i]);
                expect(barSeries.properties.stroke).toEqual(strokes[i]);
                expect(barSeries.properties.label.enabled).toBe(true);
                expect(barSeries.properties.label.color).toBe('yellow');
                expect(barSeries.properties.label.fontSize).toBe(18);
                expect(barSeries.properties.tooltip.enabled).toBe(false);
                expect(barSeries.properties.tooltip.renderer).toBeDefined();
            }

            const areaFills = ['blue', 'red', 'green', 'blue', 'red'];
            const areaStrokes = ['cyan', 'cyan', 'cyan', 'cyan', 'cyan'];
            for (let i = 5; i < 10; i++) {
                expect(chart.series[i].type).toBe('area');
                expect((chart.series[i] as unknown as AreaSeries).properties.fill).toEqual(areaFills[i - 5]);
                expect((chart.series[i] as unknown as AreaSeries).properties.stroke).toEqual(areaStrokes[i - 5]);
                expect((chart.series[i] as unknown as AreaSeries).properties.marker.itemStyler).toBeDefined();
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
                fontWeight: 'normal' as const,
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
            chart = deproxy(AgCharts.create(polarChartOptions));
        });

        test('Options are not mutated after AgCharts.create', () => {
            expect(JSON.stringify(polarChartOptions)).toBe(serializedOptions);
        });

        test('Polar chart instance properties', () => {
            if (!(chart instanceof PolarChart)) fail();

            expect(chart.title?.enabled).toBe(true);
            expect(chart.title?.opts.fontSize).toBe(24);
            expect(chart.title?.opts.fontWeight).toBe('normal');

            expect(chart.ctx.chartState.getValue('options', 'background').fill).toBe('red');

            expect(chart.series[0].type).toBe('pie');
            const pieSeries = classCast(chart.series[0], PieSeries);
            expect(pieSeries.properties.fills).toEqual(['red', 'green', 'blue', 'red', 'green']);
            expect(pieSeries.properties.strokes).toEqual(['cyan', 'cyan', 'cyan', 'cyan', 'cyan']);
            expect(pieSeries.properties.calloutLabel.enabled).toBe(true);
            expect(pieSeries.properties.calloutLabel.color).toBe('yellow');
            expect(pieSeries.properties.calloutLabel.fontSize).toBe(18);
            expect(pieSeries.properties.tooltip.enabled).toBe(false);
            expect(pieSeries.properties.tooltip.renderer).toBeDefined();
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
                fontWeight: 'normal' as const,
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
                fontWeight: 'normal' as const,
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
            chart = deproxy(AgCharts.create(cartesianChartOptions));
            if (!(chart instanceof CartesianChart)) fail();

            await waitForChartStability(chart);

            expect(chart.title?.enabled).toBe(true);
            expect(chart.title?.opts.fontSize).toBe(24);
            expect(chart.title?.opts.fontWeight).toBe('normal');

            expect(chart.ctx.chartState.getValue('options', 'background').fill).toBe('red');

            const fills = ['red', 'green', 'blue', 'red', 'green'];
            const strokes = ['cyan', 'cyan', 'cyan', 'cyan', 'cyan'];
            for (let i = 0; i < 5; i++) {
                expect(chart.series[i].type).toBe('bar');
                const barSeries = classCast(chart.series[i], BarSeries);
                expect(barSeries.properties.fill).toEqual(fills[i]);
                expect(barSeries.properties.stroke).toEqual(strokes[i]);
                expect(barSeries.properties.label.enabled).toBe(true);
                expect(barSeries.properties.label.color).toBe('blue');
                expect(barSeries.properties.label.fontSize).toBe(18);
                expect(barSeries.properties.tooltip.enabled).toBe(false);
                expect(barSeries.properties.tooltip.renderer).toBeDefined();
            }
        });

        test('Polar chart instance properties', async () => {
            chart = deproxy(AgCharts.create(polarChartOptions));
            if (!(chart instanceof PolarChart)) fail();

            await waitForChartStability(chart);

            expect(chart.title?.enabled).toBe(true);
            expect(chart.title?.opts.fontSize).toBe(24);
            expect(chart.title?.opts.fontWeight).toBe('normal');

            expect(chart.ctx.chartState.getValue('options', 'background').fill).toBe('red');

            expect(chart.series[0].type).toBe('pie');
            const pieSeries = classCast(chart.series[0], PieSeries);
            expect(pieSeries.properties.fills).toEqual(['red', 'green', 'blue', 'red', 'green']);
            expect(pieSeries.properties.strokes).toEqual(['cyan', 'cyan', 'cyan', 'cyan', 'cyan']);
            expect(pieSeries.properties.calloutLabel.enabled).toBe(true);
            expect(pieSeries.properties.calloutLabel.color).toBe('yellow');
            expect(pieSeries.properties.calloutLabel.fontSize).toBe(18);
            expect(pieSeries.properties.tooltip.enabled).toBe(false);
            expect(pieSeries.properties.tooltip.renderer).toBeDefined();
        });
    });

    describe('legend padding overrides (CRT-1145, CRT-1146)', () => {
        const baseOptions = (legend: AgCartesianChartOptions['legend']): AgCartesianChartOptions => ({
            data,
            series: [
                { type: 'bar', xKey: 'label', yKey: 'v1' },
                { type: 'bar', xKey: 'label', yKey: 'v2' },
            ],
            legend,
        });

        const resolvedLegend = async (options: AgCartesianChartOptions) => {
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            return (chart as any).ctx.chartState.getValue('options', 'legend');
        };

        // Padding supplied via theme.overrides must resolve identically to the same padding supplied as direct chart
        // options — previously the $applyPadding operation ignored theme overrides, dropping default sides / failing to
        // expand a number, which broke legend layout.
        test('CRT-1145: legend.item.padding partial-side override matches direct options', async () => {
            const padding = { left: 15, right: 15 };

            const direct = await resolvedLegend(baseOptions({ item: { padding } }));
            chart.destroy();
            const override = await resolvedLegend({
                ...baseOptions({}),
                theme: { overrides: { common: { legend: { item: { padding } } } } },
            });

            expect(override.item.padding).toEqual(direct.item.padding);
            expect(override.item.padding).toEqual({ top: 4, right: 15, bottom: 4, left: 15 });
        });

        test('CRT-1146: legend.item.marker.padding number override matches direct options', async () => {
            const direct = await resolvedLegend(baseOptions({ position: 'top', item: { marker: { padding: 8 } } }));
            chart.destroy();
            const override = await resolvedLegend({
                ...baseOptions({}),
                theme: { overrides: { common: { legend: { position: 'top', item: { marker: { padding: 8 } } } } } },
            });

            expect(override.item.marker.padding).toEqual(direct.item.marker.padding);
            expect(override.item.marker.padding).toEqual({ top: 8, right: 8, bottom: 8, left: 8 });
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
                                stroke: 'red',
                            },
                            label: {
                                fontSize: 12,
                            },

                            top: {},
                            right: {
                                line: {
                                    stroke: 'green',
                                },
                                label: {
                                    fontSize: 14,
                                },
                            },
                            bottom: {
                                line: {
                                    stroke: 'blue',
                                },
                                label: {
                                    fontSize: 18,
                                },
                            },
                            left: {
                                line: {
                                    stroke: 'gold',
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
                                    stroke: 'blue',
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

        test('Themed bottom category, unthemed left number', async () => {
            chart = deproxy(
                AgCharts.create({
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

            const axisY = chart.axes.y as any;
            expect(axisY.type).toBe('number');
            expect(axisY.position).toBe('left');
            expect(axisY.options.line.stroke).toBe('#dcdddd');
            expect(axisY.options?.label?.fontSize).toBe(12);

            const axisX = chart.axes.x as any;
            expect(axisX.type).toBe('category');
            expect(axisX.position).toBe('bottom');
            expect(axisX.options.line.stroke).toBe('blue');
            expect(axisX.options?.label?.fontSize).toBe(18);
        });

        test('Specialized chart type themed bottom category, unthemed left number', async () => {
            chart = deproxy(
                AgCharts.create({
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

            const axisY = chart.axes.y as any;
            expect(axisY.type).toBe('number');
            expect(axisY.position).toBe('left');
            expect(axisY.options.line.stroke).toBe('#dcdddd');
            expect(axisY.options?.label?.fontSize).toBe(12);

            const axisX = chart.axes.x as any;
            expect(axisX.type).toBe('category');
            expect(axisX.position).toBe('bottom');
            expect(axisX.options.line.stroke).toBe('blue');
            expect(axisX.options?.label?.fontSize).toBe(18);
        });

        test('Themed right number, unthemed top category', async () => {
            chart = deproxy(
                AgCharts.create({
                    theme,
                    data,
                    axes: {
                        y: {
                            type: 'number',
                            position: 'right',
                        },
                        x: {
                            type: 'category',
                            position: 'top',
                        },
                    },
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

            const axisY = chart.axes.y as any;
            expect(axisY.type).toBe('number');
            expect(axisY.position).toBe('right');
            expect(axisY.options.line.stroke).toBe('blue');
            expect(axisY.options?.label?.fontSize).toBe(18);

            const axisX = chart.axes.x as any;
            expect(axisX.type).toBe('category');
            expect(axisX.position).toBe('top');
            expect(axisX.options.line.stroke).toBe('red');
            expect(axisX.options?.label?.fontSize).toBe(12);
        });

        test('Partially themed axes', async () => {
            chart = deproxy(
                AgCharts.create({
                    theme,
                    data,
                    axes: {
                        y: {
                            type: 'number',
                            position: 'right',
                            line: {
                                stroke: 'red',
                            },
                            label: {
                                fontStyle: 'italic',
                                fontFamily: 'Tahoma',
                            },
                        },
                        x: {
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
                    },
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

            const axisY = chart.axes.y as any;
            expect(axisY.type).toBe('number');
            expect(axisY.position).toBe('right');
            expect(axisY.options.line.stroke).toBe('red');
            expect(axisY.options?.label?.fontSize).toBe(18);
            expect(axisY.options?.label?.fontStyle).toBe('italic');
            expect(axisY.options?.label?.fontFamily).toBe('Tahoma');
            expect(axisY.options?.label?.fontWeight).toBe(400);
            expect(axisY.options?.label?.padding).toBe(5);
            expect(axisY.options?.label?.rotation).toBe(undefined);

            const axisX = chart.axes.x as any;
            expect(axisX.type).toBe('category');
            expect(axisX.position).toBe('bottom');
            expect(axisX.options.line.stroke).toBe('blue');
            expect(axisX.options.line.width).toBe(5);
            expect(axisX.options?.label?.fontSize).toBe(18);
            expect(axisX.options?.label?.fontStyle).toBe(undefined);
            expect(axisX.options?.label?.fontFamily).toBe(
                '"IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif'
            );

            expect(axisX.options?.label?.fontWeight).toBe('bold');
            expect(axisX.options?.label?.rotation).toBe(45);
            expect(axisX.options.title?.text).toBe('Test');
            // Since config is provided, the `enabled` should be auto-set to `true`,
            // even though theme's default is `false`.
            expect(axisX.options.title?.enabled).toBe(true);
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
            chart = deproxy(AgCharts.create(cartesianChartOptions));
            if (!(chart instanceof CartesianChart)) fail();
            await waitForChartStability(chart);
            const { series } = chart;

            expect(series[0].type).toEqual('bar');
            expect(series[1].type).toEqual('bar');
            expect(series[2].type).toEqual('line');
            expect(series[3].type).toEqual('area');
            expect(classCast(series[0], BarSeries).properties.strokeWidth).toEqual(16);
            expect(classCast(series[1], BarSeries).properties.strokeWidth).toEqual(16);
            expect(classCast(series[2], LineSeries).properties.strokeWidth).toEqual(17);
            expect(classCast(series[3], AreaSeries).properties.strokeWidth).toEqual(18);
        });
    });
});
