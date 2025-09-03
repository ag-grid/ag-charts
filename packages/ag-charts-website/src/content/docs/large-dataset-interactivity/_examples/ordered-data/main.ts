import {
    AgCartesianAxisOptions,
    AgCartesianChartOptions,
    AgCartesianSeriesOptions,
    AgCharts,
} from 'ag-charts-enterprise';

import { getBubbleData, getData, getStackedData } from './data';

let dataLabel = '1K';
let seriesType = 'Line';
let datapoints = 1e3;

const timeAxes: AgCartesianAxisOptions[] = [
    { type: 'number', position: 'left' },
    { type: 'ordinal-time', position: 'bottom', parentLevel: { enabled: true } },
];

const numberAxes: AgCartesianAxisOptions[] = [
    { type: 'number', position: 'left' },
    { type: 'number', position: 'bottom' },
];

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(datapoints),
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
                    yKey: 'close',
                },
            ];
            options.data = getData(datapoints);
            break;
        case 'stacked-bar':
        case 'stacked-area':
            const stackedType = type === 'stacked-bar' ? 'bar' : 'area';
            options.series = [
                { type: stackedType, xKey: 'timestamp', yKey: 'series1', stacked: true },
                { type: stackedType, xKey: 'timestamp', yKey: 'series2', stacked: true },
            ];
            options.data = getStackedData(datapoints);
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
            options.data = getData(datapoints);

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
            options.data = getData(datapoints);
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
            options.data = getBubbleData(datapoints);
            break;
        case 'bubble':
            series = [
                {
                    type,
                    xKey: 'x',
                    yKey: 'y',
                    sizeKey: 'size',
                    fillOpacity: 0.2,
                    strokeOpacity: 0.2,
                },
            ];
            options.data = getBubbleData(datapoints);

            break;
        default:
            return;
    }

    if (type == 'bubble' || type == 'scatter') {
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
    switch (seriesType) {
        case 'Stacked Bar':
        case 'Stacked Area':
            options.data = getStackedData(points);
            break;
        case 'Scatter':
        case 'Bubble':
            options.data = getBubbleData(points);
        default:
            options.data = getData(points);
            break;
    }
    dataLabel = label;
    datapoints = points;
    options.title!.text = `${seriesType} with ${dataLabel} datapoints`;
    chart.update(options);
}
