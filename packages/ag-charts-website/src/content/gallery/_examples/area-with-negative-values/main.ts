import {
    AgCartesianChartOptions,
    AgCharts,
    AreaSeriesModule,
    ContextMenuModule,
    GroupedCategoryAxisModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([AreaSeriesModule, GroupedCategoryAxisModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'SaaS Startup Journey to Profitability',
    },
    subtitle: {
        text: 'From Launch Losses to Sustainable Growth (2022-2024)',
    },
    footnote: {
        text: 'Source: Corporate Financial Reports',
    },
    tooltip: {
        mode: 'shared',
    },
    formatter: {
        y: ({ value }) => `${value.toLocaleString()}`,
    },
    series: [
        {
            type: 'area',
            xKey: 'quarter',
            xName: 'Quarter',
            yKey: 'productRevenue',
            yName: 'Product Revenue',
            fillOpacity: 0.7,
            strokeWidth: 2,
        },
        {
            type: 'area',
            xKey: 'quarter',
            xName: 'Quarter',
            yKey: 'serviceRevenue',
            yName: 'Service Revenue',
            fillOpacity: 0.7,
            strokeWidth: 2,
        },
        {
            type: 'area',
            xKey: 'quarter',
            xName: 'Quarter',
            yKey: 'operatingCosts',
            yName: 'Operating Costs',
            fillOpacity: 0.7,
            strokeWidth: 2,
        },
        {
            type: 'area',
            xKey: 'quarter',
            xName: 'Quarter',
            yKey: 'rdInvestment',
            yName: 'R&D Investment',
            fillOpacity: 0.7,
            strokeWidth: 2,
        },
    ],
    axes: {
        x: {
            type: 'grouped-category',
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
            label: { rotation: 0 },
            crossLines: [
                {
                    type: 'range',
                    range: [
                        ['2022', 'Q1'],
                        ['2022', 'Q3'],
                    ],
                    fillOpacity: 0,
                    label: {
                        text: 'Launch Phase',
                        position: 'inside-bottom',
                    },
                },
                {
                    type: 'range',
                    range: [
                        ['2022', 'Q4'],
                        ['2023', 'Q1'],
                    ],
                    fillOpacity: 0,
                    label: {
                        text: 'Product-Market Fit',
                        position: 'inside-bottom',
                    },
                },
                {
                    type: 'range',
                    range: [
                        ['2023', 'Q2'],
                        ['2023', 'Q3'],
                    ],
                    fillOpacity: 0,
                    label: {
                        text: 'Funding &\nDownturn',
                        position: 'inside-bottom',
                    },
                },
                {
                    type: 'range',
                    range: [
                        ['2023', 'Q4'],
                        ['2024', 'Q4'],
                    ],
                    fillOpacity: 0,
                    label: {
                        text: 'Scale & Profitability',
                        position: 'inside-bottom',
                    },
                },
                {
                    type: 'line',
                    value: ['2023', 'Q2'],
                    strokeWidth: 2,
                    lineDash: [6, 4],
                    label: {
                        text: 'Break Even',
                        position: 'top',
                    },
                },
            ],
        },
        y: {
            type: 'number',
            title: {
                text: 'USD (Thousands)',
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
        },
    },
};

AgCharts.create(options);
