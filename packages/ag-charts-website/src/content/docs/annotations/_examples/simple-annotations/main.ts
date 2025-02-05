import { AgChartOptions, AgCharts, AgLineSeriesTooltipRendererParams } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Monthly Sales Revenue',
    },
    footnote: {
        text: '2024, values in $1000s',
    },
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'revenue',
            interpolation: { type: 'smooth' },
            marker: {
                enabled: false,
            },
        },
    ],
    annotations: {
        enabled: true,
        toolbar: {
            enabled: false,
        },
    },
    initialState: {
        annotations: [
            {
                type: 'text',
                x: { value: 'Feb', groupPercentage: -0.2 },
                y: 46,
                text: '$45,000',
                fontSize: 12,
            },
            {
                type: 'text',
                x: { value: 'May', groupPercentage: 0.2 },
                y: 100,
                text: 'Sales increased\nsignificantly\nin May',
                fontSize: 12,
            },
            {
                type: 'vertical-line',
                value: 'May',
                axisLabel: {
                    enabled: false,
                },
                lineStyle: 'dotted',
                strokeWidth: 1,
            },
            {
                type: 'text',
                x: { value: 'Jun', groupPercentage: -0.2 },
                y: 81,
                text: '$80,000',
                fontSize: 12,
            },
            {
                type: 'text',
                x: 'Sep',
                y: 76,
                text: 'End of summer\ndip recovered',
                fontSize: 12,
            },
            {
                type: 'text',
                x: { value: 'Oct', groupPercentage: -0.2 },
                y: 96,
                text: '$95,000',
                fontSize: 12,
            },
            {
                type: 'horizontal-line',
                value: 72,
                axisLabel: {
                    fillOpacity: 0.5,
                },
                lineStyle: 'dotted',
                strokeWidth: 1,
            },
            {
                type: 'line',
                start: { x: 'Jan', y: 32 },
                end: { x: 'Dec', y: 105 },
                strokeWidth: 1,
            },
        ],
    },
};

AgCharts.create(options);
