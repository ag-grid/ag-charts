import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

function formatNumber(value: number) {
    value /= 1000_000;
    return `${Math.floor(value)}M`;
}

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Total Visitors to Museums and Galleries',
    },
    footnote: {
        text: 'Source: Department for Digital, Culture, Media & Sport',
    },
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'visitors',
            label: {
                formatter: ({ value }) => formatNumber(value),
            },
        },
    ],
    axes: {
        x: {
            type: 'grouped-category',
            position: 'bottom',
            title: {
                text: 'Year',
            },
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Total Visitors',
            },
            label: {
                formatter: ({ value }) => formatNumber(value),
            },
        },
    },
};

const chart = AgCharts.create(options);
