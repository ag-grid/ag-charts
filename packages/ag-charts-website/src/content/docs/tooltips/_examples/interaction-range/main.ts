import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

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

const chart = AgCharts.create(options);

function nearest() {
    if (options.tooltip) options.tooltip.range = 'nearest';
    AgCharts.update(chart, options);
}

function exact() {
    if (options.tooltip) options.tooltip.range = 'exact';
    AgCharts.update(chart, options);
}

function distance() {
    if (options.tooltip) options.tooltip.range = 10;
    AgCharts.update(chart, options);
}
