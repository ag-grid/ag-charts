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
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    NavigatorModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    NavigatorModule,
    NumberAxisModule,
    UnitTimeAxisModule,
    ZoomModule,
    ContextMenuModule,
]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(800),
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'price',
            marker: {
                enabled: false,
            },
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            parentLevel: {
                enabled: true,
            },
        },
    },
    zoom: {
        enabled: true,
    },
    navigator: {
        enabled: true,
    },
    initialState: {
        zoom: {
            ratioX: { start: 0.95, end: 1 },
        },
    },
};

const chart = AgCharts.create(options);

function zoomOut() {
    chart.setState({
        version: '11.0.0',
        zoom: {
            ratioX: { start: 0, end: 1 },
        },
    });
}

function zoomMonth() {
    chart.setState({
        version: '11.0.0',
        zoom: {
            ratioX: { start: 0.95, end: 1 },
        },
    });
}
