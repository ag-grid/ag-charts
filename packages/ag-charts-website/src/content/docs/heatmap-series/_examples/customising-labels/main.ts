import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

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

            labelKey: 'temperature',
            secondaryLabelKey: 'change',

            label: {
                fontSize: 12,
                minimumFontSize: 6,
                spacing: 0,
                formatter: ({ value }) => `${value.toFixed(0)}°C`,
            },
            secondaryLabel: {
                fontSize: 8,
                minimumFontSize: 5,
                formatter: ({ value }) => `${value > 0 ? '+' : '-'}${Math.abs(value * 100).toFixed(0)}%`,
            },
            padding: 2,
        },
    ],
};

const chart = AgCharts.create(options);
