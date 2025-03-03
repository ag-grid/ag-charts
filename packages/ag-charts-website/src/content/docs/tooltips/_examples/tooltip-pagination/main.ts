import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { backgroundTopology } from './backgroundTopology';
import { data } from './data';
import { topology } from './topology';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    topology,
    series: [
        {
            type: 'map-shape-background',
            topology: backgroundTopology,
        },
        {
            type: 'map-marker',
            idKey: 'name',
            sizeKey: 'population',
            sizeName: 'Population',
        },
    ],
    tooltip: {
        pagination: true,
    },
};

AgCharts.create(options);
