import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import {
    BarSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';

import { getData } from './data';


ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Internet Users by Geographical Location',
    },
    footnote: {
        text: 'Source: Office for National Statistics',
    },
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'area',
            yKey: 'usedInLast3Months',
            yName: 'Used in last 3 months',
            normalizedTo: 1,
            stacked: true,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'area',
            yKey: 'usedOver3MonthsAgo',
            yName: 'Used over 3 months ago',
            normalizedTo: 1,
            stacked: true,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'area',
            yKey: 'neverUsed',
            yName: 'Never used',
            normalizedTo: 1,
            stacked: true,
        },
    ],
    axes: {
        y: {
            type: 'category',
            position: 'left',
        },
        x: {
            type: 'number',
            position: 'bottom',
            label: {
                format: '.0%',
            },
        },
    },
};

AgCharts.create(options);
