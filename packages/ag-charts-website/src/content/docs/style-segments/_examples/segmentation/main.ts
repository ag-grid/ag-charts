import {
    AgAreaSeriesOptions,
    AgBarSeriesOptions,
    AgCartesianChartOptions,
    AgCharts,
    AgLineSeriesOptions,
} from 'ag-charts-community';

import { DataType, data } from './data';

const AREA_SERIES: AgAreaSeriesOptions[] = [
    {
        type: 'area',
        yKey: 'variance',
        xKey: 'dept',
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
        xKey: 'dept',
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

const BAR_SERIES: AgBarSeriesOptions[] = [
    {
        type: 'bar',
        yKey: 'variance',
        xKey: 'dept',
        fillOpacity: 0.5,
        fill: 'green',
        stroke: 'green',
        segmentation: {
            key: 'y',
            segments: [{ stop: 0, fill: 'red', stroke: 'red' }],
        },
    },
];

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: { text: 'Budget Variance by Department' },
    data,
    series: AREA_SERIES,
};

const chart = AgCharts.create(options);

function bar() {
    options.series = BAR_SERIES;

    chart.update(options);
}

function line() {
    options.series = LINE_SERIES;

    chart.update(options);
}

function area() {
    options.series = AREA_SERIES;

    chart.update(options);
}
