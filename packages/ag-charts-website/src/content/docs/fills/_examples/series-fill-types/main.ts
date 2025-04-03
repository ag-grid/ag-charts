import { AgBarSeriesOptions, AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'early',
            yName: 'Early',
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
    options.series?.forEach((series) => {
        (series as AgBarSeriesOptions).fill = undefined;
    });

    chart.update(options);
}

function gradientFill() {
    options.series?.forEach((series) => {
        (series as AgBarSeriesOptions).fill = {
            type: 'gradient',
        };
    });

    chart.update(options);
}

function patternFill() {
    options.series?.forEach((series) => {
        (series as AgBarSeriesOptions).fill = {
            type: 'pattern',
        };
    });

    chart.update(options);
}
