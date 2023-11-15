import { AgChart, AgChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'UK monthly mean temperature °C',
    },
    series: [
        {
            type: 'heatmap',

            xKey: 'month',
            xName: 'Month',

            yKey: 'year',
            yName: 'Year',

            colorKey: 'temperature',
            colorName: 'Temperature',

            label: {
                enabled: true,
                formatter: ({ datum, colorKey = '' }) => {
                    const value = datum[colorKey];
                    return `${value.toFixed(0)}°C`;
                },
            },
        },
    ],
};

const chart = AgChart.create(options);
