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
            latitudeKey: 'lat',
            longitudeKey: 'lon',
            sizeKey: 'count',
            marker: {
                size: 3,
                maxSize: 50,
            },
            background: {
                topology: backgroundTopology,
                id: 'Surrey',
            },
        },
    ],
};

AgCharts.create(options);
