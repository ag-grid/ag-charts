import { AgChart, AgChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: `Revenue by product category`,
    },
    subtitle: {
        text: 'Millions USD',
    },
    series: [
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'software',
            radiusName: 'Software',
            grouped: true,
        },
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'hardware',
            radiusName: 'Hardware',
            grouped: true,
        },
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'services',
            radiusName: 'Services',
            grouped: true,
        },
    ],
    axes: [
        {
            type: 'angle-category',
            groupPaddingInner: 0.2,
            paddingInner: 0.3,
        },
        {
            type: 'radius-number',
        },
    ],
};

AgChart.create(options);
