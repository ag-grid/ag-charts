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
            type: 'map-shape-background',
            topology: backgroundTopology,
        },
        {
            type: 'map-line',
            idKey: 'name',
            sizeKey: 'dailyVehicles',
            sizeName: 'Daily Vehicles',
            strokeWidth: 1,
            maxStrokeWidth: 3,
        },
    ],
};

AgCharts.create(options);
