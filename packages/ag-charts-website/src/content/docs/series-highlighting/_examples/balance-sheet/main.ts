// main.ts
import {
    AgCartesianChartOptions,
    AgChartLabelStyleOptions,
    AgChartLabelStylerParams,
    AgCharts,
} from 'ag-charts-community';

import { getData } from './data';

function myItemStyler(params: AgChartLabelStylerParams<unknown, unknown>): AgChartLabelStyleOptions {
    switch (params.highlightState) {
        case 'highlighted-series':
            return {};
        case 'highlighted-item':
            return { fontWeight: 'bold' };
        default:
            return { color: 'transparent' };
    }
}

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Company Financials (Balance Sheet Overview)' },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'cash',
            yName: 'Cash',
            highlight: { unhighlightedSeries: { opacity: 0.2 } },
            label: {
                itemStyler: myItemStyler,
            },
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'networth',
            yName: 'Net Worth',
            highlight: { unhighlightedSeries: { opacity: 0.2 } },
            label: {
                itemStyler: myItemStyler,
            },
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'assets',
            yName: 'Assets',
            highlight: { unhighlightedSeries: { opacity: 0.2 } },
            label: {
                itemStyler: myItemStyler,
            },
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'liabilities',
            yName: 'Liabilities',
            highlight: { unhighlightedSeries: { opacity: 0.2 } },
            label: {
                itemStyler: myItemStyler,
            },
        },
    ],
    axes: [
        { type: 'category', position: 'bottom', title: { text: 'Year' } },
        { type: 'number', position: 'left', title: { text: '£ (Millions)' } },
    ],
    tooltip: {
        enabled: false,
    },
    legend: {
        position: 'right',
    },
};

AgCharts.create(options);
