import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Revenue by Product Category',
    },
    subtitle: {
        text: 'Millions USD',
    },
    series: [
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'software',
            angleName: 'Software',
        },
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'hardware',
            angleName: 'Hardware',
        },
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'services',
            angleName: 'Services',
        },
    ],
    axes: [
        {
            type: 'angle-number',
        },
        {
            type: 'radius-category',
            innerRadiusRatio: 0.3,
        },
    ],
};

AgCharts.create(options);
