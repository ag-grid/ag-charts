import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Key Performance Indicators',
    },
    series: [
        {
            type: 'nightingale',
            angleKey: 'department',
            radiusKey: 'efficiency',
            radiusName: 'Efficiency',
        },
        {
            type: 'radar-line',
            angleKey: 'department',
            radiusKey: 'customerSatisfaction',
            radiusName: 'Customer Satisfaction',
        },
        {
            type: 'radar-area',
            angleKey: 'department',
            radiusKey: 'quality',
            radiusName: 'Quality',
            fillOpacity: 0.2,
            strokeWidth: 0,
        },
    ],
    axes: [
        {
            type: 'angle-category',

            gridLine: {
                enabled: true,
            },
            line: {
                enabled: false,
            },
        },
        {
            type: 'radius-number',
        },
    ],
};

AgCharts.create(options);
