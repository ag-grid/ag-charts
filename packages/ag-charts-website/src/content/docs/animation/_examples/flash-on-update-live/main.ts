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
    series: [
        {
            type: 'bar',
            xKey: 'region',
            yKey: 'sales',
            yName: 'Sales',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'region',
            yKey: 'returns',
            yName: 'Returns',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'region',
            yKey: 'profit',
            yName: 'Profit',
            stacked: true,
        },
    ],
    axes: {
        x: {
            type: 'category',
        },
    },
    flashOnUpdate: {
        enabled: true,
        item: 'category',
    },
};

const chart = AgCharts.create(options);

let updateInterval: ReturnType<typeof setInterval> | null = null;

function startUpdates() {
    if (updateInterval) return;
    updateInterval = setInterval(() => {
        options.data = applyRandomUpdate(options.data!);
        chart.update(options);
    }, 2000);
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
