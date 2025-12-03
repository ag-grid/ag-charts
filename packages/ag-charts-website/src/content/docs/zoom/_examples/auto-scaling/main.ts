import {
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    CandlestickSeriesModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    NavigatorModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CandlestickSeriesModule,
    CrosshairModule,
    LegendModule,
    NavigatorModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    ZoomModule,
    ContextMenuModule,
]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(1e3),
    animation: { enabled: false },
    zoom: {
        enabled: true,
        anchorPointX: 'pointer',
        anchorPointY: 'pointer',
        autoScaling: {
            enabled: true,
        },
    },
    navigator: {
        enabled: true,
        miniChart: {
            enabled: true,
        },
    },
    series: [
        {
            type: 'candlestick',
            xKey: 'timestamp',
            lowKey: 'low',
            highKey: 'high',
            openKey: 'open',
            closeKey: 'close',
        },
    ],
};

const chart = AgCharts.create(options);

function setAutoScaling(enabled: boolean) {
    options.zoom!.autoScaling!.enabled = enabled;
    chart.update(options);
}
