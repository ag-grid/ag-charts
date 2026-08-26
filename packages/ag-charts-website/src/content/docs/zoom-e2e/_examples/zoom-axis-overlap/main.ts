import { AgCartesianChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    zoom: {
        enabled: true,
        // Inertia carries a pan on past the pointer for a wall-clock duration, so where it settles is
        // not reproducible. Panning stops with the drag here.
        deceleration: 'off',
    },
    axes: {
        x: {
            type: 'category',
            crossAt: { value: 35, crosshairLabelPlacement: 'crossing' },
            title: { text: 'Index' },
            line: {
                stroke: 'black',
            },
            paddingOuter: 0,
        },
        y: {
            type: 'number',
            crossAt: { value: 5, crosshairLabelPlacement: 'crossing' },
            title: { text: 'Value' },
            line: {
                stroke: 'black',
            },
        },
    },
    series: [
        {
            type: 'bar',
            xKey: 'x',
            yKey: 'y',
        },
    ],
};

AgCharts.create(options);
