import {
    AgCartesianChartOptions,
    AgCharts,
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    StatusBarModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule, StatusBarModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Average Monthly Temperatures' },
    series: [
        { type: 'line', xKey: 'month', yKey: 'london', yName: 'London' },
        { type: 'line', xKey: 'month', yKey: 'paris', yName: 'Paris' },
        { type: 'line', xKey: 'month', yKey: 'rome', yName: 'Rome' },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number', title: { text: 'Average Temperature' } },
    },
    formatter: {
        y: ({ value }) => `${value}°C`,
    },
    statusBar: {
        enabled: true,
    },
};

AgCharts.create(options);
