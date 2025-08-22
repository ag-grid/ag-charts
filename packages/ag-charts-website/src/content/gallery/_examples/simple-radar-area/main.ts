import { AgCharts, AgPolarChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'KPIs by Department',
    },
    // Root-level formatter for consistency across all elements
    formatter: {
        radius: ({ value }) => `${value}%`,
    },
    // Shared tooltips for multi-series comparison
    tooltip: {
        mode: 'shared',
        position: {
            placement: ['top', 'bottom'],
        },
    },
    series: [
        {
            type: 'radar-area',
            angleKey: 'department',
            radiusKey: 'quality',
            radiusName: 'Quality',
            strokeWidth: 2,
            fillOpacity: 0.3,
        },
        {
            type: 'radar-area',
            angleKey: 'department',
            radiusKey: 'efficiency',
            radiusName: 'Efficiency',
            strokeWidth: 2,
            fillOpacity: 0.3,
        },
        {
            type: 'radar-area',
            angleKey: 'department',
            radiusKey: 'revenueGrowth',
            radiusName: 'Revenue Growth',
            strokeWidth: 2,
            fillOpacity: 0.3,
        },
    ],
    axes: [
        {
            type: 'angle-category',
            gridLine: {
                enabled: true,
                style: [
                    {
                        strokeWidth: 1,
                    },
                ],
            },
            line: {
                enabled: false,
            },
        },
        {
            type: 'radius-number',
            gridLine: {
                enabled: true,
                style: [
                    {
                        strokeWidth: 1,
                    },
                ],
            },
            line: {
                enabled: false,
            },
        },
    ],
};

AgCharts.create(options);
