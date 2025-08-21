import { AgCharts, AgPolarChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    formatter: {
        radius: ({ value }) => `$${(typeof value === 'number' ? value : Number(value)).toFixed(2)}M`,
    },
    title: {
        text: 'Quarterly Revenue by Product Category',
    },
    subtitle: {
        text: 'Q1 2022 - Q4 2023 (Millions USD)',
        spacing: 12,
    },
    theme: {
        overrides: {
            'radial-column': {
                series: {
                    strokeWidth: 1,
                    fillOpacity: 0.85,
                    highlight: {
                        highlightedItem: {
                            fillOpacity: 1,
                            strokeWidth: 2,
                        },
                    },
                },
            },
        },
    },
    series: [
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'software',
            radiusName: 'Software',
        },
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'hardware',
            radiusName: 'Hardware',
        },
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'services',
            radiusName: 'Services',
        },
    ],
    tooltip: {
        mode: 'shared',
        position: {
            placement: ['right', 'left', 'top', 'bottom'],
        },
    },
    axes: [
        {
            type: 'radius-number',
            innerRadiusRatio: 0.4,
            label: {
                enabled: false,
            },
            gridLine: {
                style: [{ strokeWidth: 1 }],
            },
        },
        {
            type: 'angle-category',
            groupPaddingInner: 0.3,
            paddingInner: 0.3,
        },
    ],
    legend: {
        enabled: true,
        position: 'bottom',
        spacing: 40,
        item: {
            marker: {
                size: 16,
                strokeWidth: 1.5,
            },
            paddingX: 16,
            paddingY: 8,
        },
    },
    padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
    },
};

AgCharts.create(options);
