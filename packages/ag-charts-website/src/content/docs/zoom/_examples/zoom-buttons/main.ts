import {
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-community';
import {
    AgCartesianChartOptions,
    AgCharts,
    AgZoomButtonsVisible,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    UnitTimeAxisModule,
    ZoomModule,
    ContextMenuModule,
]);
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
        x: {
            type: 'unit-time',
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
