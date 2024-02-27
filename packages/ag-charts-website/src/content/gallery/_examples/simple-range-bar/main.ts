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
            type: 'range-bar',
            xKey: 'date',
            xName: 'Date',
            yLowKey: 'low',
            yHighKey: 'high',
            strokeWidth: 1,
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
            nice: false,
            tick: {
                values: [
                    new Date(2023, 7, 1),
                    new Date(2023, 7, 15),
                    new Date(2023, 8, 1),
                    new Date(2023, 8, 15),
                    new Date(2023, 9, 1),
                    new Date(2023, 9, 15),
                    new Date(2023, 10, 1),
                ],
            },
            line: {
                enabled: false,
            },
            gridLine: {
                style: [
                    {
                        stroke: 'rgb(216,216,216)',
                        lineDash: [2, 2],
                    },
                ],
            },
        },
        {
            type: 'number',
            position: 'right',
            nice: false,
            label: {
                formatter: ({ value }) => Number(value).toLocaleString(),
            },
            gridLine: {
                style: [
                    {
                        stroke: 'rgb(216,216,216)',
                        lineDash: [2, 2],
                    },
                ],
            },
        },
    ],
};

AgCharts.create(options);
