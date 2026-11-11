import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import {
    AreaSeriesModule,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([AreaSeriesModule, BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    theme: 'ag-accessible',
    title: {
        text: 'Revenue by Region',
    },
    subtitle: {
        text: 'Millions USD',
    },
    data: getData(),
    series: [
        {
            type: 'area',
            xKey: 'quarter',
            yKey: 'target',
            yName: 'Target',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'europe',
            yName: 'Europe',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'americas',
            yName: 'Americas',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'asia',
            yName: 'Asia',
            stacked: true,
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
