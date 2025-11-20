import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';
import {
    LineSeriesModule,
    NumberAxisModule,
    UnitTimeAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';
import { ZoomModule } from 'ag-charts-enterprise';

import { getData } from './data';


ModuleRegistry.registerModules([LineSeriesModule, NumberAxisModule, UnitTimeAxisModule, ZoomModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    zoom: {
        enabled: true,
        buttons: {
            visible: 'always',
            buttons: [
                {
                    icon: 'zoom-in',
                    tooltip: 'Decrease Visible Range',
                    value: 'zoom-in',
                    label: 'In',
                    section: 'zoom',
                },
                {
                    icon: 'zoom-out',
                    tooltip: 'Increase Visible Range',
                    value: 'zoom-out',
                    label: 'Out',
                    section: 'zoom',
                },
                {
                    icon: 'pan-start',
                    tooltip: 'Pan to Start',
                    value: 'pan-start',
                    section: 'pan',
                },
                {
                    icon: 'pan-end',
                    tooltip: 'Pan to End',
                    value: 'pan-end',
                    section: 'pan',
                },
                {
                    tooltip: 'Undo all Zoom',
                    value: 'reset',
                    label: 'Reset',
                    section: 'reset',
                },
            ],
        },
    },
    tooltip: {
        enabled: false,
    },
    axes: {
        y: {
            type: 'number',
            position: 'left',
        },
        x: {
            type: 'unit-time',
            position: 'bottom',
            interval: {
                minSpacing: 50,
                maxSpacing: 200,
            },
            label: {
                autoRotate: false,
            },
            crosshair: {
                label: {
                    format: `%d %b %Y`,
                },
            },
        },
    },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'price',
        },
    ],
};

AgCharts.create(options);
