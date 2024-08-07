import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Product Revenue',
    },
    subtitle: {
        text: 'Millions USD',
    },
    series: [
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'product',
            radiusName: 'Product',
            fillOpacity: 0.8,
            tooltip: {
                renderer: (params) => {
                    const [day, month] = params.datum.quarter.split(' ');
                    const key = day === '1' ? `${month}` : `Mid-${month}`;
                    return {
                        title: params.radiusName,
                        content: `${key}: ${params.datum.product}`,
                    };
                },
            },
        },
    ],
    axes: [
        {
            type: 'radius-number',
            innerRadiusRatio: 0.5,
            interval: { step: 0.5 },
            label: {
                enabled: false,
            },
            tick: {
                size: 0,
            },
            gridLine: {
                enabled: true,
            },
        },
        {
            type: 'angle-category',
            paddingInner: 0.4,
            label: {
                formatter: ({ value }) => (value.includes('1 ') ? value.substring(2) : ''),
                padding: 0,
            },
            gridLine: {
                enabled: true,
            },
        },
    ],
};

AgCharts.create(options);
