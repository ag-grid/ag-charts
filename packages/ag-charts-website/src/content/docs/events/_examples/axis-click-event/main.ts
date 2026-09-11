import type { AgCartesianChartOptions } from 'ag-charts-enterprise';
import {
    AgCharts,
    AxisInteractionModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([
    AxisInteractionModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    UnitTimeAxisModule,
]);

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Wedding Dress Orders, Sales and Profit',
    },
    subtitle: {
        text: 'Monthly performance of a wedding dress collection',
    },
    data: getData(),
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
            listeners: {
                click: (event) => console.log('[x axis click]', event),
                doubleClick: (event) => console.log('[x axis double click]', event),
            },
        },
        yProfit: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Profit',
            },
            listeners: {
                click: (event) => console.log('[profit axis click]', event),
                doubleClick: (event) => console.log('[profit axis double click]', event),
            },
        },
        ySales: {
            type: 'number',
            position: 'right',
            title: {
                text: 'Sales',
            },
        },
        yOrders: {
            type: 'number',
            position: 'right',
            title: {
                text: 'Orders',
            },
        },
    },

    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'profit',
            yName: 'Profit',
            yKeyAxis: 'yProfit',
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'orders',
            yName: 'Orders',
            yKeyAxis: 'yOrders',
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'sales',
            yName: 'Sales',
            yKeyAxis: 'ySales',
        },
    ],
    listeners: {
        axisClick: (event) => console.log('[chart axis click]', event),
        axisDoubleClick: (event) => console.log('[chart axis double click]', event),
    },
};

AgCharts.create(options);
