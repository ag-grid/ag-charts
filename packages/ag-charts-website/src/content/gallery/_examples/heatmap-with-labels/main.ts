import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Revenue per Quarter',
    },
    subtitle: {
        text: '£ million',
    },
    tooltip: {
        enabled: true,
    },
    series: [
        {
            type: 'heatmap' as const,

            xKey: 'month',
            xName: 'Month',

            yKey: 'year',
            yName: 'Year',

            colorKey: 'revenue',
            colorName: 'Revenue',

            label: {
                enabled: true,
                formatter: ({ value }: { value: number }) => `£${value.toFixed(1)}m`,
            },
        },
    ],
    axes: [
        {
            position: 'right',
            type: 'category' as const,
            tick: {
                size: 20,
            },
        },
        {
            position: 'bottom',
            type: 'category' as const,
            label: {
                enabled: true, // Show quarter labels for better readability
            },
            line: {
                enabled: false,
            },
        },
    ],
    gradientLegend: {
        scale: {
            label: {
                formatter: ({ value }: { value: number | string }) => `£${Number(value).toFixed(0)}m`,
            },
        },
    },
};

AgCharts.create(options);
