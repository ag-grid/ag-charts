import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';
import { topology } from './topology';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'World Population',
    },
    topology,
    data,
    series: [
        {
            type: 'map-shape-background',
        },
        {
            type: 'map-shape',
            title: '1 Year Change',
            idKey: 'name',
            colorKey: 'change',
            fill: '#459d55',
            fillOpacity: 0.5,
        },
        {
            type: 'map-marker',
            title: 'Current Population',
            idKey: 'name',
            sizeKey: 'population',
        },
    ],
    legend: {
        enabled: true,
    },
};

AgCharts.create(options);
