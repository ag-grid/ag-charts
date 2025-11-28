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

import { type ContextType, makeContext } from './context';
import { type DataType, getData } from './data';

ModuleRegistry.registerModules([
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrosshairModule,
    FlashOnUpdateModule,
    LegendModule,
    NumberAxisModule,
]);

const context: ContextType = makeContext();

const options: AgCartesianChartOptions<DataType, ContextType> = {
    container: document.getElementById('myChart'),
    context,
    animation: {
        enabled: false,
    },
    background: { fill: 'transparent' },
    data: context.randomizeData(),
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
            position: 'bottom',
            label: {
                autoRotate: false,
            },
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
};

const chart = AgCharts.create(options);

function flashChart() {
    const chartBackground = document.querySelector('#myChart');
    chartBackground.animate(
        [
            { background: '#cfeeff', offset: 0 },
            { background: '#cfeeff', offset: 0.1 },
            { background: 'transparent', offset: 1 },
        ],
        { duration: 1000, easing: 'ease-out' }
    );
}

function randomize() {
    chart.updateDelta({ data: options.context!.randomizeData() });
    flashChart();
}
