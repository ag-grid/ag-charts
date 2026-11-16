import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    AnnotationsModule,
    CandlestickSeriesModule,
    ChartToolbarModule,
    ContextMenuModule,
    CrosshairModule,
    ModuleRegistry,
    NumberAxisModule,
    TimeAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    AnnotationsModule,
    CandlestickSeriesModule,
    ChartToolbarModule,
    ContextMenuModule,
    CrosshairModule,
    NumberAxisModule,
    TimeAxisModule,
]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'S&P 500',
    },
    subtitle: {
        text: 'Draw a line near a candlestick, with the magnet on',
    },
    series: [
        {
            type: 'candlestick',
            xKey: 'date',
            xName: 'Date',
            lowKey: 'low',
            highKey: 'high',
            openKey: 'open',
            closeKey: 'close',
        },
    ],
    axes: {
        x: { type: 'time' },
        y: { type: 'number' },
    },
    annotations: {
        enabled: true,
        magnet: {
            enabled: true,
            mode: 'weak',
            range: 30,
        },
        toolbar: {
            buttons: [
                { icon: 'magnet', tooltip: 'toolbarAnnotationsMagnet', value: 'magnet' },
                { icon: 'trend-line-drawing', tooltip: 'toolbarAnnotationsLineAnnotations', value: 'line-menu' },
                { icon: 'delete', tooltip: 'toolbarAnnotationsClearAll', value: 'clear' },
            ],
        },
    },
};

const chart = AgCharts.create(options);

function setWeak() {
    chart.updateDelta({ annotations: { magnet: { mode: 'weak' } } });
}

function setStrong() {
    chart.updateDelta({ annotations: { magnet: { mode: 'strong' } } });
}
