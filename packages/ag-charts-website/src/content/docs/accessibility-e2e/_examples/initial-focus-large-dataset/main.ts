// @ag-skip-fws
import {
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    CrosshairModule,
    LineSeriesModule,
    ModuleRegistry,
    NavigatorModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';
import { AgChartInstance, type AgInitialFocus } from 'ag-charts-types';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    LineSeriesModule,
    NavigatorModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    ZoomModule,
]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Line with 100K datapoints' },
    data: getData(1e5),
    animation: { enabled: false },
    series: [
        { type: 'line', xKey: 'timestamp', yKey: 'open', yName: 'Open' },
        { type: 'line', xKey: 'timestamp', yKey: 'close', yName: 'Close' },
        { type: 'line', xKey: 'timestamp', yKey: 'high', yName: 'High' },
        { type: 'line', xKey: 'timestamp', yKey: 'low', yName: 'Low' },
    ],
    axes: {
        x: { type: 'ordinal-time' },
    },
    zoom: {
        enabled: true,
        axes: 'x',
        autoScaling: { enabled: true },
    },
    navigator: {
        enabled: true,
        miniChart: { enabled: true },
    },
    initialState: {
        zoom: {
            ratioX: {
                start: 0.4,
                end: 0.6,
            },
        },
    },
};

let chart: AgChartInstance = AgCharts.create(options);
let updateMode: 'create' | 'updateDelta' = 'create';

export function onInitialFocusChange(initialFocus: '' | AgInitialFocus) {
    if (initialFocus !== '') {
        if (updateMode === 'create') {
            chart.destroy();
            chart = AgCharts.create({
                ...options,
                keyboard: { initialFocus },
            });
        } else if (updateMode satisfies 'updateDelta') {
            chart.updateDelta({
                keyboard: { initialFocus },
            });
        }
    }
}

export function onUpdateModeChange(newMode: 'create' | 'updateDelta') {
    updateMode = newMode;
}
