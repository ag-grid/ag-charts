import { AgChartOptions, AgChartTheme, AgCharts } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);
const myTheme: AgChartTheme = {
    palette: {
        fills: ['#006f9b', '#ff7faa', '#00994d', '#ff8833', '#00a0dd'],
        strokes: ['#003f58', '#934962', '#004a25', '#914d1d', '#006288'],
    },
    overrides: {
        common: {
            title: {
                fontSize: 24,
            },
        },
        bar: {
            series: {
                label: {
                    enabled: true,
                    color: 'black',
                },
                strokeWidth: 1,
            },
        },
    },
};

const options: AgChartOptions = {
    theme: myTheme,
    container: document.getElementById('myChart'),
    title: {
        text: 'Custom Chart Theme Example',
    },
    data: getData(),
    series: [
        { type: 'bar', xKey: 'label', yKey: 'v1', stacked: true, yName: 'Reliability' },
        { type: 'bar', xKey: 'label', yKey: 'v2', stacked: true, yName: 'Ease of use' },
        { type: 'bar', xKey: 'label', yKey: 'v3', stacked: true, yName: 'Performance' },
        { type: 'bar', xKey: 'label', yKey: 'v4', stacked: true, yName: 'Price' },
        { type: 'bar', xKey: 'label', yKey: 'v5', stacked: true, yName: 'Market share' },
    ],
};

const chart = AgCharts.create(options);
