import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    animation: {
        enabled: true,
        duration: 800,
    },
    title: {
        text: 'Imported Banana Prices by Country',
        fontSize: 20,
    },
    footnote: {
        text: 'Source: Department for Environment, Food and Rural Affairs',
        fontSize: 12,
        fontStyle: 'italic',
    },
    legend: {
        position: {
            placement: 'top',
        },
    },
    tooltip: {
        mode: 'shared',
        position: {
            anchorTo: 'pointer',
            placement: ['right', 'left', 'top', 'bottom'],
            xOffset: 10,
            yOffset: -10,
        },
        wrapping: 'hyphenate',
    },
    series: [
        {
            type: 'line',
            xKey: 'week',
            yKey: 'belize',
            yName: 'Belize',
            strokeWidth: 2.5,
            marker: {
                size: 7,
                strokeWidth: 2,
            },
            connectMissingData: false,
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'cameroon',
            yName: 'Cameroon',
            strokeWidth: 2.5,
            marker: {
                size: 7,
                strokeWidth: 2,
            },
            connectMissingData: false,
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'columbia',
            yName: 'Colombia',
            strokeWidth: 2.5,
            marker: {
                size: 7,
                strokeWidth: 2,
            },
            connectMissingData: false,
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'costaRica',
            yName: 'Costa Rica',
            strokeWidth: 2.5,
            marker: {
                size: 7,
                strokeWidth: 2,
            },
            connectMissingData: false,
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'dominicanRepublic',
            yName: 'Dominican Republic',
            strokeWidth: 2.5,
            marker: {
                size: 7,
                strokeWidth: 2,
            },
            connectMissingData: false,
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'ecuador',
            yName: 'Ecuador',
            strokeWidth: 2.5,
            marker: {
                size: 7,
                strokeWidth: 2,
            },
            connectMissingData: false,
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'honduras',
            yName: 'Honduras',
            strokeWidth: 2.5,
            marker: {
                size: 7,
                strokeWidth: 2,
            },
            connectMissingData: false,
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'ivoryCoast',
            yName: 'Ivory Coast',
            strokeWidth: 2.5,
            marker: {
                size: 7,
                strokeWidth: 2,
            },
            connectMissingData: false,
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'panama',
            yName: 'Panama',
            strokeWidth: 2.5,
            marker: {
                size: 7,
                strokeWidth: 2,
            },
            connectMissingData: false,
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'nicaragua',
            yName: 'Nicaragua',
            strokeWidth: 2.5,
            marker: {
                size: 7,
                strokeWidth: 2,
            },
            connectMissingData: false,
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
            title: {
                text: 'Week of Year',
                fontSize: 14,
            },
            label: {
                fontSize: 12,
                rotation: 0,
                minSpacing: 70,
                formatter: (params) => {
                    return `Week ${params.value}`;
                },
            },
            bandHighlight: {
                enabled: true,
            },
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'Price (£ per kg)',
                fontSize: 14,
            },
            label: {
                fontSize: 12,
                formatter: (params) => `£${params.value.toFixed(2)}`,
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [3, 3],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
        },
    ],
};

AgCharts.create(options);
