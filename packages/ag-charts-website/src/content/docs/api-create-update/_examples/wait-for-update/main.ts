// @ag-skip-fws
import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { generateDatum, getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Simple Promise-base example',
    },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'count',
            yKey: 'value',
        },
    ],
};

const chart = AgCharts.create(options as AgChartOptions);

let running = false;
async function start() {
    if (running) return;
    running = true;

    while (running) {
        options.data = [...options.data!, generateDatum()];
        await chart.update(options);
    }
}

function stop() {
    running = false;
}
