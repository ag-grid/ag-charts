import {
    AgChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

// Modules every chart on the page needs are registered once, globally.
ModuleRegistry.registerModules([CategoryAxisModule, NumberAxisModule]);

const lineOptions: AgChartOptions = {
    container: document.getElementById('lineChart'),
    data: getData(),
    title: {
        text: 'Line Series Module',
    },
    series: [
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'revenue',
            yName: 'Revenue',
        },
    ],
    axes: {
        x: {
            type: 'category',
        },
        y: {
            type: 'number',
        },
    },
};

const barOptions: AgChartOptions = {
    container: document.getElementById('barChart'),
    data: getData(),
    title: {
        text: 'Bar Series Module',
    },
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'revenue',
            yName: 'Revenue',
        },
    ],
    axes: {
        x: {
            type: 'category',
        },
        y: {
            type: 'number',
        },
    },
};

// Each chart adds only the series module it uses.
AgCharts.create(lineOptions, { modules: [LineSeriesModule] });
AgCharts.create(barOptions, { modules: [BarSeriesModule] });
