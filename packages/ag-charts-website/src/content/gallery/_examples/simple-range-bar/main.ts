import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const month = new Intl.DateTimeFormat('en-GB', {
    month: 'short',
});

const day = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
});

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
            cornerRadius: 3,
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
            crosshair: {
                label: {
                    renderer: ({ value }) =>
                        `<div style="padding: 0 7px; border-radius: 2px; line-height: 1.7em; background-color: rgb(71,71,71); color: rgb(255, 255, 255);">${month.format(value)} ${day.format(value)}</div>`,
                },
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
