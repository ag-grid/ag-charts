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
    series: [
        {
            // @ts-ignore
            type: 'map',
            topology,
            idKey: 'name',
            strokeWidth: 1,
            background: {
                topology: backgroundTopology,
                id: 'United Kingdom',
                fillOpacity: 0.2,
                strokeWidth: 0,
            },
        },
    ],
};

AgCharts.create(options);
