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

let data = getInitialData();

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data,
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
        fill: '#ffd6a5',
        flashDuration: 300,
        fadeOutDuration: 700,
    },
};

const chart = AgCharts.create(options);

let isRunning = false;
let updateInterval: ReturnType<typeof setInterval> | undefined;

/** inScope */
function update() {
    data = applyLiveUpdate(data);
    options.data = data;
    chart.update(options);
}

/** inScope */
function startUpdates() {
    if (isRunning) return;
    isRunning = true;
    updateButton();
    update();
    updateInterval = setInterval(update, 2000);
}

/** inScope */
function stopUpdates() {
    if (!isRunning) return;
    isRunning = false;
    updateButton();
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = undefined;
    }
}

/** inScope */
function updateButton() {
    const button = document.getElementById('toggleBtn');
    if (button) {
        button.textContent = isRunning ? 'Stop Updates' : 'Start Updates';
    }
}

function toggleUpdates() {
    if (isRunning) {
        stopUpdates();
    } else {
        startUpdates();
    }
}

function setColor(value: string) {
    options.flashOnUpdate!.fill = value;
}

function setFlashDuration(value: string) {
    options.flashOnUpdate!.flashDuration = Number(value);
}

function setFadeDuration(value: string) {
    options.flashOnUpdate!.fadeOutDuration = Number(value);
}
