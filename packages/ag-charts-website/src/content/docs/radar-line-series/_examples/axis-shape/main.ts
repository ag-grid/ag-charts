import { AgCharts, AgPolarChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgPolarChartOptions = {
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
    axes: {
        angle: {
            type: 'angle-category',
            shape: 'circle',
        },
        radius: {
            type: 'radius-number',
            shape: 'circle',
        },
    },
};

AgCharts.create(options);
