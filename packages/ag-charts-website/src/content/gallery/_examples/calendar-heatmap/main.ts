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

            strokeWidth: 1,
        },
    ],
    gradientLegend: {
        enabled: false,
    },
    axes: [
        {
            position: 'left',
            type: 'category',
            label: {
                enabled: false,
            },
        },
        {
            position: 'top',
            type: 'category',
            line: {
                enabled: false,
            },
        },
    ],
};

AgCharts.create(options);
