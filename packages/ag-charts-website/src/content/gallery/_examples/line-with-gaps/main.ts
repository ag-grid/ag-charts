import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Imported Banana Prices',
    },
    footnote: {
        text: 'Source: Department for Environment, Food and Rural Affairs',
    },
    series: [
        {
            type: 'line',
            xKey: 'week',
            yKey: 'belize',
            yName: 'Belize',
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'cameroon',
            yName: 'Cameroon',
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'columbia',
            yName: 'Columbia',
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'costaRica',
            yName: 'Costa Rica',
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'dominicanRepublic',
            yName: 'Dominican Republic',
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'ecuador',
            yName: 'Ecuador',
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'honduras',
            yName: 'Honduras',
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'ivoryCoast',
            yName: 'Ivory Coast',
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'panama',
            yName: 'Panama',
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'nicaragua',
            yName: 'Nicaragua',
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
            title: {
                text: 'Week',
            },
            label: {
                formatter: (params) => (params.index % 3 ? '' : params.value),
            },
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: '£ per kg',
            },
        },
    ],
};

AgCharts.create(options);
