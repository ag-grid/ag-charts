import {
    AgCartesianChartOptions,
    AgCharts,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    TimeAxisModule,
} from 'ag-charts-community';

ModuleRegistry.registerModules([LineSeriesModule, NumberAxisModule, TimeAxisModule]);

// The second and fourth rows carry non-ISO 8601 strings. They are rejected and
// a warning naming the value is logged to the console; the valid rows still render.
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Daily Totals' },
    subtitle: { text: 'Invalid date strings are skipped — see the browser console' },
    data: [
        { date: '2024-03-01', total: 42 },
        { date: '01/03/2024', total: 51 },
        { date: '2024-03-03', total: 47 },
        { date: 'March 4th', total: 60 },
        { date: '2024-03-05', total: 58 },
    ],
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'total',
            yName: 'Total',
        },
    ],
    axes: {
        x: { type: 'time' },
        y: { type: 'number' },
    },
};

AgCharts.create(options);
