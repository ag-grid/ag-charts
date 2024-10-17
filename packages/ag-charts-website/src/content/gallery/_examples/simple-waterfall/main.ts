import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const formatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

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
                    itemStyler: ({ datum, yKey }) => ({
                        fillOpacity: Math.max(0.5, datum[yKey] / 17.5),
                    }),
                    label: {
                        formatter: ({ value }) => `£${value}M`,
                    },
                },
                negative: {
                    name: 'Ins',
                    itemStyler: ({ datum, yKey }) => ({
                        fillOpacity: Math.max(0.5, Math.abs(datum[yKey]) / 75),
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
            type: 'number',
            position: 'left',
            interval: { values: [0, -148.1] },
            label: {
                formatter: ({ value }) => `-£${formatter.format(Math.abs(value))}M`,
            },
        },
        {
            type: 'category',
            position: 'top',
            gridLine: { enabled: true },
        },
    ],
    legend: {
        position: 'top',
    },
};

AgCharts.create(options);
