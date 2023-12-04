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
            stacked: true,
        },
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'hardware',
            angleName: 'Hardware',
            stacked: true,
            strokeWidth: 1,
            fillOpacity: 0.3,
        },
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'services',
            angleName: 'Services',
            stacked: true,
        },
    ],
    axes: [
        {
            type: 'radius-category',
            innerRadiusRatio: 0.1,
            paddingInner: 0.5,
        },
        {
            type: 'angle-number',
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
