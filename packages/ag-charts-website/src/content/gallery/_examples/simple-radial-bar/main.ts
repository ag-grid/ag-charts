import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Services Revenue',
    },
    subtitle: {
        text: 'Millions USD',
    },
    series: [
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'services',
            angleName: 'Services',
            stacked: true,
            fillOpacity: 0.8,
        },
    ],
    axes: [
        {
            type: 'radius-category',
            innerRadiusRatio: 0,
            paddingOuter: 0.2,
            label: {
                enabled: false,
            },
            gridLine: {
                enabled: false,
            },
        },
        {
            type: 'angle-number',
            startAngle: 135,
            endAngle: 360,
            interval: 0.2,
            gridLine: {
                enabled: true,
            },
            label: {
                formatter: ({ value }) => value.toFixed(1),
            },
        },
    ],
};
AgCharts.create(options);
