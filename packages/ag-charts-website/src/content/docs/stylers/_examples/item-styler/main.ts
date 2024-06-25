import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { data } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: data,
    title: {
        text: 'UK Energy Sources',
    },
    subtitle: {
        text: 'Source: Department for Business, Energy & Industrial Strategy',
    },
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'coal',
            yName: 'Coal',
            marker: {
                itemStyler: (params) => {
                    if (params.datum.coal > params.datum.nuclear) return { fill: 'red', size: 15 };
                    else return { fill: params.fill, size: params.size };
                },
            },
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'nuclear',
            yName: 'Nuclear',
        },
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'imported',
            yName: 'Imported',
            itemStyler: ({ datum, xKey, fill, highlighted }) => {
                return {
                    fill: datum[xKey] === 'Jul' ? (highlighted ? 'lime' : 'red') : fill,
                };
            },
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
            gridLine: {
                enabled: false,
            },
            label: {
                format: '#{.1f}%',
            },
            title: {
                text: 'Normalized Percentage Energy',
            },
        },
    ],
    legend: {
        position: 'bottom',
    },
};

AgCharts.create(options);
