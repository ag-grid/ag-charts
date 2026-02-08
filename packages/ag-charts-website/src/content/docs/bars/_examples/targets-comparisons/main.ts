import {
    AgCartesianChartOptions,
    AgCharts,
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
    data: getData(),
    title: {
        text: 'Regional Sales vs Target',
    },
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'target',
            yName: 'Target',
            grouped: false,
            fillOpacity: 0.3,
            highlight: {
                enabled: false,
            },
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'europe',
            yName: 'Europe',
            widthRatio: 0.8,
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'asia',
            yName: 'Asia',
            widthRatio: 0.8,
        },
    ],
};

AgCharts.create(options);
