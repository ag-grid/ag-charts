// @ag-skip-fws
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    animation: { enabled: false },
    zoom: { enabled: true },
    tooltip: { enabled: false },
    initialState: {
        zoom: { ratioX: { start: 0.4, end: 0.57 } },
    },
    data: getData(),
    series: [{ type: 'line', xKey: 'date', yKey: 'price' }],
    axes: {
        x: {
            type: 'unit-time',
            crossLines: [
                {
                    type: 'range',
                    range: [new Date(2019, 3, 29), new Date(2019, 6, 1)],
                    label: { text: 'Price Peak', position: 'top' },
                },
                {
                    type: 'range',
                    range: [new Date(2019, 8, 2), new Date(2019, 9, 14)],
                    label: { text: 'Autumn', position: 'top' },
                },
            ],
        },
    },
};

const chart = AgCharts.create(options);

// For e2e testing:
(window as any).agE2E = { chart };
