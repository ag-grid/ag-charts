// @ag-skip-fws
import {
    AgCartesianAxisCrossAtPlacement,
    AgCartesianChartOptions,
    AgCharts,
    CrosshairModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([CrosshairModule, LineSeriesModule, NumberAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Axes crossing at 0' },
    data: getData(),
    axes: {
        x: {
            type: 'number',
            title: { text: 'X Axis' },
            crossAt: { value: 0 },
            // `snap: false` pins the label to the pointer, so a captured position is reproducible.
            crosshair: { enabled: true, snap: false },
        },
        y: {
            type: 'number',
            title: { text: 'Y Axis' },
            crossAt: { value: 0 },
            crosshair: { enabled: true, snap: false },
        },
    },
    series: [{ type: 'line', xKey: 'x', yKey: 'y', marker: { enabled: false } }],
};

const chart = AgCharts.create(options);

function setTitlePlacement(placement: AgCartesianAxisCrossAtPlacement) {
    options.axes!.x!.crossAt!.titlePlacement = placement;
    options.axes!.y!.crossAt!.titlePlacement = placement;
    chart.update(options);
}

function setLabelPlacement(placement: AgCartesianAxisCrossAtPlacement) {
    options.axes!.x!.crossAt!.labelPlacement = placement;
    options.axes!.y!.crossAt!.labelPlacement = placement;
    chart.update(options);
}

function setCrosshairLabelPlacement(placement: AgCartesianAxisCrossAtPlacement) {
    options.axes!.x!.crossAt!.crosshairLabelPlacement = placement;
    options.axes!.y!.crossAt!.crosshairLabelPlacement = placement;
    chart.update(options);
}
