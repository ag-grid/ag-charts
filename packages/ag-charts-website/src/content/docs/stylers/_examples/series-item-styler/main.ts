import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { DataType } from './data';

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'GDP by country in billions of USD (2018)',
    },
    data: [
        {
            country: 'Spain',
            gdp: 1419,
        },
        {
            country: 'UK',
            gdp: 2855,
        },
        {
            country: 'Germany',
            gdp: 3948,
        },
        {
            country: 'France',
            gdp: 2778,
        },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'country',
            yKey: 'gdp',
            showInLegend: false,
            itemStyler: ({ datum: { country }, fill, highlighted }) => {
                return {
                    fill: country === 'UK' ? (highlighted ? 'lime' : 'red') : fill,
                };
            },
        },
    ],
};

AgCharts.create(options);
