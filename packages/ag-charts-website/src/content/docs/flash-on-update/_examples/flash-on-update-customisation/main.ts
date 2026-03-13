import {
    AgCartesianChartOptions,
    AgCharts,
    ContextMenuModule,
    CrosshairModule,
    FlashOnUpdateModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    OhlcSeriesModule,
    OrdinalTimeAxisModule,
} from 'ag-charts-enterprise';

import { applyLiveUpdate, getInitialData } from './data';

ModuleRegistry.registerModules([
    ContextMenuModule,
    CrosshairModule,
    FlashOnUpdateModule,
    LegendModule,
    NumberAxisModule,
    OhlcSeriesModule,
    OrdinalTimeAxisModule,
]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getInitialData(),
    title: {
        text: 'MSFT Stock Price',
    },
    series: [
        {
            type: 'ohlc',
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
        color: '#ffd6a5',
        flashDuration: 300,
        fadeOutDuration: 700,
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

function setColor(value: string) {
    options.flashOnUpdate!.color = value;
}

function setFlashDuration(value: string) {
    options.flashOnUpdate!.flashDuration = Number(value);
}

function setFadeDuration(value: string) {
    options.flashOnUpdate!.fadeOutDuration = Number(value);
}
