import {
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    BubbleSeriesModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    BubbleSeriesModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    ContextMenuModule,
]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bubble',
            sizeKey: 'planetRadius',
            sizeName: 'Planet Radius',
            yKey: 'eccentricity',
            yName: 'Eccentricity',
            xKey: 'distance',
            xName: 'Distance',
        },
    ],
    axes: {
        y: {
            type: 'number',
            title: {
                text: 'Eccentricity',
            },
            crosshair: {
                stroke: '#2b5c95',
                strokeWidth: 2,
                lineDash: [5, 10],
            },
        },
        x: {
            type: 'number',
            title: {
                text: 'Distance [pc]',
            },
            crosshair: {
                stroke: '#2b5c95',
                strokeWidth: 2,
                lineDash: [5, 10],
            },
        },
    },
};

AgCharts.create(options);
