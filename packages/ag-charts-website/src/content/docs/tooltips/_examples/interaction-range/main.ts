import { AgCartesianChartOptions, AgChart } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    tooltip: {
        range: 'nearest',
    },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'value1',
            yName: 'Sweaters Made',
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'hats_made',
            yName: 'Hats Made',
        },
    ],
};

var chart = AgChart.create(options);

function nearest() {
    if (options.tooltip) options.tooltip.range = 'nearest';
    AgChart.update(chart, options);
}

function exact() {
    if (options.tooltip) options.tooltip.range = 'exact';
    AgChart.update(chart, options);
}

function distance() {
    if (options.tooltip) options.tooltip.range = 10;
    AgChart.update(chart, options);
}
