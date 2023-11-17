import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Product Export and Import Amounts by Country',
    },
    subtitle: {
        text: 'Trade Activities Across Selected Products',
        spacing: 30,
    },
    footnote: {
        text: '2023 import and export amounts in USD based on international trade records',
        spacing: 30,
    },
    series: Object.entries(getData()).map(([country, data]) => ({
        data,
        type: 'range-bar',
        direction: 'horizontal',
        xKey: 'product',
        xName: 'Smartphone',
        yLowKey: 'exportAmount',
        yHighKey: 'importAmount',
        yLowName: 'Lowest Cost',
        yHighName: 'Highest Cost',
        yName: country,
    })),
    axes: [
        {
            type: 'category',
            position: 'right',
            groupPaddingInner: 0.2,
            paddingInner: 0.5,
            paddingOuter: 0.8,
            line: {
                width: 0,
            },
            gridLine: {
                enabled: true,
            },
        },
        {
            type: 'number',
            position: 'top',
            nice: false,
            min: 0,
            max: 35000000,
            tick: {
                values: [3000000, 32000000],
            },
            label: {
                formatter: ({ value }) => `${value / 1000000}M`,
            },
        },
    ],
};

AgCharts.create(options);
