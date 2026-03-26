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
import { applyUpdate, getInitialData, getNextSector } from './data';

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
        text: 'Sector Trading Activity',
    },
    series: [
        {
            type: 'bar',
            xKey: 'sector',
            yKey: 'institutional',
            yName: 'Institutional ($M)',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'sector',
            yKey: 'retail',
            yName: 'Retail ($M)',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'sector',
            yKey: 'etfFlows',
            yName: 'ETF Flows ($M)',
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

function addSector() {
    const next = getNextSector(options.data!);
    if (!next) return;
    options.data = [...options.data!, { ...next }];
    chart.update(options);
}

function removeSector() {
    if (options.data!.length <= 2) return;
    options.data = options.data!.slice(0, -1);
    chart.update(options);
}

function updateSectors() {
    options.data = applyUpdate(options.data!);
    chart.update(options);
}
