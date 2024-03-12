import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { backgroundTopology } from './backgroundTopology';
import { data } from './data';
import { topology } from './topology';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'UK Cities',
    },
    data,
    topology,
    series: [
        {
            type: 'map-shape-accessory',
            topology: backgroundTopology,
        },
        {
            type: 'map-marker',
            idKey: 'name',
        },
    ],
};

AgCharts.create(options);
