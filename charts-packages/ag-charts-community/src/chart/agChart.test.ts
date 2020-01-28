import { AgChart } from "./agChart";
import 'jest-canvas-mock';
import { LegendPosition } from "./legend";
import { AreaSeries } from "./series/cartesian/areaSeries";
import { ColumnSeries } from "./series/cartesian/columnSeries";
import { LineSeries } from "./series/cartesian/lineSeries";
import { NumberAxis } from "./axis/numberAxis";
import { ChartAxis, ChartAxisPosition } from "./chartAxis";

const revenueProfitData = [{
    month: 'Jan',
    revenue: 155000,
    profit: 33000,
    foobar: 44700
}, {
    month: 'Feb',
    revenue: 123000,
    profit: 35500,
    foobar: 23400
}, {
    month: 'Mar',
    revenue: 172500,
    profit: 41000,
    foobar: 43400
}, {
    month: 'Apr',
    revenue: 185000,
    profit: 50000,
    foobar: 23500
}];

const data2 = [{
    month: 'Mar',
    apples: 2,
    oranges: 3
}, {
    month: 'May',
    apples: 4,
    oranges: 5
}, {
    month: 'Jun',
    apples: 6,
    oranges: 7
}, {
    month: 'Jul',
    apples: 8,
    oranges: 9
}];

