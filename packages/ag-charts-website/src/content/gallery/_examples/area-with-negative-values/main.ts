import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Changes in UK Energy Stock',
    },
    footnote: {
        text: 'Source: Department for Business, Energy & Industrial Strategy',
    },
    series: [
        {
            type: 'area',
            xKey: 'quarter',
            yKey: 'naturalGas',
            yName: 'Natural gas',
        },
        {
            type: 'area',
            xKey: 'quarter',
            yKey: 'coal',
            yName: 'Coal',
        },
        {
            type: 'area',
            xKey: 'quarter',
            yKey: 'primaryOil',
            yName: 'Primary oil',
        },
        {
            type: 'area',
            xKey: 'quarter',
            yKey: 'petroleum',
            yName: 'Petroleum',
        },
        {
            type: 'area',
            xKey: 'quarter',
            yKey: 'manufacturedFuels',
            yName: 'Manufactured fuels',
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
            title: {
                text: 'Thousand Tonnes of Oil Equivalent',
            },
        },
    ],
};

AgCharts.create(options);
