import {
    AgCartesianAxisOptions,
    AgCartesianChartOptions,
    AgCartesianSeriesOptions,
    AgCharts,
} from 'ag-charts-enterprise';

import { getBubbleData, getData, getStackedData } from './data';

let dataLabel = '100K';
let seriesType = 'Line';
let datapoints = 1e6;

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
    title: { text: `Line series with 100K datapoints` },
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
            series = [
                {
                    type,
                    xKey: 'timestamp',
                    yKey: 'close',
                },
            ];
            options.data = getData(datapoints);
            options.axes = timeAxes;
            break;
        case 'stacked-bar':
        case 'stacked-area':
            const stackedType = type === 'stacked-bar' ? 'bar' : 'area';
            series = [
                { type: stackedType, xKey: 'timestamp', yKey: 'series1', stacked: true },
                { type: stackedType, xKey: 'timestamp', yKey: 'series2', stacked: true },
            ];
            options.data = getStackedData(datapoints);
            options.axes = timeAxes;
            break;

        case 'range-area':
        case 'range-bar':
            series = [
                {
                    type,
                    xKey: 'timestamp',
                    yLowKey: 'low',
                    yHighKey: 'high',
                },
            ];
            options.data = getData(datapoints);
            options.axes = timeAxes;

            break;
        case 'candlestick':
        case 'ohlc':
            series = [
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
            options.axes = timeAxes;
            break;
        case 'scatter':
            series = [
                {
                    type,
                    xKey: 'x',
                    yKey: 'y',
                    fillOpacity: 0.2,
                    strokeOpacity: 0.2,
                },
            ];
            options.data = getBubbleData(datapoints);
            options.axes = numberAxes;
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
            options.axes = numberAxes;

            break;
        default:
            return;
    }

    options.series = series;
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
        default:
            options.data = getBubbleData(points);
            break;
    }
    options.title!.text = `${seriesType} with ${label} datapoints`;
    dataLabel = label;
    datapoints = points;
    chart.update(options);
}