describe('update', () => {
    test('cartesian chart top-level properties', () => {
        const chart = AgChart.create({
            // chart type is optional because it defaults to `cartesian`
            container: document.body,
            data: revenueProfitData,
            series: [{
                // series type if optional because `line` is default for `cartesian` charts
                xKey: 'month',
                yKey: 'revenue',
                marker: {
                    shape: 'plus',
                    size: 20
                }
            }, {
                type: 'column', // have to specify type explicitly here
                xKey: 'month',
                yKeys: ['profit'],
                fills: ['lime']
            }],
            legend: {
                layoutVerticalSpacing: 16
            }
        });
        AgChart.update(chart, {
            width: 500,
            height: 500,
            padding: {
                top: 30,
                right: 40,
                bottom: 50,
                left: 60
            },
            subtitle: {
                enabled: false,
                text: 'My Subtitle',
                fontSize: 20
            },
            background: {
                fill: 'red',
                visible: false
            },
            series: [{
                // series type if optional because `line` is default for `cartesian` charts
                xKey: 'month',
                yKey: 'revenue',
                marker: {
                    shape: 'plus',
                    size: 20
                }
            }, {
                type: 'column', // have to specify type explicitly here
                xKey: 'month',
                yKeys: ['profit'],
                fills: ['lime']
            }],
            legend: {
                spacing: 50,
                position: LegendPosition.Bottom
            }
        });

        expect(chart.container).toBe(undefined);
        expect(chart.width).toBe(500);
        expect(chart.height).toBe(500);
        expect(chart.data.length).toBe(0);
        expect(chart.padding.top).toBe(30);
        expect(chart.padding.right).toBe(40);
        expect(chart.padding.bottom).toBe(50);
        expect(chart.padding.left).toBe(60);
        expect(chart.title).toBe(undefined);
        expect(chart.subtitle.text).toBe('My Subtitle');
        expect(chart.subtitle.fontSize).toBe(20);
        expect(chart.subtitle.enabled).toBe(false);
        expect(chart.background.fill).toBe('red');
        expect(chart.background.visible).toBe(false);
        expect(chart.series[0].marker.shape).toBe('plus');

        AgChart.update(chart, {
            data: revenueProfitData,
            series: [{
                xKey: 'month',
                yKey: 'revenue',
                marker: {}
            }, {
                type: 'column',
                xKey: 'month',
                yKeys: ['profit'],
                fills: ['lime']
            }],
            legend: {
                layoutVerticalSpacing: 16
            }
        });

        expect(chart.title).not.toBeDefined();
        expect(chart.subtitle).not.toBeDefined();
    });

    test('series', () => {
        const chart = AgChart.create({
            data: revenueProfitData,
            series: [{
                // series type if optional because `line` is default for `cartesian` charts
                xKey: 'month',
                yKey: 'revenue',
                marker: {
                    shape: 'plus',
                    size: 20
                }
            }, {
                type: 'column', // have to specify type explicitly here
                xKey: 'month',
                yKeys: ['profit'],
                fills: ['lime']
            }]
        });

        const firstSeries = chart.series[0];
        const secondSeries = chart.series[1];

        AgChart.update(chart, {
            data: revenueProfitData,
            series: [{
                // series type if optional because `line` is default for `cartesian` charts
                xKey: 'month',
                yKey: 'revenue',
                marker: {
                    shape: 'square',
                    size: 10
                }
            }, {
                type: 'column', // have to specify type explicitly here
                xKey: 'month',
                yKeys: ['profit', 'foobar'],
                fills: ['lime', 'cyan']
            }, {
                type: 'area',
                xKey: 'month',
                yKeys: ['foobar']
            }]
        });

        expect(chart.series[0]).toBe(firstSeries);
        expect(chart.series[1]).toBe(secondSeries);
        expect(chart.series[0].marker.shape).toBe('square');
        expect(chart.series[0].marker.size).toBe(10);
        expect(chart.series[1].fills).toEqual(['lime', 'cyan']);
        expect(chart.series[1].yKeys).toEqual(['profit', 'foobar']);
        expect(chart.series[2] instanceof AreaSeries).toBe(true);
        expect(chart.series[2].xKey).toBe('month');
        expect(chart.series[2].yKeys).toEqual(['foobar']);

        AgChart.update(chart, {
            data: revenueProfitData,
            series: [{
                // series type if optional because `line` is default for `cartesian` charts
                xKey: 'month',
                yKey: 'revenue',
                marker: {
                    shape: 'square',
                    size: 10
                }
            }, {
                type: 'column', // have to specify type explicitly here
                xKey: 'month',
                yKeys: ['profit', 'foobar'],
                fills: ['lime', 'cyan']
            }]
        });

        expect(chart.series.length).toBe(2);
        expect(chart.series[0]).toBe(firstSeries);
        expect(chart.series[1]).toBe(secondSeries);

        AgChart.update(chart, {
            data: revenueProfitData,
            series: [{
                type: 'column', // have to specify type explicitly here
                xKey: 'month',
                yKeys: ['profit', 'foobar'],
                fills: ['lime', 'cyan']
            }, {
                // series type if optional because `line` is default for `cartesian` charts
                xKey: 'month',
                yKey: 'revenue',
                marker: {
                    shape: 'square',
                    size: 10
                }
            }]
        });

        expect(chart.series.length).toBe(2);
        expect(chart.series[0]).not.toBe(firstSeries);
        expect(chart.series[1]).not.toBe(secondSeries);
        expect(chart.series[0] instanceof ColumnSeries).toBe(true);
        expect(chart.series[1] instanceof LineSeries).toBe(true);
        expect(chart.series[0].yKeys).toEqual(['profit', 'foobar']);
        expect(chart.series[1].yKey).toBe('revenue');
        expect(chart.series[1].marker.size).toBe(10);

        const lineSeries = chart.series[1];

        AgChart.update(chart, {
            data: revenueProfitData,
            series: [{
                type: 'area', // have to specify type explicitly here
                xKey: 'month',
                yKeys: ['profit', 'foobar'],
                fills: ['lime', 'cyan']
            }, {
                // series type if optional because `line` is default for `cartesian` charts
                xKey: 'month',
                yKey: 'revenue',
                marker: {
                    shape: 'square',
                    size: 10
                }
            }]
        });

        expect(chart.series.length).toBe(2);
        expect(chart.series[0] instanceof AreaSeries).toBe(true);
        expect(chart.series[1] instanceof LineSeries).toBe(true);
        expect(chart.series[1]).toBe(lineSeries);
    });

    test('axes', () => {
        const chart = AgChart.create({
            data: revenueProfitData,
            series: [{
                xKey: 'month',
                yKey: 'revenue'
            }]
        });

        AgChart.update(chart, {
            data: revenueProfitData,
            series: [{
                xKey: 'blah',
                yKey: 'revenue'
            }],
            axes: [{
                type: 'number',
                position: 'left',
                title: {
                    text: 'Hello'
                }
            }, {
                type: 'number',
                position: 'bottom'
            }]
        });

        const axes = chart.axes as ChartAxis[];
        expect(axes.length).toBe(2);
        expect(axes[0] instanceof NumberAxis).toBe(true);
        expect(axes[1] instanceof NumberAxis).toBe(true);
        const leftAxis = axes.find(axis => axis.position === ChartAxisPosition.Left);
        expect(axes.find(axis => axis.position === ChartAxisPosition.Bottom)).toBeDefined();
        expect(leftAxis).toBeDefined();
        expect(leftAxis.title.text).toBe('Hello');

        expect(leftAxis.gridStyle).toEqual([{
            stroke: 'rgba(219, 219, 219, 1)',
            lineDash: [4, 2]
        }]);
        AgChart.update(chart, {
            data: revenueProfitData,
            series: [{
                xKey: 'blah',
                yKey: 'revenue'
            }],
            axes: [{
                type: 'number',
                position: 'left',
                title: {
                    text: 'Hello'
                },
                gridStyle: [{
                    stroke: 'red',
                    lineDash: [5, 5]
                }, {
                    stroke: 'blue',
                    lineDash: [2, 6, 2]
                }]
            }, {
                type: 'number',
                position: 'bottom'
            }]
        });
        expect(leftAxis.gridStyle).toEqual([{
            stroke: 'red',
            lineDash: [5, 5]
        }, {
            stroke: 'blue',
            lineDash: [2, 6, 2]
        }]);
    });
});
