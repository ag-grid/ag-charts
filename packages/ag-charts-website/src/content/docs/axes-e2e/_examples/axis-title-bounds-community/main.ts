import { AgCartesianChartOptions, AgCharts, AllCommunityModule, ModuleRegistry } from 'ag-charts-community';

ModuleRegistry.registerModules([AllCommunityModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { x: 'q1', y: 100, yy: 3 },
        { x: 'q2', y: 110, yy: 4 },
        { x: 'q3', y: 104, yy: 2 },
        { x: 'q4', y: 101, yy: 1 },
    ],
    series: [
        { type: 'bar', xKey: 'x', yKey: 'y' },
        { type: 'line', xKey: 'x', yKey: 'yy', yKeyAxis: 'yy' },
    ],
    axes: {
        x: {
            type: 'category',
            title: { text: 'The Axis On The Bottom' },
        },
        y: {
            type: 'number',
            title: { text: 'The Axis On The Left' },
        },
        yy: {
            type: 'number',
            title: { text: 'The Axis On The Right' },
        },
    },
};

const chart = AgCharts.create(options);
