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
        },
        {
            type: 'radar-line',
            angleKey: 'department',
            radiusKey: 'efficiency',
            radiusName: 'Efficiency',
        },
    ],
    axes: [
        {
            type: 'angle-category',
        },
        {
            type: 'radius-number',
            positionAngle: 72,
            label: {
                rotation: -72,
            },
        },
    ],
};

AgCharts.create(options);
