import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Range Bar Missing Data',
    },
    series: [
        {
            type: 'range-bar',
            xKey: 'date',
            xName: 'Date',
            yLowKey: 'low',
            yHighKey: 'high',
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

const chart = AgCharts.create(options);

function missingYValues() {
    const data = getData();
    data[2].high = undefined;
    data[5].low = undefined;
    options.data = data;

    chart.update(options);
}

function missingXValue() {
    const data = getData();

    data[6].date = undefined;
    options.data = data;

    chart.update(options);
}

function reset() {
    options.data = getData();
    chart.update(options);
}
