import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Hardware Revenue',
    },
    subtitle: {
        text: 'Millions USD',
    },
    series: [
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'hardware',
            radiusName: 'Hardware',
            fillOpacity: 0.8,
        },
    ],
    axes: [
        {
            type: 'radius-number',
            label: {
                enabled: false,
            },
        },
        {
            type: 'angle-category',
            gridLine: {
                enabled: true,
            },
            label: {
                padding: 0,
            },
            line: {
                enabled: false,
            },
        },
    ],
};

AgCharts.create(options);
