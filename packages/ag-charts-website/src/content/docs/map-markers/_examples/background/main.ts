import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { backgroundTopology } from './backgroundTopology';
import { data } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Crime in Surrey',
    },
    data,
    series: [
        {
            type: 'map-marker',
            latKey: 'lat',
            lonKey: 'lon',
            background: {
                topology: backgroundTopology,
                id: 'Surrey',
            },
        },
    ],
};

AgCharts.create(options);
