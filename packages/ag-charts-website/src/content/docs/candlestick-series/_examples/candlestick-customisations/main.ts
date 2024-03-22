import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'S&P 500 Index',
    },
    subtitle: {
        text: 'Daily High and Low Prices',
    },
    footnote: {
        text: '1 Aug 2023 - 1 Nov 2023',
    },
    series: [
        {
            type: 'candlestick',
            xKey: 'date',
            xName: 'Date',
            lowKey: 'low',
            highKey: 'high',
            openKey: 'open',
            closeKey: 'close',
            item: {
                up: {
                    strokeWidth: 2,
                },
                down: {
                    fillOpacity: 0.5,
                    strokeWidth: 0,
                    wick: {
                        strokeWidth: 2,
                    },
                },
            },
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
            label: {
                formatter: ({ value }) =>
                    new Date(value).toLocaleString('en-GB', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    }),
            },
            tick: {
                minSpacing: 150,
            },
        },
        {
            type: 'number',
            position: 'right',
            label: {
                formatter: ({ value }) => Number(value).toLocaleString(),
            },
        },
    ],
};

AgCharts.create(options);
