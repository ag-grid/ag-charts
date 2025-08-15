import { AgCharts, AgPolarChartOptions } from 'ag-charts-enterprise';

import { type RevenueData, getData } from './data';

const options: AgPolarChartOptions<RevenueData> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Revenue by Product Category',
    },
    subtitle: {
        text: 'Quarterly Performance (Millions USD)',
    },
    formatter: {
        y: ({ value }) => {
            if (typeof value === 'number') {
                return `$${value.toFixed(1)}M`;
            }
            return String(value);
        },
    },
    series: [
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'software',
            radiusName: 'Software',
            stacked: true,
            highlight: {
                highlightedItem: {
                    fillOpacity: 1,
                    strokeWidth: 2,
                },
            },
        },
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'hardware',
            radiusName: 'Hardware',
            stacked: true,
            highlight: {
                highlightedItem: {
                    fillOpacity: 1,
                    strokeWidth: 2,
                },
            },
        },
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'services',
            radiusName: 'Services',
            stacked: true,
            highlight: {
                highlightedItem: {
                    fillOpacity: 1,
                    strokeWidth: 2,
                },
            },
        },
    ],
    axes: [
        {
            type: 'radius-number',
            innerRadiusRatio: 0.4,
            reverse: true,
            label: {
                enabled: false,
            },
        },
        {
            type: 'angle-category',
            paddingInner: 0.2,
        },
    ],
    legend: {
        position: 'bottom',
        item: {
            marker: {
                size: 16,
            },
        },
    },
};

AgCharts.create(options);
