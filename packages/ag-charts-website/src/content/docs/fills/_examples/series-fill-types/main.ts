import { AgAreaSeriesOptions, AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'area',
            xKey: 'animal',
            xName: 'Animal',
            yKey: 'lifespan',
            yName: 'Lifespan',
            strokeWidth: 1,
            interpolation: {
                type: 'smooth',
            },
            marker: {
                size: 15,
                strokeWidth: 1,
            },
        },
    ],
};

const chart = AgCharts.create(options);

function defaultFill() {
    (options.series![0] as AgAreaSeriesOptions).fill = undefined;
    chart.update(options);
}

function gradientFill() {
    (options.series![0] as AgAreaSeriesOptions).fill = {
        type: 'gradient',
    };
    chart.update(options);
}

function patternFill() {
    (options.series![0] as AgAreaSeriesOptions).fill = {
        type: 'pattern',
    };
    chart.update(options);
}

function defaultMarkerFill() {
    (options.series![0] as AgAreaSeriesOptions).marker!.fill = undefined;
    chart.update(options);
}

function gradientMarkerFill() {
    (options.series![0] as AgAreaSeriesOptions).marker!.fill = {
        type: 'gradient',
    };
    chart.update(options);
}

function patternMarkerFill() {
    (options.series![0] as AgAreaSeriesOptions).marker!.fill = {
        type: 'pattern',
    };
    chart.update(options);
}
