import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';

const formatNumber = (value) => `£${(value / 1e3).toFixed(0)}k`;

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
    formatter: { color: ({ value }) => `£${(Number(value) / 1e3).toFixed(0)}k` },
    title: {
        text: 'Sales department',
    },
    subtitle: {
        text: 'By number of sales and revenue',
    },
};

AgCharts.create(options);
