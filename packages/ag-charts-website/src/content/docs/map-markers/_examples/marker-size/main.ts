import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

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
            sizeKey: 'count',
            sizeName: 'Count',
            marker: {
                size: 3,
                maxSize: 50,
            },
        },
    ],
};

AgCharts.create(options);
