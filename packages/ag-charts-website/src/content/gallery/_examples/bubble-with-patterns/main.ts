import { BubbleSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BubbleSeriesModule, NumberAxisModule]);
const data = getData();

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Revenue and Employee Distribution by Industry' },
    subtitle: {
        text: 'with Growth Indicators',
    },
    data,
    series: [
        {
            type: 'bubble',
            title: 'Tech',
            data: data.filter((d) => d.industry === 'Tech'),
            xKey: 'revenue',
            yKey: 'employees',
            sizeKey: 'growth',
            fill: {
                type: 'pattern',
            },
        },
        {
            type: 'bubble',
            title: 'Healthcare',
            data: data.filter((d) => d.industry === 'Healthcare'),
            xKey: 'revenue',
            yKey: 'employees',
            sizeKey: 'growth',
            fill: {
                type: 'pattern',
            },
        },
        {
            type: 'bubble',
            title: 'Finance',
            data: data.filter((d) => d.industry === 'Finance'),
            xKey: 'revenue',
            yKey: 'employees',
            sizeKey: 'growth',
            fill: {
                type: 'pattern',
            },
        },
        {
            type: 'bubble',
            title: 'Retail',
            data: data.filter((d) => d.industry === 'Retail'),
            xKey: 'revenue',
            yKey: 'employees',
            sizeKey: 'growth',
            fill: {
                type: 'pattern',
            },
        },
        {
            type: 'bubble',
            title: 'Energy',
            data: data.filter((d) => d.industry === 'Energy'),
            xKey: 'revenue',
            yKey: 'employees',
            sizeKey: 'growth',
            fill: {
                type: 'pattern',
            },
        },
    ],
    axes: {
        x: {
            type: 'number',
            position: 'bottom',
            title: { text: 'Revenue (millions)' },
        },
        y: {
            type: 'number',
            position: 'left',
            title: { text: 'Employees (hundreds)' },
        },
    },
};

AgCharts.create(options);
