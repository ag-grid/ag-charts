import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Software Revenue',
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
            fillOpacity: 0.8,
        },
    ],
    axes: [
        {
            type: 'radius-number',
            innerRadiusRatio: 0,
            interval: { values: [1, 3, 5] },
            reverse: true,
            gridLine: {
                width: 2,
            },
            positionAngle: 90,
            label: {
                rotation: -90,
                padding: 12,
                formatter: ({ value }) => `$${value}M`,
            },
            tick: {
                size: 0,
            },
            line: {
                enabled: true,
            },
        },
        {
            type: 'angle-category',
            paddingInner: 0.1,
            gridLine: {
                enabled: true,
            },
            tick: {
                enabled: true,
            },
            label: {
                padding: 5,
            },
        },
    ],
};

AgCharts.create(options);
