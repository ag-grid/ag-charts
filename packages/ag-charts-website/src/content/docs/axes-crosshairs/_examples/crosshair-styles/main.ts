import { BubbleSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BubbleSeriesModule, NumberAxisModule]);
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
            position: 'left',
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
            position: 'bottom',
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
