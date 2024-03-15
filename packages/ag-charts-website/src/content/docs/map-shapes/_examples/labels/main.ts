import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';
import { topology } from './topology';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'American States',
    },
    data,
    topology,
    series: [
        {
            type: 'map-shape',
            idKey: 'name',
            labelKey: 'code',
        },
    ],
};

AgCharts.create(options);
