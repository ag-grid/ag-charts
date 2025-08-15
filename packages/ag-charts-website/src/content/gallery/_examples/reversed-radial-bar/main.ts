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
    formatter: {
        y: ({ value }) => `$${typeof value === 'number' ? value.toFixed(1) : value}M`,
    },
    tooltip: {
        enabled: true,
        mode: 'shared',
    },
    legend: {
        enabled: true,
        position: 'bottom',
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
            type: 'radius-category',
            reverse: true,
            innerRadiusRatio: 0.1,
            paddingInner: 0.4,
            label: {
                enabled: true,
                fill: 'white',
                fillOpacity: 0.8,
                padding: {
                    top: 3,
                    left: 4,
                    right: 4,
                },
                cornerRadius: 4,
            },
        },
        {
            type: 'angle-number',
            reverse: true,
            line: {
                enabled: false,
            },
            gridLine: {
                enabled: true,
                style: [{ strokeWidth: 1, lineDash: [2, 2] }],
            },
        },
    ],
};

AgCharts.create(options);
