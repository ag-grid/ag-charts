import type { AgAxisDirection, AgAxisValue, AgCartesianChartOptions } from 'ag-charts-enterprise';
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

const profitColor = '#8B5CF6';
const ordersColor = '#F59E0B';
const salesColor = '#0EA5E9';

function formatValue(value: AgAxisValue) {
    if (value instanceof Date) {
        return value.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    }
    // Clicks on a continuous axis resolve to a fractional value, so round it for display.
    return typeof value === 'number' ? value.toFixed(2) : String(value);
}

function toString(ev: { axisId: string; direction: AgAxisDirection; value: AgAxisValue }) {
    return `axisId: ${ev.axisId}, direction: ${ev.direction}, value: ${formatValue(ev.value)}`;
}

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
                click: (ev) => console.log('[x axis click]', toString(ev)),
                doubleClick: (ev) => console.log('[x axis double click]', toString(ev)),
            },
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
            listeners: {
                click: (ev) => console.log('[profit axis click]', toString(ev)),
                doubleClick: (ev) => console.log('[profit axis double click]', toString(ev)),
            },
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
    listeners: {
        axisClick: (ev) => console.log('[chart axis click]', toString(ev)),
        axisDoubleClick: (ev) => console.log('[chart axis double click]', toString(ev)),
    },
};

AgCharts.create(options);
