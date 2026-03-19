import {
    AgCartesianChartOptions,
    AgCharts,
    CandlestickSeriesModule,
    ContextMenuModule,
    CrosshairModule,
    FlashOnUpdateModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    OrdinalTimeAxisModule,
} from 'ag-charts-enterprise';

import { applyLiveUpdate, getInitialData } from './data';

ModuleRegistry.registerModules([
    CandlestickSeriesModule,
    ContextMenuModule,
    CrosshairModule,
    FlashOnUpdateModule,
    LegendModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getInitialData(),
    title: {
        text: 'AAPL Stock Price',
    },
    series: [
        {
            type: 'candlestick',
            xKey: 'date',
            xName: 'Date',
            openKey: 'open',
            highKey: 'high',
            lowKey: 'low',
            closeKey: 'close',
        },
    ],
    axes: {
        y: {
            type: 'number',
            label: {
                formatter: ({ value }) => `$${Number(value).toFixed(0)}`,
            },
        },
    },
    flashOnUpdate: {
        enabled: true,
    },
};

const chart = AgCharts.create(options);

function update() {
    options.data = applyLiveUpdate(options.data!);
    chart.update(options);
}
