import { AgChartOptions, AgEnterpriseCharts, AgRangeBarSeriesLabelFormatterParams } from 'ag-charts-enterprise';

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
            fill: '#205C37',
            stroke: '#205C37',
            label: {
                placement: 'outside',
                color: '#205C37',
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
            fill: '#D1C0A8',
            stroke: '#D1C0A8',
            label: {
                placement: 'outside',
                color: '#D1C0A8',
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
            stroke: '#5c2045',
            strokeWidth: 4,
            marker: {
                fill: '#5c2045',
                stroke: '#5c2045',
                size: 0,
            },
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
