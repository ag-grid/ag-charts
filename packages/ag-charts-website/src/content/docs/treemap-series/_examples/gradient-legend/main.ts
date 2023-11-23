import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'treemap',
            labelKey: 'title',
            sizeKey: 'total',
            sizeName: 'Total',
            colorKey: 'change',
            colorName: 'Change',
            colorRange: ['rgb(234, 82, 80)', 'rgb(67, 153, 83)'],
        },
    ],
    gradientLegend: {
        enabled: true,
    },
    title: {
        text: 'UK Government Budget',
    },
    subtitle: {
        text: '2024',
    },
};

AgCharts.create(options);
