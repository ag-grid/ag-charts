import type { AgCartesianChartOptions } from 'ag-charts-community';
import {
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);

const profitColor = '#8B5CF6';
const ordersColor = '#F59E0B';
const salesColor = '#0EA5E9';

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
        },
        yProfit: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Profit',
                color: profitColor,
            },
            label: { color: profitColor },
            line: { stroke: profitColor },
            tick: { stroke: profitColor },
        },
        ySales: {
            type: 'number',
            position: 'right',
            title: {
                text: 'Sales',
                color: salesColor,
            },
            label: { color: salesColor },
            line: { stroke: salesColor },
            tick: { stroke: salesColor },
        },
        yOrders: {
            type: 'number',
            position: 'right',
            title: {
                text: 'Orders',
                color: ordersColor,
            },
            label: { color: ordersColor },
            line: { stroke: ordersColor },
            tick: { stroke: ordersColor },
        },
    },

    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'profit',
            yName: 'Profit',
            yKeyAxis: 'yProfit',
            stroke: profitColor,
            marker: { fill: profitColor },
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'orders',
            yName: 'Orders',
            yKeyAxis: 'yOrders',
            stroke: ordersColor,
            marker: { fill: ordersColor },
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'sales',
            yName: 'Sales',
            yKeyAxis: 'ySales',
            stroke: salesColor,
            marker: { fill: salesColor },
        },
    ],
};

AgCharts.create(options);
