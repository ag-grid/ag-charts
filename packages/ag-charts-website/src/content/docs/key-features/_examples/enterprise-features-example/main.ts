import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';
import { LineSeriesModule, NumberAxisModule, ModuleRegistry } from 'ag-charts-community';
import { NavigatorModule, ZoomModule } from 'ag-charts-enterprise';

import { getData } from './data';


ModuleRegistry.registerModules([LineSeriesModule, NavigatorModule, NumberAxisModule, ZoomModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    zoom: {
        enabled: true,
        autoScaling: { enabled: true },
    },
    tooltip: {
        enabled: false,
    },
    navigator: {
        miniChart: {
            enabled: true,
        },
    },
    axes: {
        y: {
            type: 'number',
            position: 'left',
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
    animation: {
        duration: 1500, // ms
    },
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'spending',
            marker: {
                enabled: false,
            },
        },
    ],
};

const chart = AgCharts.create(options);
