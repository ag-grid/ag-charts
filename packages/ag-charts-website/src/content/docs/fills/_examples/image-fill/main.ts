import { AgBarSeriesOptions, AgCartesianChartOptions, AgCharts, AgImageFill } from 'ag-charts-community';

import { getData } from './data';

const data = getData();

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'bar',
            xKey: 'mode',
            yKey: 'timeToDestination',
            fill: {
                type: 'image',
                url: 'https://localhost:4600/charts/example-assets/docs-images/map.png',
            },
        },
    ],
};

const chart = AgCharts.create(options);

function contain() {
    const series = options.series![0] as AgBarSeriesOptions;
    series.fill = {
        ...(series.fill as AgImageFill),
        fit: 'contain',
    };
    chart.update(options);
}

function cover() {
    const series = options.series![0] as AgBarSeriesOptions;
    series.fill = {
        ...(series.fill as AgImageFill),
        fit: 'cover',
    };
    chart.update(options);
}

function stretch() {
    const series = options.series![0] as AgBarSeriesOptions;
    series.fill = {
        ...(series.fill as AgImageFill),
        fit: 'stretch',
    };
    chart.update(options);
}

function none() {
    const series = options.series![0] as AgBarSeriesOptions;
    series.fill = {
        ...(series.fill as AgImageFill),
        fit: 'none',
    };
    chart.update(options);
}
