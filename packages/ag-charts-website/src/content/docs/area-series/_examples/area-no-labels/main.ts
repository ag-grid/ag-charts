import { AgChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { AreaSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([AreaSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'area',
            xKey: 'month',
            yKey: 'subscriptions',
            yName: 'Subscriptions',
            stroke: '#2c6ed5',
            fill: {
                type: 'gradient',
                colorStops: [
                    { color: '#ffffff00', stop: 0 },
                    { color: '#bcd3f6', stop: 0.6 },
                    { color: '#2c6ed5', stop: 1 },
                ],
            },
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'services',
            yName: 'Services',
            stroke: '#14b8a6',
            fill: {
                type: 'gradient',
                colorStops: [
                    { color: '#ffffff00', stop: 0 },
                    { color: '#b8efe6', stop: 0.6 },
                    { color: '#14b8a6', stop: 1 },
                ],
            },
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'products',
            yName: 'Products',
            stroke: '#7c3aed',
            fill: {
                type: 'gradient',
                colorStops: [
                    { color: '#ffffff00', stop: 0 },
                    { color: '#d8ccff', stop: 0.6 },
                    { color: '#7c3aed', stop: 1 },
                ],
            },
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            label: { enabled: false },
            gridLine: { enabled: false },
            line: { enabled: false },
        },
        y: {
            type: 'number',
            position: 'left',
            label: { enabled: false },
            gridLine: { enabled: false },
        },
    },
    legend: { enabled: false },
};

AgCharts.create(options);
