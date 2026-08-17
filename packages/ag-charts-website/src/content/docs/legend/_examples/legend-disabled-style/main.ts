import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import {
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);

const disabledGrey = '#6b6b6b';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Sessions by Device' },
    series: [
        { type: 'line', xKey: 'month', yKey: 'mobile', yName: 'Mobile' },
        { type: 'line', xKey: 'month', yKey: 'desktop', yName: 'Desktop' },
        { type: 'line', xKey: 'month', yKey: 'tablet', yName: 'Tablet' },
    ],
    legend: {
        item: {
            showSeriesStroke: true,
            marker: {
                disabledStyle: { fill: disabledGrey, stroke: disabledGrey, opacity: 1 },
            },
            line: {
                disabledStyle: { stroke: disabledGrey, opacity: 1 },
            },
            label: {
                disabledStyle: { color: disabledGrey, opacity: 1 },
            },
        },
    },
};

const chart = AgCharts.create(options);
