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
            yKey: 'equilibriumTemp',
            yName: 'Equilibrium Temperature',
            xKey: 'planetRadius',
            xName: 'Planet Radius',
        },
    ],
    axes: {
        y: {
            type: 'number',
            position: 'right',
            title: {
                text: 'Equilibrium Temperature [K]',
            },
            crosshair: {
                label: {
                    xOffset: 50,
                },
            },
        },
        x: {
            type: 'number',
            title: {
                text: 'Distance [pc]',
            },
            crosshair: {
                label: {
                    yOffset: 35,
                },
            },
        },
    },
};

AgCharts.create(options);
