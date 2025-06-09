import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { DataType, data } from './data';

const options: AgChartOptions<DataType> = {
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
                itemStyler: ({ datum: { coal, nuclear }, fill, size }) => {
                    return coal > nuclear ? { fill: 'red', size: 15 } : { fill, size };
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
            itemStyler: ({ datum, fill, highlighted }) => {
                return {
                    fill: datum.month === 'Jul' ? (highlighted ? 'lime' : 'red') : fill,
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
