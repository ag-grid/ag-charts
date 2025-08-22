import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Department Performance Metrics',
    },
    subtitle: {
        text: 'Quality, Efficiency & Customer Satisfaction Scores (Q4 2024)',
    },
    // Root formatter for consistent percentage display
    formatter: {
        y: ({ value }) => `${value}%`,
    },
    series: [
        {
            type: 'radar-line',
            angleKey: 'department',
            radiusKey: 'quality',
            radiusName: 'Quality',
            lineDash: [4],
            strokeWidth: 1,
        },
        {
            type: 'radar-line',
            angleKey: 'department',
            radiusKey: 'efficiency',
            radiusName: 'Efficiency',
            lineDash: [4],
            strokeWidth: 1,
        },
        {
            type: 'radar-line',
            angleKey: 'department',
            radiusKey: 'customerSatisfaction',
            radiusName: 'Customer Satisfaction',
            strokeWidth: 1,
            marker: {
                enabled: false,
            },
        },
    ],
    axes: [
        {
            type: 'angle-category',
        },
        {
            type: 'radius-number',
            label: {
                enabled: false,
            },
        },
    ],
    legend: {
        enabled: true,
        position: {
            placement: 'right-bottom',
            floating: true,
            xOffset: -20,
            yOffset: -20,
        },
        item: {
            paddingX: 16,
            paddingY: 8,
            marker: {
                size: 15,
                strokeWidth: 2,
            },
        },
    },
    tooltip: {
        enabled: true,
        showArrow: false,
    },
    background: {
        fill: undefined,
    },
};

AgCharts.create(options);
