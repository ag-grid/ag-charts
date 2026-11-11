import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import {
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    theme: 'ag-accessible',
    title: {
        text: 'Ad Campaign Impact',
    },
    subtitle: {
        text: 'Yearly Percentage Change in Advertisement Engagement',
    },
    data: getData(),
    formatter: {
        y: ({ value }) => `${(Number(value) * 100).toFixed(0)}%`,
    },
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'desktop',
            yName: 'Desktop',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'phone',
            yName: 'Phone',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'tv',
            yName: 'TV',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'tablet',
            yName: 'Tablet',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'radio',
            yName: 'Radio',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'billboard',
            yName: 'Billboard',
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
