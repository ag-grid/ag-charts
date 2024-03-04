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
            // @ts-ignore
            type: 'map-marker',
            latKey: 'lat',
            lonKey: 'lon',
            sizeKey: 'count',
            sizeName: 'Count',
            background: {
                topology: backgroundTopology,
                id: 'Surrey',
            },
            marker: {
                size: 3,
                maxSize: 50,
            },
        },
    ],
};

AgCharts.create(options);
