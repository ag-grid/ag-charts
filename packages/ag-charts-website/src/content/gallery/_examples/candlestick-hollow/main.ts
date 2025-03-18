import { AgChartOptions, AgCharts, time } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Bitcoin USD',
    },
    subtitle: {
        text: '(BTC-USD)',
    },
    footnote: {
        text: '2014 - 2024',
    },
    series: [
        {
            type: 'candlestick',
            xKey: 'date',
            xName: 'Date',
            lowKey: 'low',
            lowName: 'Low',
            highKey: 'high',
            highName: 'High',
            openKey: 'open',
            openName: 'Open',
            closeKey: 'close',
            closeName: 'Close',
            item: {
                up: {
                    fill: 'transparent',
                    stroke: '#2b5c95',
                },
                down: {
                    fill: '#5090dc',
                    stroke: '#2b5c95',
                },
            },
        },
    ],
    zoom: {
        enabled: true,
    },
    axes: [
        {
            type: 'ordinal-time',
            position: 'bottom',
            interval: { step: time.year.every(1) },
            line: {
                enabled: false,
            },
            gridLine: {
                enabled: true,
            },
            crosshair: {
                label: {
                    format: '%d %b %y',
                },
            },
        },
        {
            type: 'number',
            position: 'right',
            interval: { step: 10000 },
            label: {
                formatter: ({ value }) => Number(value).toLocaleString(),
            },
            crosshair: {
                label: {
                    format: `,f`,
                },
            },
        },
    ],
    tooltip: {
        position: {
            anchorTo: 'pointer',
            yOffset: -20,
        },
    },
};
AgCharts.create(options);
