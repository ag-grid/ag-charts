import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

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
            position: 'left',
            title: {
                text: 'Equilibrium Temperature [K]',
            },
            crosshair: {
                label: {
                    xOffset: -55,
                },
            },
        },
        x: {
            type: 'number',
            position: 'bottom',
            title: {
                text: 'Planet Radius [Earth Radius]',
            },
            crosshair: {
                label: {
                    yOffset: 40,
                },
            },
        },
    },
};

AgCharts.create(options);
