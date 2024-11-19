import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

function formatNumber(value: number) {
    value /= 1000_000;
    return `${Math.floor(value)}M`;
}

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { year: '2016', visitors: 46636720 },
        { year: '2017', visitors: 48772922 },
        { year: '2018', visitors: 50800193 },
        { year: '2019', visitors: 48023342 },
        { year: '2020', visitors: 47271912 },
        { year: '2021', visitors: 47155093 },
        { year: '2022', visitors: 49441678 },
        { year: '2023', visitors: 50368190 },
    ],
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
            tooltip: {
                renderer: ({ datum, xKey, yKey }) => {
                    return { title: datum[xKey], content: formatNumber(datum[yKey]) };
                },
            },
        },
    ],
    axes: [
        {
            type: 'grouped-category',
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

const chart = AgCharts.create(options);
