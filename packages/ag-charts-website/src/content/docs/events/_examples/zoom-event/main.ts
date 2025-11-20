import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';
import {
    CategoryAxisModule,
    LineSeriesModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';
import { ZoomModule } from 'ag-charts-enterprise';

import { getData } from './data';


ModuleRegistry.registerModules([CategoryAxisModule, LineSeriesModule, NumberAxisModule, ZoomModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: '2023 Average Temperatures',
    },
    subtitle: {
        text: 'Oxford, UK',
    },
    zoom: {
        enabled: true,
        anchorPointX: 'pointer',
    },
    listeners: {
        zoom: (event) => {
            console.log(event);
        },
    },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'month',
            xName: 'Month',
            yKey: 'min',
            yName: 'Min Temperature',
            interpolation: { type: 'smooth' },
        },
        {
            type: 'line',
            xKey: 'month',
            xName: 'Month',
            yKey: 'max',
            yName: 'Max Temperature',
            interpolation: { type: 'smooth' },
        },
    ],
};

const chart = AgCharts.create(options);
