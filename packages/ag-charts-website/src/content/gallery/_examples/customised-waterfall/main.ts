import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'FTSE 100 Index',
    },
    subtitle: {
        text: 'October (2023)',
    },
    footnote: {
        text: 'Net Variation: -4.12%',
    },
    series: [
        {
            type: 'waterfall',
            xKey: 'date',
            xName: 'Date',
            yKey: 'percentageChange',
            yName: 'Change',
            line: {
                lineDash: [2],
                strokeOpacity: 0.5,
            },
            totals: [
                {
                    totalType: 'total',
                    index: 10,
                    axisLabel: 'Net\nVariation',
                },
            ],
            item: {
                positive: {
                    name: '+',
                    label: {
                        formatter: ({ value }) => `↑${value}`,
                    },
                    fillOpacity: 0.7,
                    strokeWidth: 1,
                },
                negative: {
                    name: '-',
                    label: {
                        formatter: ({ value }) => `↓${value}`,
                    },
                    fillOpacity: 0.7,
                    strokeWidth: 1,
                },
                total: {
                    label: {
                        placement: 'inside',
                        fontSize: 11,
                        formatter: ({ value }) => `↓${Math.abs(value)}`,
                    },
                    fillOpacity: 0.3,
                },
            },
        },
    ],
    axes: [
        {
            position: 'right',
            type: 'number',
            label: {
                padding: 20,
                formatter: ({ value }) => `${value}%`,
            },
        },
        {
            position: 'bottom',
            type: 'category',
            line: {
                enabled: false,
            },
            label: {
                padding: 20,
                formatter: ({ value }) =>
                    `${
                        value === 'Net\nVariation'
                            ? value
                            : new Date(value).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                              })
                    }`,
            },
            tick: {
                size: 0,
                minSpacing: 100,
            },
        },
    ],
};

AgCharts.create(options);
