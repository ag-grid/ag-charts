import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import {
    LineSeriesModule,
    NumberAxisModule,
    UnitTimeAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';

import { DataType, data } from './data';


ModuleRegistry.registerModules([LineSeriesModule, NumberAxisModule, UnitTimeAxisModule]);
const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: { text: 'Performance Variance' },
    data,
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'value',
            xName: 'Date',
            yName: 'Value',
            interpolation: {
                type: 'smooth',
            },
            segmentation: {
                key: 'x',
                segments: [
                    {
                        start: new Date('2025-01-01'),
                        lineDash: [5, 10],
                    },
                ],
            },
        },
    ],
    axes: {
        x: { type: 'unit-time', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
};

AgCharts.create(options);
