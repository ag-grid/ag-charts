import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';
import { topology } from './topology';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Access to clean fuels and technologies for cooking',
    },
    data,
    topology,
    series: [
        {
            type: 'map-shape-background',
        },
        {
            type: 'map-shape',
            title: 'Access to Clean Fuels',
            idKey: 'name',
            colorKey: 'value',
            colorName: '% of population',
        },
    ],
    gradientLegend: {
        enabled: true,
        gradient: {
            preferredLength: 200,
        },
        scale: {
            label: {
                formatter: (p) => p.value + '%',
            },
        },
    },
};

AgCharts.create(options);
