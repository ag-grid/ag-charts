import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bubble',
            sizeKey: 'planetRadius',
            yKey: 'equilibriumTemp',
            xKey: 'distance',
            stroke: 'white',
            fill: 'rgb(103,105,235)',
            highlightStyle: {
                item: {
                    fill: 'white',
                    stroke: 'rgb(103,105,235)',
                },
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'right',
            title: {
                text: 'Equilibrium Temperature [K]',
            },
            crosshair: {
                label: {
                    className: 'custom-crosshair-label',
                    xOffset: 60,
                },
            },
        },
        {
            type: 'number',
            position: 'bottom',
            title: {
                text: 'Distance [pc]',
            },
            crosshair: {
                label: {
                    className: 'custom-crosshair-label',
                    yOffset: 35,
                },
            },
        },
    ],
};

AgCharts.create(options);
