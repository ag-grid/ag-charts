import { AgChartOptions, AgCharts, time } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'petrol',
            yName: 'Petrol',
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'diesel',
            yName: 'Diesel',
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'time',
            title: {
                text: 'Date',
            },
            crossLines: [
                {
                    type: 'range',
                    range: [new Date(2019, 4, 1), new Date(2019, 6, 1)],
                    strokeWidth: 0,
                    fill: '#7290C4',
                    fillOpacity: 0.4,
                    label: {
                        text: 'Price Peak',
                        position: 'top',
                        fontSize: 14,
                    },
                },
            ],
        },
        {
            position: 'left',
            type: 'number',
            title: {
                text: 'Price in pence',
            },
            crossLines: [
                {
                    type: 'line',
                    value: 142.45,
                    stroke: '#7290C4',
                    lineDash: [6, 12],
                    label: {
                        text: '142.4',
                        position: 'right',
                        fontSize: 12,
                        color: '#000000',
                    },
                },
                {
                    type: 'line',
                    value: 133.8,
                    stroke: '#7290C4',
                    lineDash: [6, 12],
                    label: {
                        text: '133.8',
                        position: 'right',
                        fontSize: 12,
                        color: '#01c185',
                    },
                },
                {
                    type: 'line',
                    value: 135.35,
                    stroke: '#D21E75',
                    lineDash: [2, 4],
                    label: {
                        text: '135.3',
                        position: 'right',
                        fontSize: 12,
                        color: '#000000',
                    },
                },
                {
                    type: 'line',
                    value: 123.97,
                    stroke: '#D21E75',
                    lineDash: [2, 4],
                    label: {
                        text: '124.0',
                        position: 'right',
                        fontSize: 12,
                        color: '#01c185',
                    },
                },
            ],
        },
    ],
    theme: {
        overrides: {
            line: {
                series: {
                    tooltip: {
                        renderer: ({ datum, xKey, yKey }) => ({
                            content: `${datum[xKey].toLocaleString('en-GB', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}: ${datum[yKey]}`,
                        }),
                    },
                },
            },
        },
    },
};

const chart = AgCharts.create(options);
