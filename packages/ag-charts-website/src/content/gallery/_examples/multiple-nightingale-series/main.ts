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
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'software',
            radiusName: 'Software',
        },
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'hardware',
            radiusName: 'Hardware',
            fillOpacity: 0.5,
        },
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'services',
            radiusName: 'Services',
            fillOpacity: 0.3,
        },
    ],
    axes: [
        {
            type: 'radius-number',
            innerRadiusRatio: 0,
            crossLines: [
                {
                    type: 'range',
                    range: [10, 12],
                    strokeWidth: 0,
                    fillOpacity: 0.05,
                },
                {
                    type: 'range',
                    range: [8, 6],
                    strokeWidth: 0,
                    fillOpacity: 0.05,
                },
                {
                    type: 'range',
                    range: [4, 2],
                    strokeWidth: 0,
                    fillOpacity: 0.05,
                },
            ],
        },
        {
            type: 'angle-category',
            paddingInner: 0.4,
            line: {
                enabled: false,
            },
        },
    ],
};

AgCharts.create(options);
