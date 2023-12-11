import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';

const formatNumber = (value: number) => `£${(value / 1e3).toFixed(0)}k`;

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'sunburst',
            labelKey: 'name',
            sizeKey: 'sales',
            sizeName: 'Sales',
            colorKey: 'revenue',
            colorName: 'Revenue',
        },
    ],
    gradientLegend: {
        scale: {
            label: {
                formatter: ({ value }) => formatNumber(Number(value)),
            },
        },
    },
    title: {
        text: 'Sales department',
    },
    subtitle: {
        text: 'By number of sales and revenue',
    },
};

AgCharts.create(options);
