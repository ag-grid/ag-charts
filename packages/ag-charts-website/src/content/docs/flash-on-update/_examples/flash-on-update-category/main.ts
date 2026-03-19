import {
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';
import {
    AgCartesianChartOptions,
    AgCharts,
    ContextMenuModule,
    CrosshairModule,
    FlashOnUpdateModule,
} from 'ag-charts-enterprise';

import type { DataType } from './data';
import { applyRandomUpdate, getInitialData } from './data';

ModuleRegistry.registerModules([
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrosshairModule,
    FlashOnUpdateModule,
    LegendModule,
    NumberAxisModule,
]);

let data: DataType[] = getInitialData();

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'Stock Trading Volume',
    },
    series: [
        {
            type: 'bar',
            xKey: 'ticker',
            yKey: 'buyVolume',
            yName: 'Buy Volume (M)',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'ticker',
            yKey: 'sellVolume',
            yName: 'Sell Volume (M)',
            stacked: true,
        },
    ],
    axes: {
        x: {
            type: 'category',
            label: {
                autoRotate: false,
            },
        },
    },
    flashOnUpdate: {
        enabled: true,
        item: 'category',
    },
};

const chart = AgCharts.create(options);

let isRunning = false;
let updateInterval: ReturnType<typeof setInterval> | undefined;

/** inScope */
function update() {
    data = applyRandomUpdate(data);
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
