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

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getInitialData(),
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
    animation: { enabled: false },
    flashOnUpdate: {
        enabled: true,
        item: 'category',
    },
};

const chart = AgCharts.create(options);

let updateInterval: ReturnType<typeof setInterval> | null = null;

function update() {
    options.data = applyRandomUpdate(options.data!);
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
