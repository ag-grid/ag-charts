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
function start() {
    if (running) return;
    running = true;
    update();
}

function stop() {
    running = false;
}

async function update() {
    if (!running) return;

    options.data = [...options.data!, generateDatum()];
    await chart.update(options);
    requestAnimationFrame(update);
}
