import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'KPIs by Department',
    },
    series: [
        {
            type: 'radar-line',
            angleKey: 'department',
            radiusKey: 'quality',
            radiusName: 'Quality',
            lineDash: [4],
            strokeWidth: 1,
        },
        {
            type: 'radar-line',
            angleKey: 'department',
            radiusKey: 'efficiency',
            radiusName: 'Efficiency',
            lineDash: [4],
            strokeWidth: 1,
        },
        {
            type: 'radar-line',
            angleKey: 'department',
            radiusKey: 'customerSatisfaction',
            radiusName: 'Customer Satisfaction',
            strokeWidth: 1,
            marker: {
                enabled: false,
            },
        },
    ],
    axes: [
        {
            type: 'angle-category',
            gridLine: {
                enabled: false,
            },
        },
        {
            type: 'radius-number',
            gridLine: {
                enabled: true,
            },
            line: {
                enabled: false,
            },
            label: {
                enabled: false,
            },
        },
    ],
};

AgCharts.create(options);
