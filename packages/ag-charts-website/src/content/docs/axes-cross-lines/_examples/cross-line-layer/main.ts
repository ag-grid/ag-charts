import {
    AgChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    CrossLinesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, CrossLinesModule, NumberAxisModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Monthly Sales',
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'sales',
            yName: 'Sales',
        },
    ],
    axes: {
        x: {
            type: 'category',
            crossLines: [
                {
                    type: 'range',
                    range: ['May', 'Aug'],
                    layer: 'front',
                    strokeWidth: 0,
                    fill: '#7290C4',
                    fillOpacity: 0.3,
                    label: {
                        text: 'Summer Promotion',
                        placement: 'inside-top',
                    },
                },
            ],
        },
        y: {
            type: 'number',
            crossLines: [
                {
                    type: 'line',
                    value: 60,
                    layer: 'back',
                    stroke: '#D21E75',
                    strokeWidth: 2,
                    lineDash: [6, 4],
                    label: {
                        text: 'Target',
                        placement: 'right',
                    },
                },
            ],
        },
    },
};

AgCharts.create(options);
