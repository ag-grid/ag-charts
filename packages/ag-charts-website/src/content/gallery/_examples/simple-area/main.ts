import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

const shortDateFormat = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
});

const longDateFormat = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'User Engagement Trends',
    },
    footnote: {
        text: 'Daily new signups for May 1–14, 2025',
    },
    series: [
        {
            type: 'area',
            xKey: 'date',
            yKey: 'newSignups',
            yName: 'Sign Ups',
            strokeWidth: 2,
            highlight: {
                highlightedItem: {
                    strokeWidth: 3,
                },
            },
            interpolation: {
                type: 'smooth',
            },
            tooltip: {
                renderer: (params) => {
                    const { datum, yKey, yName } = params;
                    return {
                        title: 'Engagement',
                        heading: longDateFormat.format(datum.date),
                        data: [
                            { label: yName!, value: datum[yKey].toString() },
                            { label: 'Active Users', value: datum.activeUsers.toLocaleString() },
                        ],
                    };
                },
            },
        },
    ],
    axes: [
        {
            type: 'unit-time',
            position: 'bottom',
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'Sign Ups',
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
            crossLines: [
                {
                    type: 'line',
                    value: 75,
                    strokeWidth: 2,
                    lineDash: [5, 5],
                    label: {
                        text: 'Target: 75',
                        position: 'top',
                    },
                },
            ],
        },
    ],
    formatter: {
        x(params) {
            if (params.type !== 'date') return;
            const formatter = params.style === 'component' ? shortDateFormat : longDateFormat;
            return formatter
                .formatToParts(params.value)
                .map((part) => {
                    if (part.type !== 'day') return part.value;

                    const suffixes = ['st', 'nd', 'rd'];
                    const suffix = suffixes[Number(part.value) - 1] ?? 'th';
                    return `${part.value}${suffix}`;
                })
                .join('');
        },
    },
    animation: {
        enabled: true,
        duration: 800,
    },
};

AgCharts.create(options);
