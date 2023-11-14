import { AgChart, AgChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Range Column Missing Data',
    },
    series: [
        {
            type: 'range-area',
            xKey: 'date',
            xName: 'Date',
            yLowKey: 'low',
            yHighKey: 'high',
            marker: {
                size: 20,
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
        },
        {
            type: 'time',
            position: 'bottom',
            nice: false,
            crosshair: {
                enabled: false,
            },
        },
    ],
};

let chart = AgChart.create(options);

function missingYValues() {
    const data = getData();
    data[2].high = undefined;
    data[5].low = undefined;
    options.data = data;

    AgChart.update(chart, options);
}

function missingXValue() {
    const data = getData();

    data[6].date = undefined;
    options.data = data;

    AgChart.update(chart, options);
}

function reset() {
    options.data = getData();
    AgChart.update(chart, options);
}
