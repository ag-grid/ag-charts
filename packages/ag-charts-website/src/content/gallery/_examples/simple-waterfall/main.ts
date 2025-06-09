import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import type { AgWaterfallSeriesItemStylerParams } from 'ag-charts-types';

import { DataType, getData } from './data';

const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

const options: AgChartOptions<DataType> = {
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
                    label: { enabled: true },
                    itemStyler: ({ datum }) => ({
                        fillOpacity: Math.max(0.5, datum.fee / 17.5),
                    }),
                },
                negative: {
                    name: 'Ins',
                    label: { enabled: true },
                    itemStyler: ({ datum }) => ({
                        fillOpacity: Math.max(0.5, Math.abs(datum.fee) / 75),
                    }),
                },
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
            interval: { values: [0, -148.1] },
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
    formatter: {
        y: (params) => `${formatter.format(params.value as number)}M`,
    },
};

AgCharts.create(options);
