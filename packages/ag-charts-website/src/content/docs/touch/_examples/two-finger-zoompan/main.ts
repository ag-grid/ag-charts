import { LegendModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';
import { ZoomModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([LegendModule, LineSeriesModule, NumberAxisModule, ZoomModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    animation: { enabled: false },
    touch: {
        dragAction: 'none',
    },
    zoom: {
        enableDoubleClickToReset: false,
        enableTwoFingerZoom: true,
    },
    initialState: {
        zoom: {
            ratioX: { start: 0.48, end: 0.52 },
            ratioY: { start: 0.21, end: 0.82 },
        },
    },
    tooltip: {
        enabled: false,
    },
    axes: {
        y: {
            type: 'number',
            position: 'left',
            interval: {
                minSpacing: 80,
                maxSpacing: 120,
            },
        },
        x: {
            type: 'number',
            position: 'bottom',
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
};

const chart = AgCharts.create(options);

function setEnabled(enabled: boolean) {
    if (options.zoom) {
        options.zoom.enableTwoFingerZoom = enabled;
    }
    chart.update(options);
}
