import { LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';
import { ZoomModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([LineSeriesModule, NumberAxisModule, ZoomModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    zoom: {
        enabled: true,
        scrollingStep: 0.4,
    },
    tooltip: {
        enabled: false,
    },
    axes: {
        y: {
            type: 'number',
            position: 'left',
            interval: {
                minSpacing: 80,
                maxSpacing: 120,
            },
        },
        x: {
            type: 'number',
            position: 'bottom',
            nice: false,
            interval: {
                minSpacing: 80,
                maxSpacing: 120,
            },
            label: {
                autoRotate: false,
            },
        },
    },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'spending',
        },
    ],
};

AgCharts.create(options);
