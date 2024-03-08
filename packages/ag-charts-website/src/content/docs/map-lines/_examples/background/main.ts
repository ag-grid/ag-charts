import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { backgroundTopology } from './backgroundTopology';
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
            type: 'map-line',
            idKey: 'name',
            background: {
                topology: backgroundTopology,
                id: 'United Kingdom',
            },
        },
    ],
};

AgCharts.create(options);
