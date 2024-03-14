import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const formatter = new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    year: '2-digit',
});

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'House Price Index In London',
    },
    subtitle: {
        text: 'Price Indices of Flats and Terraced Houses from 2020 to 2023',
        spacing: 45,
    },
    footnote: {
        text: 'Source: UK Gov Land Registry',
    },
    series: [
        {
            type: 'range-area',
            xKey: 'Date',
            yLowKey: 'Flats and maisonettes',
            yHighKey: 'Terraced houses',
            fillOpacity: 0.2,
            label: {
                formatter: ({ value }) => `${value === 113.4 ? value : ''}`,
            },
            tooltip: {
                renderer: ({ datum, xKey, yLowKey, yHighKey }) =>
                    `<div class="ag-chart-tooltip-content">${formatter.format(datum[xKey])}: ${datum[yLowKey]} - ${datum[yHighKey]}</div>`,
            },
        },
        {
            type: 'range-area',
            xKey: 'Date',
            yLowKey: 'Terraced houses',
            yHighKey: 'Semi-detached houses',
            fillOpacity: 0.2,
            label: {
                formatter: ({ value }) => `${value === 149.9 ? value : ''}`,
            },
            tooltip: {
                renderer: ({ datum, xKey, yLowKey, yHighKey }) =>
                    `<div class="ag-chart-tooltip-content">${formatter.format(datum[xKey])}: ${datum[yLowKey]} - ${datum[yHighKey]}</div>`,
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'right',
            gridLine: {
                enabled: false,
            },
            nice: false,
            min: 100,
            max: 160,
        },
        {
            type: 'time',
            position: 'bottom',
            nice: false,
            label: {
                format: `%b %y`,
            },
            tick: {
                size: 14,
            },
            gridLine: {
                enabled: true,
            },
        },
    ],
    legend: {
        enabled: false,
    },
};

AgCharts.create(options);
