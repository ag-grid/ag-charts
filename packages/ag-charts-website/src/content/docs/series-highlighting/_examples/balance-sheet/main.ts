import { AgCartesianChartOptions, AgChartLabelStylerParams, AgCharts } from 'ag-charts-community';
import {
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Company Financials (Balance Sheet Overview)' },
    data: getData(),
    theme: {
        overrides: {
            line: {
                series: {
                    highlight: { unhighlightedSeries: { opacity: 0.2 } },
                    label: {
                        enabled: true,
                        itemStyler: (params: AgChartLabelStylerParams<unknown, unknown>) => {
                            switch (params.highlightState) {
                                case 'highlighted-series':
                                    return { fontSize: 10 };
                                case 'unhighlighted-item':
                                    return { color: 'lightgray' };
                                case 'highlighted-item':
                                    return { fontWeight: 'bold' };
                                default:
                                    return { color: 'transparent' };
                            }
                        },
                    },
                },
            },
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'cash',
            yName: 'Cash',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'networth',
            yName: 'Net Worth',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'assets',
            yName: 'Assets',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'liabilities',
            yName: 'Liabilities',
        },
    ],
    axes: {
        x: { type: 'category', title: { text: 'Year' } },
        y: { type: 'number', title: { text: '£ (Millions)' } },
    },
    tooltip: {
        enabled: false,
    },
    legend: {
        position: 'right',
    },
};

AgCharts.create(options);
