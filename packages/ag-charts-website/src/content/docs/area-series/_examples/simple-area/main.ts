import { AgChartOptions, AgCharts } from 'ag-charts-community';
import {
    AreaSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';

import { getData } from './data';


ModuleRegistry.registerModules([AreaSeriesModule, CategoryAxisModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Sales by Month',
    },
    data: getData(),
    series: [
        {
            type: 'area',
            xKey: 'month',
            yKey: 'subscriptions',
            yName: 'Subscriptions',
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'services',
            yName: 'Services',
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'products',
            yName: 'Products',
        },
    ],
};

AgCharts.create(options);
