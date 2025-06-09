import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { DataType } from './data';

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Average low/high temperatures in London',
    },
    subtitle: {
        text: '(click a data point for details)',
    },
    data: [
        { month: 'March', low: 3.9, high: 11.3 },
        { month: 'April', low: 5.5, high: 14.2 },
        { month: 'May', low: 8.7, high: 17.9 },
    ],
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'high',
        },
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'low',
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
        },
    ],
    legend: {
        enabled: false,
    },
    listeners: {
        seriesNodeClick: ({ datum, yKey, seriesId }) => {
            console.log(`[click]\nTemperature in ${datum.month}: ${String(datum[yKey!])}°C\nSeries: ${seriesId}`);
        },
        seriesNodeDoubleClick: ({ datum, yKey, seriesId }) => {
            const celsius = Number(datum[yKey!]);
            const fahrenheit = (celsius * 9) / 5 + 32;
            console.log(
                `[double click]\nTemperature in ${datum.month}: ${fahrenheit.toFixed(2)}°F\nSeries: ${seriesId}`
            );
        },
    },
};

AgCharts.create(options);
