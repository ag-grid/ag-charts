import { AgChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { AreaSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([AreaSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);

const itemStyler = (params) => {
    // if (params.last) return { fill: { type: 'gradient' } };
    // if (params.min) return { fill: { type: 'pattern' } };
    if (params.max) return { fill: { type: 'pattern', pattern: 'squares' } };
    if (params.last) {
        return {
            fill: { type: 'gradient', colorStops: [{ color: 'red' }, { color: 'blue' }] },
        };
    }
    return { fill: { type: 'pattern' } };
};

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
            marker: {
                size: 40,
                itemStyler: (params) => {
                    return { fill: { type: 'gradient' } };
                },
            },
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'services',
            yName: 'Services',
            marker: {
                size: 40,
                itemStyler: (params) => {
                    return { fill: { type: 'pattern', pattern: 'squares' } };
                },
            },
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'products',
            yName: 'Products',
            marker: {
                size: 40,
                itemStyler: (params) => {
                    return { fill: { type: 'gradient', colorStops: [{ color: 'red' }, { color: 'blue' }] } };
                },
            },
        },
    ],
};

AgCharts.create(options);
