import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'AA-Rated Corporate Bond Yield Range (2024)',
    },
    data: getData(),
    series: [
        {
            type: 'range-area',
            xKey: 'date',
            yLowKey: 'low',
            yHighKey: 'high',
            fill: {
                type: 'gradient',
                colorStops: [{ color: '#cccccc00', stop: 0 }, { color: '#cccccc80' }],
            },
            item: {
                high: {
                    stroke: '#39ac39',
                    strokeWidth: 2,
                    marker: {
                        fill: '#39ac39',
                        fillOpacity: 1,
                    },
                },
                low: {
                    stroke: '#e60000',
                    strokeWidth: 2,
                    marker: {
                        fill: '#e60000',
                        fillOpacity: 1,
                    },
                },
            },
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
            label: { format: '#{0.1%}' },
        },
    ],
};

AgCharts.create(options);
