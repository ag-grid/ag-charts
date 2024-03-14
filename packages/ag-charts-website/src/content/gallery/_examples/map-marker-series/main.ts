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
            type: 'map-shape-background',
            topology: backgroundTopology,
        },
        {
            type: 'map-marker',
            latitudeKey: 'lat',
            longitudeKey: 'lon',
            sizeKey: 'count',
            size: 3,
            maxSize: 50,
        },
    ],
};

AgCharts.create(options);
