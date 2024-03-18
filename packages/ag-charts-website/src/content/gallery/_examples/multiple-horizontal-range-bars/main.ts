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
        xName: 'Product',
        yLowKey: 'exportAmount',
        yHighKey: 'importAmount',
        yLowName: 'Lowest Cost',
        yHighName: 'Highest Cost',
        yName: country,
        cornerRadius: 2,
    })),
    axes: [
        {
            type: 'category',
            position: 'right',
            groupPaddingInner: 0.2,
            paddingInner: 0.5,
            paddingOuter: 0.8,
            line: {
                enabled: false,
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
            crosshair: {
                snap: true,
                label: {
                    renderer: ({ value }) =>
                        `<div style="padding: 0 7px; border-radius: 2px; line-height: 1.7em; background-color: rgb(71,71,71); color: rgb(255, 255, 255);">${Math.round(value / 1000000)}M</div>`,
                },
            },
        },
    ],
};

AgCharts.create(options);
