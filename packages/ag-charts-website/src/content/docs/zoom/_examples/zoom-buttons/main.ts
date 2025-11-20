import { AgCartesianChartOptions, AgCharts, AgZoomButtonsVisible } from 'ag-charts-enterprise';
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
            visible: 'hover',
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

const chart = AgCharts.create(options);

function changeVisible(visible: AgZoomButtonsVisible) {
    options.zoom!.buttons!.visible = visible;
    chart.update(options);
}
