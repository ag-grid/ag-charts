import { AgChartOptions, AgCharts } from 'ag-charts-community';
import { CategoryAxisModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LineSeriesModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'temp',
        },
    ],
    axes: {
        x: {
            position: 'bottom',
            type: 'category',
            title: {
                text: 'Month',
            },
            crossLines: [
                {
                    type: 'range',
                    range: ['Jun', 'Sep'],
                },
            ],
        },
        y: {
            position: 'left',
            type: 'number',
            title: {
                text: 'Temperature (°C)',
            },
            crossLines: [
                {
                    type: 'line',
                    value: 11,
                },
            ],
        },
    },
};

const chart = AgCharts.create(options);
