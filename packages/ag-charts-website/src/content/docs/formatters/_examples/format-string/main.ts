import { AgChartOptions, AgCharts } from 'ag-charts-community';
import {
    LineSeriesModule,
    NumberAxisModule,
    UnitTimeAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';

import { getData } from './data';


ModuleRegistry.registerModules([LineSeriesModule, NumberAxisModule, UnitTimeAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'temp',
        },
    ],
    axes: {
        y: {
            type: 'number',
            position: 'left',
        },
        x: {
            type: 'unit-time',
            position: 'bottom',
            interval: { step: 'month' },
        },
    },
    formatter: {
        x: '%b %Y',
        y: '$#{0>6.2f}',
    },
};

AgCharts.create(options);
