import { AgCharts } from 'ag-charts-enterprise';
import type { AgCartesianChartOptions, AgZoomEvent } from 'ag-charts-types';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    animation: { enabled: false },
    zoom: {
        enableAxisDragging: false,
        enablePanning: false,
        enableScrolling: false,
        enableSelecting: true,
    },
    tooltip: {
        enabled: false,
    },
    axes: {
        y: {
            type: 'number',
            interval: {
                minSpacing: 80,
                maxSpacing: 120,
            },
        },
        x: {
            type: 'number',
            nice: false,
            interval: {
                minSpacing: 80,
                maxSpacing: 120,
            },
            label: {
                autoRotate: false,
            },
        },
    },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'spending',
        },
    ],
    listeners: {
        zoom: (event: AgZoomEvent) => {
            events.push(event);
        },
    },
};

const chart = AgCharts.create(options);
let events: AgZoomEvent[] = [];

function popEvents(): AgZoomEvent[] {
    const result = events;
    events = [];
    return result;
}

// For e2e testing:
(window as any).agE2E = { chart, popEvents };
