import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { getData } from './data';

function formatNumber(value: number) {
    value /= 1000_000;
    return `${Math.floor(value)}M`;
}

const options: AgChartOptions = {
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
                formatter: ({ defaultValue }) => formatNumber(defaultValue),
            },
            tooltip: {
                renderer: ({ datum, xKey, yKey }) => {
                    return { title: datum[xKey], content: formatNumber(datum[yKey]) };
                },
            },
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
            title: {
                text: 'Year',
            },
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'Total Visitors',
            },
            label: {
                formatter: ({ value }) => formatNumber(value),
            },
        },
    ],
};

AgEnterpriseCharts.create(options);
