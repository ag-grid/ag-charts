import { AgChartOptions, AgCharts } from 'ag-charts-community';
import {
    AreaSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';


ModuleRegistry.registerModules([AreaSeriesModule, CategoryAxisModule, NumberAxisModule]);
var data = [
    { quarter: 'Q1', coffee: 450, tea: 270, milk: 180 },
    { quarter: 'Q2', coffee: 560, tea: 380, milk: 170 },
    { quarter: 'Q3', coffee: 600, tea: 450, milk: 190 },
    { quarter: 'Q4', coffee: 700, tea: 520, milk: 200 },
];

const options: AgChartOptions = {
    data: data,
    container: document.getElementById('myChart'),
    theme: {
        overrides: {
            area: {
                series: {
                    highlight: {
                        highlightedItem: {
                            fill: 'yellow',
                            stroke: 'gold',
                            strokeWidth: 2,
                        },
                        unhighlightedItem: {
                            fill: 'maroon',
                            strokeWidth: 0,
                        },
                        highlightedSeries: {
                            fill: 'red',
                            stroke: 'maroon',
                            strokeWidth: 2,
                        },
                        unhighlightedSeries: {
                            opacity: 0.2,
                        },
                    },
                },
            },
        },
    },
    title: {
        text: 'Beverage Expenses',
    },
    subtitle: {
        text: 'per quarter',
    },
    footnote: {
        text: 'Based on a sample size of 200 respondents',
    },
    series: [
        {
            type: 'area',
            xKey: 'quarter',
            yKey: 'coffee',
            yName: 'Coffee',
            marker: { enabled: true, size: 10 },
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'quarter',
            yKey: 'tea',
            yName: 'Tea',
            marker: { enabled: true, size: 10 },
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'quarter',
            yKey: 'milk',
            yName: 'Milk',
            marker: { enabled: true, size: 10 },
            stacked: true,
        },
    ],
};

AgCharts.create(options);
