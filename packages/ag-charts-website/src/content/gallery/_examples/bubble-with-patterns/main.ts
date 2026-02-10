import {
    AgCartesianChartOptions,
    AgCharts,
    BubbleSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BubbleSeriesModule, NumberAxisModule]);
const data = getData();

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    // animation: { enabled: false },
    animation: { duration: 1000 },
    seriesArea: {
        padding: 200,
    },
    data,
    series: [
        {
            type: 'scatter',
            xKey: 'revenue',
            yKey: 'employees',
            // sizeKey: 'growth',
            size: 50,
            shape: 'square',
            highlight: { enabled: false },
            fill: {
                type: 'pattern',
                // pattern: 'circles',
                // width: 100,
                fill: 'blue',
                fillOpacity: 1,
                backgroundFill: 'red',
                backgroundFillOpacity: 1,
            },
        },
    ],
    axes: {
        x: { type: 'number', min: 100, max: 140 },
        y: { type: 'number', min: 60, max: 100 },
    },
};

AgCharts.create(options);
