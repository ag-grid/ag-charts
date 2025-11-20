import {
    AgAreaSeriesOptions,
    AgCartesianChartOptions,
    AgChartOptions,
    AgCharts,
} from 'ag-charts-community';
import {
    AreaSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';

import { getData } from './data';


ModuleRegistry.registerModules([AreaSeriesModule, CategoryAxisModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
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
            connectMissingData: false,
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'services',
            yName: 'Services',
            connectMissingData: false,
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'products',
            yName: 'Products',
            connectMissingData: false,
        },
    ],
};

const chart = AgCharts.create(options);

function toggleConnectMissingData() {
    options.series = (options.series as Array<AgAreaSeriesOptions>).map((series) => ({
        ...series,
        connectMissingData: !series.connectMissingData,
    }));
    chart.update(options);
}
