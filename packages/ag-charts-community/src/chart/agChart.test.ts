import { afterEach, describe, expect, test } from '@jest/globals';

import { AgCharts } from '../api/agChart';
import type { AgChartInstance } from '../options/agChartOptions';
import { NumberAxis } from './axis/numberAxis';
import { AreaSeries } from './series/cartesian/areaSeries';
import { BarSeries } from './series/cartesian/barSeries';
import { LineSeries } from './series/cartesian/lineSeries';
import { deproxy, setupMockConsole, waitForChartStability } from './test/utils';
import { ChartTheme } from './themes/chartTheme';

const revenueProfitData = [
    {
        month: 'Jan',
        revenue: 155000,
        profit: 33000,
        foobar: 44700,
        bazqux: 1234,
    },
    {
        month: 'Feb',
        revenue: 123000,
        profit: 35500,
        foobar: 23400,
        bazqux: 1234,
    },
    {
        month: 'Mar',
        revenue: 172500,
        profit: 41000,
        foobar: 43400,
        bazqux: 1234,
    },
    {
        month: 'Apr',
        revenue: 185000,
        profit: 50000,
        foobar: 23500,
        bazqux: 1234,
    },
];

describe('AgChart', () => {
    setupMockConsole();

    let chartProxy: AgChartInstance;

    afterEach(() => {
        if (chartProxy) {
            chartProxy.destroy();
            chartProxy = undefined as any;
        }
    });

    test('cartesian chart top-level properties', async () => {
        chartProxy = AgCharts.create({
            // chart type is optional because it defaults to `cartesian`
            container: document.body,
            data: revenueProfitData,
            series: [
                {
                    // series type if optional because `line` is default for `cartesian` charts
                    xKey: 'month',
                    yKey: 'revenue',
                    marker: {
                        shape: 'plus',
                        size: 20,
                    },
                },
                {
                    type: 'bar', // have to specify type explicitly here
                    xKey: 'month',
                    yKey: 'profit',
                    fill: 'lime',
                },
            ],
            legend: {
                item: {
                    paddingY: 16,
                },
            },
        });
        await waitForChartStability(chartProxy);
        await chartProxy.update({
            // chart type is optional because it defaults to `cartesian`
            container: document.body,
            width: 500,
            height: 500,
            padding: {
                top: 30,
                right: 40,
                bottom: 50,
                left: 60,
            },
            subtitle: {
                enabled: false,
                text: 'My Subtitle',
                fontSize: 20,
            },
            background: {
                fill: 'red',
                visible: false,
            },
            series: [
                {
                    // series type if optional because `line` is default for `cartesian` charts
                    xKey: 'month',
                    yKey: 'revenue',
                    marker: {
                        shape: 'plus',
                        size: 20,
                    },
                },
                {
                    type: 'bar', // have to specify type explicitly here
                    xKey: 'month',
                    yKey: 'profit',
                    fill: 'lime',
                },
            ],
            legend: {
                spacing: 50,
                position: 'bottom',
            },
        });
        await waitForChartStability(chartProxy);

        const theme = new ChartTheme();

        const chart = deproxy(chartProxy);
        expect(chart.container).toBeInstanceOf(HTMLElement);
        expect(chart.width).toBe(500);
        expect(chart.height).toBe(500);
        expect(chart.data.length).toBe(4);
        expect(chart.padding.top).toBe(30);
        expect(chart.padding.right).toBe(40);
        expect(chart.padding.bottom).toBe(50);
        expect(chart.padding.left).toBe(60);
        expect(chart.title?.enabled).toBe(theme.config.line.title.enabled);
        expect(chart.title?.text).toBe(theme.config.line.title.text);
        expect(chart.title?.fontSize).toBe(theme.config.line.title.fontSize);
        expect(chart.title?.fontFamily).toBe(theme.config.line.title.fontFamily);
        expect(chart.title?.fontStyle).toBe(theme.config.line.title.fontStyle);
        expect(chart.title?.fontWeight).toBe(theme.config.line.title.fontWeight);
        expect(chart.subtitle?.text).toBe(theme.config.line.subtitle.text);
        expect(chart.subtitle?.fontSize).toBe(theme.config.line.subtitle.fontSize);
        expect(chart.subtitle?.enabled).toBe(false);
        expect((chart as any).background.fill).toBe('red');
        expect((chart as any).background.visible).toBe(false);
        expect((chart.series[0] as any).properties.marker.shape).toBe('plus');

        await chartProxy.updateDelta({
            data: revenueProfitData,
            series: [
                {
                    xKey: 'month',
                    yKey: 'revenue',
                    marker: {},
                },
                {
                    type: 'bar',
                    xKey: 'month',
                    yKey: 'profit',
                    fill: 'lime',
                },
            ],
            legend: {
                item: {
                    paddingY: 16,
                },
            },
        });
        await waitForChartStability(chartProxy);

        expect(chart.title?.enabled).toBe(theme.config.line.title.enabled);
        expect(chart.title?.text).toBe(theme.config.line.title.text);
        expect(chart.title?.fontSize).toBe(theme.config.line.title.fontSize);
        expect(chart.title?.fontFamily).toBe(theme.config.line.title.fontFamily);
        expect(chart.title?.fontStyle).toBe(theme.config.line.title.fontStyle);
        expect(chart.title?.fontWeight).toBe(theme.config.line.title.fontWeight);

        expect(chart.subtitle?.enabled).toBe(false);
        expect(chart.subtitle?.text).toBe(theme.config.line.subtitle.text);
        expect(chart.subtitle?.fontSize).toBe(theme.config.line.subtitle.fontSize);
    });

    test('series', async () => {
        chartProxy = AgCharts.create({
            data: revenueProfitData,
            series: [
                {
                    // series type is optional because `line` is default for `cartesian` charts
                    xKey: 'month',
                    yKey: 'revenue',
                    marker: {
                        shape: 'plus',
                        size: 20,
                    },
                },
                {
                    type: 'bar', // have to specify type explicitly here
                    xKey: 'month',
                    yKey: 'profit',
                    fill: 'lime',
                },
            ],
        });
        await waitForChartStability(chartProxy);

        const chart = deproxy(chartProxy);
        const createdSeries = chart.series;

        await chartProxy.update({
            data: revenueProfitData,
            series: [
                {
                    // series type if optional because `line` is default for `cartesian` charts
                    xKey: 'month',
                    yKey: 'revenue',
                    marker: {
                        shape: 'square',
                        size: 10,
                    },
                },
                {
                    type: 'bar', // have to specify type explicitly here
                    xKey: 'month',
                    yKey: 'profit',
                    fill: 'lime',
                    stacked: true,
                },
                {
                    type: 'bar', // have to specify type explicitly here
                    xKey: 'month',
                    yKey: 'foobar',
                    fill: 'cyan',
                    stacked: true,
                },
                {
                    type: 'area',
                    xKey: 'month',
                    yKey: 'bazqux',
                },
            ],
        });
        await waitForChartStability(chartProxy);
        const updatedSeries = chart.series;

        expect(updatedSeries.length).toEqual(4);
        expect(updatedSeries[0].id).toEqual(createdSeries[0].id);
        expect(updatedSeries[1].id).toEqual(createdSeries[1].id);
        expect((updatedSeries[0].properties as any).marker.shape).toEqual('square');
        expect((updatedSeries[0].properties as any).marker.size).toEqual(10);
        expect((updatedSeries[1].properties as any).fill).toEqual('lime');
        expect((updatedSeries[1].properties as any).yKey).toEqual('profit');
        expect((updatedSeries[2].properties as any).fill).toEqual('cyan');
        expect((updatedSeries[2].properties as any).yKey).toEqual('foobar');
        expect(updatedSeries[3]).toBeInstanceOf(AreaSeries);
        expect((updatedSeries[3].properties as any).xKey).toEqual('month');
        expect((updatedSeries[3].properties as any).yKey).toEqual('bazqux');

        await chartProxy.update({
            data: revenueProfitData,
            series: [
                {
                    // series type is optional because `line` is default for `cartesian` charts
                    xKey: 'month',
                    yKey: 'revenue',
                    marker: {
                        shape: 'square',
                        size: 10,
                    },
                },
                {
                    type: 'bar', // have to specify type explicitly here
                    xKey: 'month',
                    yKey: 'profit',
                    fill: 'lime',
                },
                {
                    type: 'bar', // have to specify type explicitly here
                    xKey: 'month',
                    yKey: 'foobar',
                    fill: 'cyan',
                },
            ],
        });
        await waitForChartStability(chartProxy);
        const updatedSeries2 = chart.series;

        expect(updatedSeries2.length).toEqual(3);
        expect(updatedSeries2[0].id).toEqual(updatedSeries[0].id);
        expect(updatedSeries2[1].id).toEqual(updatedSeries[1].id);
        expect(updatedSeries2[2].id).toEqual(updatedSeries[2].id);

        await chartProxy.update({
            data: revenueProfitData,
            series: [
                {
                    type: 'bar', // have to specify type explicitly here
                    xKey: 'month',
                    yKey: 'profit',
                    stacked: true,
                    fill: 'lime',
                },
                {
                    type: 'bar', // have to specify type explicitly here
                    xKey: 'month',
                    yKey: 'foobar',
                    stacked: true,
                    fill: 'cyan',
                },
                {
                    // series type is optional because `line` is default for `cartesian` charts
                    xKey: 'month',
                    yKey: 'revenue',
                    marker: {
                        shape: 'square',
                        size: 10,
                    },
                },
            ],
        });
        await waitForChartStability(chartProxy);
        const updatedSeries3 = chart.series;

        expect(updatedSeries3.length).toEqual(3);
        expect(updatedSeries3[0].id).toEqual(updatedSeries2[1].id);
        expect(updatedSeries3[1].id).toEqual(updatedSeries2[2].id);
        expect(updatedSeries3[2].id).toEqual(updatedSeries2[0].id);
        expect(updatedSeries3[0]).toBeInstanceOf(BarSeries);
        expect(updatedSeries3[1]).toBeInstanceOf(BarSeries);
        expect(updatedSeries3[2]).toBeInstanceOf(LineSeries);
        expect((updatedSeries3[0].properties as any).yKey).toEqual('profit');
        expect((updatedSeries3[1].properties as any).yKey).toEqual('foobar');
        expect((updatedSeries3[2].properties as any).yKey).toEqual('revenue');
        expect((updatedSeries3[2].properties as any).marker.size).toEqual(10);

        const lineSeries = updatedSeries3[1];

        await chartProxy.update({
            data: revenueProfitData,
            series: [
                {
                    type: 'area', // have to specify type explicitly here
                    xKey: 'month',
                    yKey: 'profit',
                    stacked: true,
                    fill: 'lime',
                },
                {
                    type: 'area', // have to specify type explicitly here
                    xKey: 'month',
                    yKey: 'foobar',
                    stacked: true,
                    fill: 'cyan',
                },
                {
                    // series type if optional because `line` is default for `cartesian` charts
                    xKey: 'month',
                    yKey: 'revenue',
                    marker: {
                        shape: 'square',
                        size: 10,
                    },
                },
            ],
        });
        await waitForChartStability(chartProxy);
        const updatedSeries4 = chart.series;

        expect(updatedSeries4.length).toEqual(3);
        expect(updatedSeries4[0]).toBeInstanceOf(AreaSeries);
        expect(updatedSeries4[1]).toBeInstanceOf(AreaSeries);
        expect(updatedSeries4[2]).toBeInstanceOf(LineSeries);
        expect(updatedSeries4[2].id).not.toEqual(lineSeries.id);
    });

    test('axes', async () => {
        chartProxy = AgCharts.create({
            data: revenueProfitData,
            series: [
                {
                    xKey: 'month',
                    yKey: 'revenue',
                },
            ],
        });
        await waitForChartStability(chartProxy);

        await chartProxy.update({
            data: revenueProfitData,
            series: [
                {
                    xKey: 'profit',
                    yKey: 'revenue',
                },
            ],
            axes: [
                {
                    type: 'number',
                    position: 'left',
                    title: {
                        text: 'Hello',
                    },
                },
                {
                    type: 'number',
                    position: 'bottom',
                },
            ],
        });
        await waitForChartStability(chartProxy);

        const chart = deproxy(chartProxy);
        const axes = chart.axes;
        expect(axes.length).toBe(2);
        expect(axes[0] instanceof NumberAxis).toBe(true);
        expect(axes[1] instanceof NumberAxis).toBe(true);
        let leftAxis = axes.find((axis) => axis.position === 'left') as any;
        expect(axes.find((axis) => axis.position === 'bottom')).toBeDefined();
        expect(leftAxis).toBeDefined();
        expect(leftAxis?.title?.text).toBe('Hello');

        expect(leftAxis?.gridLine.style).toEqual([
            {
                stroke: 'rgb(224,234,241)',
                lineDash: [],
            },
        ]);
        await chartProxy.update({
            data: revenueProfitData,
            series: [
                {
                    xKey: 'profit',
                    yKey: 'revenue',
                },
            ],
            axes: [
                {
                    type: 'number',
                    position: 'left',
                    title: {
                        text: 'Hello',
                    },
                    gridLine: {
                        style: [
                            {
                                stroke: 'red',
                                lineDash: [5, 5],
                            },
                            {
                                stroke: 'blue',
                                lineDash: [2, 6, 2],
                            },
                        ],
                    },
                },
                {
                    type: 'number',
                    position: 'bottom',
                },
            ],
        });
        await waitForChartStability(chartProxy);

        leftAxis = chart.axes.find((axis) => axis.position === 'left');
        expect(leftAxis?.gridLine?.style).toEqual([
            {
                stroke: 'red',
                lineDash: [5, 5],
            },
            {
                stroke: 'blue',
                lineDash: [2, 6, 2],
            },
        ]);
    });
});
