import { AgChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { CategoryAxisModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    theme: 'ag-accessible',
    title: {
        text: 'Monthly Unit Sales by Product',
    },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'laptops',
            yName: 'Laptops',
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'phones',
            yName: 'Phones',
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'tablets',
            yName: 'Tablets',
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'monitors',
            yName: 'Monitors',
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'printers',
            yName: 'Printers',
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'cameras',
            yName: 'Cameras',
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'speakers',
            yName: 'Speakers',
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'headphones',
            yName: 'Headphones',
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'keyboards',
            yName: 'Keyboards',
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'routers',
            yName: 'Routers',
        },
    ],
};

AgCharts.create(options);
