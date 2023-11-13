import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: `Pete's Instagram Followers`,
    },
    subtitle: {
        text: `He Wishes`,
    },
    series: [
        {
            type: 'range-bar',
            xKey: 'date',
            xName: 'Date',
            yLowKey: 'start',
            yHighKey: 'gain',
            yLowName: 'Start',
            yHighName: 'End',
            yName: 'Followers Gained',
            label: {
                placement: 'outside',
                formatter: ({ itemId, value }) => {
                    return itemId === 'low' ? '' : `+${value.toFixed(0)}`;
                },
            },
        },
        {
            type: 'range-bar',
            xKey: 'date',
            xName: 'Date',
            yLowKey: 'loss',
            yHighKey: 'gain',
            yLowName: 'End',
            yHighName: 'Start',
            yName: 'Followers Lost',
            label: {
                placement: 'outside',
                formatter: ({ itemId, value }) => {
                    return itemId === 'high' ? '' : `-${value.toFixed(0)}`;
                },
            },
        },
        {
            type: 'line',
            xKey: 'date',
            xName: 'Date',
            yKey: 'loss',
            yName: 'Net Followers',
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
            groupPaddingInner: 0,
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
};

AgEnterpriseCharts.create(options);
