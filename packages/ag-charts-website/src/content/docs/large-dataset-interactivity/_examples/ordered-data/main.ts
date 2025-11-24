import { LegendModule, LineSeriesModule, ModuleRegistry, NumberAxisModule, TimeAxisModule } from 'ag-charts-community';
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
    TimeAxisModule,
    ZoomModule,
]);

let dataLabel = '1K';
let seriesType = 'Line';
let datapoints = 1e3;

const timeAxes: Record<string, AgCartesianAxisOptions> = {
    y: { type: 'number', position: 'left' },
    x: { type: 'ordinal-time', position: 'bottom', parentLevel: { enabled: true } },
};

const numberAxes: Record<string, AgCartesianAxisOptions> = {
    y: { type: 'number', position: 'left' },
    x: { type: 'number', position: 'bottom' },
};

const baseData = getData(1e6);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: baseData.slice(-datapoints),
    title: { text: `${seriesType} with ${dataLabel} datapoints` },
    animation: { enabled: false },
    zoom: {
        enabled: true,
        axes: 'x',
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
    axes: timeAxes,
};

const chart = AgCharts.create(options);

function setSeries(type: string, label: string) {
    seriesType = label;
    let series: AgCartesianSeriesOptions[] = [];
    switch (type) {
        case 'bar':
        case 'area':
        case 'line':
            options.series = [
                {
                    type,
                    xKey: 'timestamp',
                    yKey: 'high',
                },
            ];
            break;
        case 'stacked-bar':
        case 'stacked-area':
            const stackedType = type === 'stacked-bar' ? 'bar' : 'area';
            options.series = [
                { type: stackedType, xKey: 'timestamp', yKey: 'open', stacked: true },
                { type: stackedType, xKey: 'timestamp', yKey: 'close', stacked: true },
            ];
            break;

        case 'range-area':
        case 'range-bar':
            options.series = [
                {
                    type,
                    xKey: 'timestamp',
                    yLowKey: 'low',
                    yHighKey: 'high',
                },
            ];
            break;
        case 'candlestick':
        case 'ohlc':
            options.series = [
                {
                    type,
                    xKey: 'timestamp',
                    lowKey: 'low',
                    highKey: 'high',
                    openKey: 'open',
                    closeKey: 'close',
                },
            ];
            break;
        case 'scatter':
            options.series = [
                {
                    type,
                    xKey: 'x',
                    yKey: 'y',
                    fillOpacity: 0.2,
                    strokeOpacity: 0.2,
                },
            ];
            break;
        case 'bubble':
            options.series = [
                {
                    type,
                    xKey: 'x',
                    yKey: 'y',
                    sizeKey: 'size',
                    fillOpacity: 0.2,
                    strokeOpacity: 0.2,
                },
            ];
            break;
        case 'histogram':
            options.series = [
                {
                    type,
                    xKey: 'close',
                },
            ];
            break;
        default:
            return;
    }

    const newDatapoints = (options.series?.[0] as any)?.stacked ? datapoints / 2 : datapoints;
    if (options.data?.length !== newDatapoints) {
        options.data = baseData.slice(-newDatapoints);
    }
    if (type == 'bubble' || type == 'scatter' || type == 'histogram') {
        options.zoom!.axes = 'xy';
        options.zoom!.autoScaling!.enabled = false;
        options.navigator!.enabled = false;
        options.axes = numberAxes;
    } else {
        options.zoom!.axes = 'xy';
        options.zoom!.autoScaling!.enabled = true;
        options.navigator!.enabled = true;
        options.axes = timeAxes;
    }

    options.title!.text = `${seriesType} with ${dataLabel} datapoints`;
    chart.update(options);
}

function setData(points: number, label: string) {
    const newDatapoints = (options.series?.[0] as any)?.stacked ? points / 2 : points;
    if (options.data?.length !== newDatapoints) {
        options.data = baseData.slice(-newDatapoints);
    }
    dataLabel = label;
    datapoints = points;
    options.title!.text = `${seriesType} with ${dataLabel} datapoints`;
    chart.update(options);
}
/* @ag-skip-clone */
