import { AgChartOptions, AgCharts } from 'ag-charts-community';

import './alert';

const options: AgChartOptions = {
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
        seriesNodeClick: ({ datum, xKey, yKey, seriesId }) => {
            window.alert(`[click]\nTemperature in ${datum[xKey!]}: ${String(datum[yKey!])}°C\nSeries: ${seriesId}`);
        },
        seriesNodeDoubleClick: ({ datum, xKey, yKey, seriesId }) => {
            const celsius = Number(datum[yKey!]);
            const fahrenheit = (celsius * 9) / 5 + 32;
            window.alert(
                `[double click]\nTemperature in ${datum[xKey!]}: ${fahrenheit.toFixed(2)}°F\nSeries: ${seriesId}`
            );
        },
    },
};

AgCharts.create(options);
