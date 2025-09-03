import { AgAreaSeriesOptions, AgCartesianChartOptions, AgCharts, AgLineSeriesOptions } from 'ag-charts-community';

import { DataType, data } from './data';

const AREA_SERIES: AgAreaSeriesOptions[] = [
    {
        type: 'area',
        yKey: 'variance',
        xKey: 'date',
        interpolation: {
            type: 'smooth',
        },
        strokeWidth: 2,
        fillOpacity: 0.3,
        fill: 'green',
        stroke: 'green',
        segmentation: {
            key: 'y',
            segments: [{ stop: 0, fill: 'red', stroke: 'red' }],
        },
    },
];

const LINE_SERIES: AgLineSeriesOptions[] = [
    {
        type: 'line',
        yKey: 'variance',
        xKey: 'date',
        marker: {
            enabled: false,
        },
        interpolation: {
            type: 'smooth',
        },
        strokeWidth: 2,
        stroke: 'green',
        segmentation: {
            key: 'y',
            segments: [{ stop: 0, stroke: 'red' }],
        },
    },
];

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: { text: 'Performance Variance' },
    data,
    series: AREA_SERIES,
    axes: [
        {
            type: 'unit-time',
            position: 'bottom',
            paddingOuter: 0,
        },
        {
            type: 'number',
            position: 'left',
            title: { text: 'Variance ($)' },
        },
    ],
};

const chart = AgCharts.create(options);

function line() {
    options.series = LINE_SERIES;

    chart.update(options);
}

function area() {
    options.series = AREA_SERIES;

    chart.update(options);
}
