import { LegendModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import {
    AgCartesianChartOptions,
    AgCharts,
    AgTouchOptions,
    AnimationModule,
    CandlestickSeriesModule,
    ContextMenuModule,
    CrosshairModule,
    OrdinalTimeAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CandlestickSeriesModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    ZoomModule,
    ContextMenuModule,
]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(1e3),
    animation: { enabled: false },
    touch: { dragAction: 'none' },
    zoom: {
        enabled: true,
        enableAxisDragging: false,
    },
    initialState: {
        zoom: {
            ratioX: { start: 0.48, end: 0.52 },
            ratioY: { start: 0.15, end: 0.6 },
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

function changeAction(newAction: NonNullable<AgTouchOptions['dragAction']>) {
    if (options.touch) {
        options.touch.dragAction = newAction;
    }
    chart.update(options);
}
