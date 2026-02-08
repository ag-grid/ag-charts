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
        text: 'Quarterly Sales vs Targets',
    },
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'quota',
            yName: 'Quota',
            stacked: true,
            fillOpacity: 0.3,
            grouped: false,
            highlight: {
                enabled: false,
            },
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'stretch',
            yName: 'Stretch Target',
            stacked: true,
            fillOpacity: 0.3,
            grouped: false,
            highlight: {
                enabled: false,
            },
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'actual',
            yName: 'Actual',
            grouped: false,
            widthRatio: 0.7,
        },
    ],
};

const chart = AgCharts.create(options);
