import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Dow Jones Industrial Average',
    },
    subtitle: {
        text: 'OHLC Patterns',
    },
    footnote: {
        text: '1 Minute',
    },
    series: [
        {
            type: 'ohlc',
            xKey: 'date',
            xName: 'Time',
            lowKey: 'low',
            highKey: 'high',
            openKey: 'open',
            closeKey: 'close',
            item: {
                up: {
                    stroke: '#45ba45',
                    strokeWidth: 2,
                },
                down: {
                    stroke: '#ba4545',
                    strokeWidth: 2,
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
                    format: ',f',
                },
            },
        },
    ],
};

AgCharts.create(options);
