import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Manchester United Transfers',
    },
    subtitle: {
        text: 'Outgoing Sales & Incoming Signings from Season 2023-2024',
    },
    footnote: {
        text: 'Arrivals: 17, Departures: 11',
    },
    series: [
        {
            type: 'waterfall',
            xKey: 'player',
            xName: 'Player',
            yKey: 'fee',
            yName: 'Fee',
            item: {
                positive: {
                    name: 'Outs',
                    formatter: ({ value }) => ({
                        fillOpacity: Math.max(0.5, value / 17.5),
                    }),
                    label: {
                        formatter: ({ value }) => `£${value}M`,
                    },
                },
                negative: {
                    name: 'Ins',
                    formatter: ({ value }) => ({
                        fillOpacity: Math.max(0.5, Math.abs(value) / 75),
                    }),
                    label: {
                        formatter: ({ value }) => `-£${Math.abs(value)}M`,
                    },
                },
            },
        },
    ],
    axes: [
        {
            position: 'left',
            type: 'number',
            label: {
                formatter: ({ value }) => `${value}M`,
            },
            tick: {
                values: [0, -148.1],
            },
        },
        {
            position: 'top',
            type: 'category',
            gridLine: { enabled: true },
        },
    ],
    legend: {
        position: 'top',
    },
};

AgCharts.create(options);
