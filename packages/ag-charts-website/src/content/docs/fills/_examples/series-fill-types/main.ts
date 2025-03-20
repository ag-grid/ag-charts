import { AgAreaSeriesOptions, AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'early',
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'morningPeak',
            yName: 'Morning peak',
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'interPeak',
            yName: 'Between peak',
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'afternoonPeak',
            yName: 'Afternoon peak',
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'evening',
            yName: 'Evening',
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
