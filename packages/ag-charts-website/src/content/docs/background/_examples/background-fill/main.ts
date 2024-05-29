import { AgChartOptions, AgCharts, AgPolarChartOptions } from 'ag-charts-community';

import { getData } from './data';

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'pie',
            angleKey: 'value',
        },
    ],
    background: {
        fill: 'aliceblue',
    },
};

const chart = AgCharts.create(options);

function random(n: any) {
    return Math.floor(Math.random() * (n + 1));
}

function randomColor() {
    const color = `rgb(${random(255)}, ${random(255)}, ${random(255)})`;
    options.background = {
        fill: color,
    };
    chart.update(options);
}
