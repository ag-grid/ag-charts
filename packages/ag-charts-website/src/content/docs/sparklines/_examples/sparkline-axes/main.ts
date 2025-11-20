import { AgCharts, AgSparklineOptions } from 'ag-charts-community';
import { LineSeriesModule, ModuleRegistry, NumberAxisModule, TimeAxisModule } from 'ag-charts-community';

ModuleRegistry.registerModules([LineSeriesModule, NumberAxisModule, TimeAxisModule]);

import { data } from './data';


const options: AgSparklineOptions = {
    container: document.getElementById('myChart'),
    width: 400,
    height: 50,
    data: data,
    type: 'line',
    xKey: 'date',
    yKey: 'change',
    axis: {
        type: 'time',
        visible: true,
        stroke: '#66A4',
        strokeWidth: 1,
    },
    min: -3,
    max: 3,
};

AgCharts.__createSparkline(options);
