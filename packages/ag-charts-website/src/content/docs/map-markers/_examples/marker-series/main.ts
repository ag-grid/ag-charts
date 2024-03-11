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
            latitudeKey: 'lat',
            longitudeKey: 'lon',
        },
    ],
};

AgCharts.create(options);
