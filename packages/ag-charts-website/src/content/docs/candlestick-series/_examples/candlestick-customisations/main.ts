import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Dow Jones Industrial Average',
    },
    subtitle: {
        text: 'Candlestick Patterns',
    },
    footnote: {
        text: '1 Minute',
    },
    series: [
        {
            type: 'candlestick',
            xKey: 'date',
            xName: 'Time',
            lowKey: 'low',
            highKey: 'high',
            openKey: 'open',
            closeKey: 'close',
            item: {
                up: {
                    fill: 'transparent',
                    stroke: '#2b5c95',
                    wick: {
                        strokeWidth: 2,
                    },
                },
                down: {
                    fill: '#5090dc',
                    stroke: '#2b5c95',
                    wick: {
                        strokeWidth: 2,
                    },
                },
            },
        },
    ],
    axes: [
        {
            type: 'ordinal-time',
            position: 'bottom',
            label: {
                format: '%H:%M',
            },
        },
        {
            type: 'number',
            position: 'right',
            label: {
                formatter: ({ value }) => Number(value).toLocaleString(),
            },
            crosshair: {
                label: {
                    renderer: ({ value }) => ({
                        text: Number(value.toFixed(0)).toLocaleString(),
                    }),
                },
            },
        },
    ],
};

AgCharts.create(options);
