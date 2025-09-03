import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { DataType, data } from './data';

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
                        start: new Date('2025-04-01'),
                        lineDash: [5, 10],
                    },
                ],
            },
        },
    ],
    axes: [
        { type: 'unit-time', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
};

AgCharts.create(options);
