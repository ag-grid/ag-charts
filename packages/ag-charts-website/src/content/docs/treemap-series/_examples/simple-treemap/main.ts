import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'treemap',
            labelKey: 'name',
        },
    ],
    title: {
        text: 'Organizational Chart',
    },
    subtitle: {
        text: 'of a top secret startup',
    },
};

AgCharts.create(options);
