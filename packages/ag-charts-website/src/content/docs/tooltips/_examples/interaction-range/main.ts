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
    options.tooltip = { range: 'nearest' };
    chart.update(options);
}

function exact() {
    options.tooltip = { range: 'exact' };
    chart.update(options);
}

function distance() {
    options.tooltip = { range: 10 };
    chart.update(options);
}
