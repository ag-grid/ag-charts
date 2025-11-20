import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import {
    BarSeriesModule,
    CategoryAxisModule,
    LineSeriesModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';

import { getData } from './data';


ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LineSeriesModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'women',
            yName: 'Women',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'men',
            yName: 'Men',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'portions',
            yName: 'Portions',
            yKeyAxis: 'ySecondary',
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Adults Who Eat 5 A Day (%)',
            },
            label: {
                formatter: ({ value }) => value + '%',
            },
        },
        ySecondary: {
            type: 'number',
            position: 'right',
            title: {
                text: 'Portions Consumed (Per Day)',
            },
        },
    },
};

const chart = AgCharts.create(options);
