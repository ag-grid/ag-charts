import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const month = new Intl.DateTimeFormat('en-GB', {
    month: 'short',
});

const day = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
});

const numberFormatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

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
            crosshair: {
                label: {
                    renderer: ({ value }) =>
                        `<div style="padding: 0 7px; border-radius: 2px; line-height: 1.7em; background-color: rgb(71,71,71); color: rgb(255, 255, 255);">${numberFormatter.format(value)}%</div>`,
                },
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
            interval: {
                minSpacing: 100,
            },
            tick: {
                size: 0,
            },
        },
    ],
};

AgCharts.create(options);
