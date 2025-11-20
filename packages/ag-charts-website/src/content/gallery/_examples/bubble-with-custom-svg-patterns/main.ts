import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';
import { BubbleSeriesModule, NumberAxisModule, ModuleRegistry } from 'ag-charts-community';

import { asteroid, getData } from './data';


ModuleRegistry.registerModules([BubbleSeriesModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Meteorite Landings in the Sahara: Location vs. Mass',
    },
    series: [
        {
            type: 'bubble',
            title: 'Meteorites',
            xKey: 'longitude',
            yKey: 'latitude',
            sizeKey: 'mass',
            maxSize: 60,
            strokeWidth: 0,
            fill: {
                type: 'pattern',
                path: asteroid,
                width: 60,
                height: 60,
                stroke: 'gray',
            },
        },
    ],
    animation: {
        enabled: false,
    },
    axes: {
        x: {
            type: 'number',
            position: 'bottom',
            title: { text: 'Longitude' },
            interval: {
                step: 0.1,
            },
        },
        y: {
            type: 'number',
            position: 'left',
            title: { text: 'Latitude' },
            interval: {
                step: 0.1,
            },
        },
    },
};

AgCharts.create(options);
