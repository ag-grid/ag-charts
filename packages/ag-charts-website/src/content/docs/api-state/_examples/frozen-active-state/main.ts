import {
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    CandlestickSeriesModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    TimeAxisModule,
} from 'ag-charts-enterprise';

import { TradeDatum, getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CandlestickSeriesModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    TimeAxisModule,
]);

const options: AgCartesianChartOptions<TradeDatum> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Ethereum Prices',
    },
    data: getData(),
    series: [
        {
            type: 'candlestick',
            xKey: 'date',
            openKey: 'open',
            highKey: 'high',
            lowKey: 'low',
            closeKey: 'close',
        },
    ],
    axes: {
        x: {
            type: 'time',
        },
        y: {
            type: 'number',
            label: {
                format: '$#{.2f}',
            },
        },
    },
};

const chart = AgCharts.create(options);
