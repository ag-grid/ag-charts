import {
    AgChartOptions,
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

const options: AgChartOptions = {
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
    animation: { enabled: false },
    flashOnUpdate: {
        enabled: true,
    },
};

const chart = AgCharts.create(options);

let updateInterval: ReturnType<typeof setInterval> | null = null;

function update() {
    options.data = applyLiveUpdate(options.data!);
    chart.update(options);
}

function startUpdates() {
    if (updateInterval) return;
    update();
    updateInterval = setInterval(update, 2000);
}

function stopUpdates() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
}

function toggleUpdates() {
    if (updateInterval) {
        stopUpdates();
    } else {
        startUpdates();
    }
    document.getElementById('toggleBtn')!.textContent = updateInterval ? 'Stop Updates' : 'Start Updates';
}
