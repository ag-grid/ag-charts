import { AgBubbleSeriesOptions, AgCartesianChartOptions, AgCharts, AgLineSeriesOptions } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'animal',
            xName: 'Animal',
            yKey: 'lifespan',
            yName: 'Lifespan',
            fill: {
                type: 'gradient',
            },
        },
    ],
};

const chart = AgCharts.create(options);

function defaultGradient() {
    (options.series![0] as AgBubbleSeriesOptions).fill = {
        type: 'gradient',
    };
    chart.update(options);
}

function gradientColorStops() {
    (options.series![0] as AgBubbleSeriesOptions).fill = {
        type: 'gradient',
        colorStops: [{ color: '#A9D4E6', stop: 0 }, { color: '#5D7FAF', stop: 0.5 }, { color: '#6A8FD8' }],
    };
    chart.update(options);
}
