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
import { getRandomizedData } from './data';

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
    animation: {
        enabled: false,
    },
    background: { fill: 'transparent' },
    data: getRandomizedData(),
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'one',
            yName: 'One',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'two',
            yName: 'Two',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'three',
            yName: 'Three',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'four',
            yName: 'Four',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'five',
            yName: 'Five',
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
    },
} as any; /* documented flashOnUpdate option */

const chart = AgCharts.create(options);

function randomize() {
    options.data = getRandomizedData();
    chart.update(options);
}
