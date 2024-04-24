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
        },
    ],
    // annotations: {
    //     initial: [
    //         {
    //             type: 'line',
    //             locked: true,
    //             start: { x: new Date('2024-03-21T18:55:00.000Z'), y: 39838.38 },
    //             end: { x: new Date('2024-03-21T19:02:00.000Z'), y: 39829.71 },
    //         },
    //         {
    //             type: 'line',
    //             locked: true,
    //             start: { x: new Date('2024-03-21T19:02:00.000Z'), y: 39830.63 },
    //             end: { x: new Date('2024-03-21T19:16:00.000Z'), y: 39833.59 },
    //         },
    //         {
    //             type: 'line',
    //             locked: true,
    //             start: { x: new Date('2024-03-21T19:16:00.000Z'), y: 39835.38 },
    //             end: { x: new Date('2024-03-21T19:32:00.000Z'), y: 39833.49 },
    //         },
    //     ],
    // },
};

AgCharts.create(options);
