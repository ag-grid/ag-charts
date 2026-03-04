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
        color: '#ffd6a5',
        flashDuration: 300,
        fadeDuration: 700,
    },
};

const chart = AgCharts.create(options);

function randomize() {
    options.data = getRandomizedData();
    chart.update(options);
}

function setColor(value: string) {
    options.flashOnUpdate!.color = value;
    options.data = getRandomizedData();
    chart.update(options);
}

function setFlashDuration(value: string) {
    options.flashOnUpdate!.flashDuration = Number(value);
    options.data = getRandomizedData();
    chart.update(options);
}

function setFadeDuration(value: string) {
    options.flashOnUpdate!.fadeDuration = Number(value);
    options.data = getRandomizedData();
    chart.update(options);
}
