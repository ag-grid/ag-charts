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
            fillOpacity: 0.8,
        },
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'hardware',
            angleName: 'Hardware',
            fillOpacity: 0.6,
        },
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'services',
            angleName: 'Services',
            fillOpacity: 0.4,
        },
    ],
    axes: [
        {
            type: 'radius-category',
            reverse: true,
            innerRadiusRatio: 0.1,
            paddingInner: 0.4,
            label: {
                enabled: false,
            },
        },
        {
            type: 'angle-number',
            reverse: true,
            line: {
                enabled: false,
            },
        },
    ],
};

AgCharts.create(options);
