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
            type: 'radar-area',
            angleKey: 'department',
            radiusKey: 'quality',
            radiusName: 'Quality',
            strokeWidth: 1,
            fillOpacity: 0.1,
        },
        {
            type: 'radar-area',
            angleKey: 'department',
            radiusKey: 'efficiency',
            radiusName: 'Efficiency',
            strokeWidth: 1,
            fillOpacity: 0.1,
        },
        {
            type: 'radar-area',
            angleKey: 'department',
            radiusKey: 'revenueGrowth',
            radiusName: 'Revenue Growth',
            strokeWidth: 1,
            fillOpacity: 0.1,
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
            gridLine: {
                enabled: false,
            },
            line: {
                enabled: false,
            },
        },
    ],
};

AgCharts.create(options);
