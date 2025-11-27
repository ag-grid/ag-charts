import { AgChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

import { data } from './data';
import { topology } from './topology';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
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
        position: {
            placement: 'left-bottom',
            floating: true,
            xOffset: 300,
            yOffset: -30,
        },
        gradient: {
            preferredLength: 150,
            thickness: 4,
        },
        scale: {
            padding: 30,
            label: {
                fontSize: 10,
                formatter: (p) => p.value + '%',
            },
        },
    },
};

AgCharts.create(options);
