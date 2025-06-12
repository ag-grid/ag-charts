import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { DataType, getData } from './data';

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'GDP by country in billions of USD (2018)',
    },
    data: getData(),
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
