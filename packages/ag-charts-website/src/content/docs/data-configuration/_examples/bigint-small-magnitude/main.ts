import {
    AgChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Rows Stored per Table' },
    subtitle: { text: 'Counts read from a database BIGINT column' },
    data: [
        { table: 'events', rows: 1_240_511n },
        { table: 'sessions', rows: 842_004n },
        { table: 'users', rows: 318_920n },
        { table: 'orders', rows: 96_551n },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'table',
            yKey: 'rows',
            yName: 'Rows',
        },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
};

AgCharts.create(options);
