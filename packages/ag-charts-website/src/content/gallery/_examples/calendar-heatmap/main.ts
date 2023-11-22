import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Weekly Step Count',
    },
    series: [
        {
            type: 'heatmap',

            xKey: 'month',
            xName: 'Month',

            yKey: 'week',
            yName: 'Week',

            colorKey: 'steps',
            colorName: 'Steps',

            colorRange: ['#fc8d59', '#91cf60'],

            strokeWidth: 2,
        },
    ],
    gradientLegend: {
        enabled: false,
    },
};

AgCharts.create(options);
