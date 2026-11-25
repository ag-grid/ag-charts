import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import {
    AreaSeriesModule,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([
    AreaSeriesModule,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    theme: 'ag-accessible',
    title: {
        text: 'Sales by Channel',
    },
    subtitle: {
        text: 'Thousands of Units',
    },
    data: getData(),
    series: [
        {
            type: 'area',
            xKey: 'month',
            yKey: 'marketAverage',
            yName: 'Market Average',
        },
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'online',
            yName: 'Online',
        },
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'inStore',
            yName: 'In Store',
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'target',
            yName: 'Target',
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

AgCharts.create(options);
