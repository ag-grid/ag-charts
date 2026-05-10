import { AgCharts, AgPolarChartOptions, LegendModule } from 'ag-charts-community';
import { ModuleRegistry, PieSeriesModule } from 'ag-charts-community';

import { getData } from './data';
import { random } from './seededRandom';

ModuleRegistry.registerModules([LegendModule, PieSeriesModule]);
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

function randomChannel() {
    return Math.floor(random() * 256);
}

function randomColor() {
    const color = `rgb(${randomChannel()}, ${randomChannel()}, ${randomChannel()})`;
    options.background = {
        fill: color,
    };
    chart.update(options);
}
