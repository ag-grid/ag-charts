import { AgCartesianChartOptions, AgCharts, AgLineSeriesOptions } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: '2023 Average Temperatures',
    },
    subtitle: {
        text: 'Oxford, UK',
    },
    data: getData(),
    series: [
        {
            type: 'area',
            xKey: 'month',
            yKey: 'subscriptions',
            yName: 'Subscriptions',
            stacked: true,
            interpolation: { type: 'smooth' },
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'services',
            yName: 'Services',
            stacked: true,
            interpolation: { type: 'smooth' },
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'products',
            yName: 'Products',
            stacked: true,
            interpolation: { type: 'smooth' },
        },
    ],
};

const chart = AgCharts.create(options);

function lineStyleLinear() {
    options.series?.forEach((series) => {
        (series as AgLineSeriesOptions).interpolation = { type: 'linear' };
    });
    chart.update(options);
}

function lineStyleSmooth() {
    options.series?.forEach((series) => {
        (series as AgLineSeriesOptions).interpolation = { type: 'smooth' };
    });
    chart.update(options);
}

function lineStyleStepStart() {
    options.series?.forEach((series) => {
        (series as AgLineSeriesOptions).interpolation = { type: 'step', position: 'start' };
    });
    chart.update(options);
}

function lineStyleStepMiddle() {
    options.series?.forEach((series) => {
        (series as AgLineSeriesOptions).interpolation = { type: 'step', position: 'middle' };
    });
    chart.update(options);
}

function lineStyleStepEnd() {
    options.series?.forEach((series) => {
        (series as AgLineSeriesOptions).interpolation = { type: 'step', position: 'end' };
    });
    chart.update(options);
}
