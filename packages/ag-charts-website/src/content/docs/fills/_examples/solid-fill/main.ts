import { AgCartesianChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { AreaSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([AreaSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Sales by Month',
    },
    data: getData(),
    theme: {
        palette: {
            fills: [
                { type: 'pattern', pattern: 'forward-slanted-lines', stroke: '#2b5c95' },
                { type: 'pattern', pattern: 'crosshatch', stroke: '#c84164' },
                { type: 'pattern', pattern: 'horizontal-lines', stroke: '#3d803d' },
            ],
        },
    },
    series: [
        {
            type: 'area',
            xKey: 'month',
            yKey: 'subscriptions',
            yName: 'Subscriptions',
            stacked: true,
            marker: {
                enabled: true,
                fill: { type: 'solid' },
            },
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'services',
            yName: 'Services',
            stacked: true,
            marker: {
                enabled: true,
                fill: { type: 'solid' },
            },
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'products',
            yName: 'Products',
            stacked: true,
            marker: {
                enabled: true,
                fill: { type: 'solid', fillOpacity: 0.5 },
            },
        },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
};

AgCharts.create(options);
