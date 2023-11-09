import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Daily Step Count',
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

            strokeWidth: 2,
        },
    ],
    gradientLegend: {
        enabled: false,
    },
};

AgEnterpriseCharts.create(options);
