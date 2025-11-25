import { LegendModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import {
    AgCartesianAxisOptions,
    AgCartesianChartOptions,
    AgCartesianSeriesOptions,
    AgCharts,
    AnimationModule,
    CrosshairModule,
} from 'ag-charts-enterprise';
import { NavigatorModule, OrdinalTimeAxisModule, ZoomModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    NavigatorModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    ZoomModule,
]);
// @ts-expect-error Undocumented option
window.agChartsDebug = 'scene:stats';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(1e4),
    animation: { enabled: false },
    zoom: {
        enabled: true,
        anchorPointX: 'pointer',
        anchorPointY: 'pointer',
        autoScaling: {
            enabled: true,
        },
    },
    navigator: {
        enabled: true,
        miniChart: {
            enabled: true,
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'timestamp',
            yKey: 'close',
        },
    ],
    axes: {
        x: {
            type: 'ordinal-time',
            parentLevel: { enabled: true },
        },
    },
};

const chart = AgCharts.create(options);

function setSeries(type: string) {
    let series: AgCartesianSeriesOptions;
    switch (type) {
        case 'bar':
        case 'area':
        case 'line':
            series = {
                type,
                xKey: 'timestamp',
                yKey: 'close',
            };
            break;
        case 'range-area':
        case 'range-bar':
            series = {
                type,
                xKey: 'timestamp',
                yLowKey: 'low',
                yHighKey: 'high',
            };
            break;
        case 'candlestick':
        case 'ohlc':
            series = {
                type,
                xKey: 'timestamp',
                lowKey: 'low',
                highKey: 'high',
                openKey: 'open',
                closeKey: 'close',
            };
            break;
        default:
            return;
    }

    options.series = [series];
    chart.update(options);
}

function setAxes(type: string) {
    let axis: AgCartesianAxisOptions;
    switch (type) {
        case 'time':
            axis = {
                type,
                nice: false,
            };
            break;
        case 'ordinal-time':
        case 'unit-time':
            axis = {
                type,
            };
            break;
        case 'ordinal-time-parent':
            axis = {
                type: 'ordinal-time',
                parentLevel: { enabled: true },
            };
            break;
        default:
            return;
    }

    options.axes = { x: axis };
    chart.update(options);
}

function setData(points: number) {
    options.data = getData(points);
    chart.update(options);
}
