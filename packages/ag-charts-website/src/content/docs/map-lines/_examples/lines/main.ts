import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';
import { topology } from './topology';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'UK Motorways',
    },
    data,
    topology,
    series: [
        {
            type: 'map',
            idKey: 'name',
        },
    ],
};

AgCharts.create(options);
