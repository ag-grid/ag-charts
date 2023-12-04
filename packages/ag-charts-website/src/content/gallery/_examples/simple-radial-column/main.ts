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
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'software',
            radiusName: 'Software',
            strokeWidth: 1,
            fillOpacity: 0.6,
        },
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'hardware',
            radiusName: 'Hardware',
            strokeWidth: 1,
            fillOpacity: 0.6,
        },
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'services',
            radiusName: 'Services',
            strokeWidth: 1,
            fillOpacity: 0.6,
        },
    ],
    axes: [
        {
            type: 'radius-number',
            innerRadiusRatio: 0.4,
            label: {
                enabled: false,
            },
        },
        {
            type: 'angle-category',
            groupPaddingInner: 0.3,
            paddingInner: 0.3,
        },
    ],
};

AgCharts.create(options);
