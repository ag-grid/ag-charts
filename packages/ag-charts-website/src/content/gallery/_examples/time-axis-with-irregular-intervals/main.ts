import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import {
    LineSeriesModule,
    NumberAxisModule,
    TimeAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';

import { data } from './data';


ModuleRegistry.registerModules([LineSeriesModule, NumberAxisModule, TimeAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Earthquake Magnitudes by Source',
    },
    footnote: {
        text: 'Source: US Geological Survey',
    },
    series: [
        {
            data: data.ci,
            type: 'line',
            title: 'Southern California Seismic Network',
            xKey: 'time',
            yKey: 'magnitude',
        },
        {
            data: data.hv,
            type: 'line',
            title: 'Hawaiian Volcano Observatory Network',
            xKey: 'time',
            yKey: 'magnitude',
        },
        {
            data: data.nc,
            type: 'line',
            title: 'USGS Northern California Network',
            xKey: 'time',
            yKey: 'magnitude',
        },
        {
            data: data.ok,
            type: 'line',
            title: 'Oklahoma Seismic Network',
            xKey: 'time',
            yKey: 'magnitude',
        },
    ],
    axes: {
        x: {
            position: 'bottom',
            type: 'time',
            label: {
                format: '%d/%m',
            },
        },
        y: {
            position: 'left',
            type: 'number',
            title: {
                text: 'Magnitude',
            },
        },
    },
};

AgCharts.create(options);
