import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import {
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    theme: 'ag-accessible',
    title: {
        text: 'Electricity Generation by Source',
    },
    subtitle: {
        text: 'Percentage of Total Generation',
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'coal',
            yName: 'Coal',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'gas',
            yName: 'Gas',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'nuclear',
            yName: 'Nuclear',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'wind',
            yName: 'Wind',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'solar',
            yName: 'Solar',
            stacked: true,
        },
    ],
};

AgCharts.create(options);
