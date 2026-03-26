import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    theme: {
        overrides: {
            line: {
                series: {
                    highlight: {
                        highlightedSeries: {
                            strokeWidth: 3,
                        },
                        unhighlightedSeries: {
                            opacity: 0.2,
                        },
                    },
                },
            },
        },
    },
    title: {
        text: 'Road fuel prices',
        fontSize: 18,
        spacing: 25,
    },
    footnote: {
        text: 'Source: Department for Business, Energy & Industrial Strategy',
    },
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'petrol',
            stroke: '#01c185',
            marker: {
                stroke: '#01c185',
                fill: '#01c185',
                strokeWidth: 0
            },
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'diesel',
            stroke: '#000000',
            marker: {
                stroke: '#000000',
                fill: '#000000',
                strokeWidth: 0
            },
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
            interval: {
                step: { unit: 'month', step: 2 },
            },
            title: {
                text: 'Date',
            },
            label: {
                autoRotate: true,
            },
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Price in pence',
            },
            label: {
                autoRotate: true,
            },
        },
    },
};

AgCharts.create(options);
