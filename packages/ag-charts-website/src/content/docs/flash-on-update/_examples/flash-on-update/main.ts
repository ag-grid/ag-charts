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
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
} from 'ag-charts-enterprise';

import { DataType, getData, random } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
]);

// Series type data options
let start = [
    120, 150, 130, 140, 80, 120, 150, 130, 140, 80, 120, 150, 130, 140, 80, 120, 150, 130, 140, 80, 120, 150, 130, 140,
    80,
];
let variance = 20;
let offset = 0;
let length = 8;
let seed = 1234;

const barOptions = {
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
    axes: [
        {
            type: 'number',
            position: 'left',
        },
        {
            type: 'category',
            position: 'bottom',
            label: {
                autoRotate: false,
            },
        },
    ],
};

let options = {
    container: document.getElementById('myChart'),
    animation: {
        enabled: false,
    },
    background: { fill: 'transparent' },
    data: getGeneratedData(),
    ...barOptions,
};

// Create chart
const chart = AgCharts.create(options);

function getGeneratedData() {
    return getData(start, variance, offset, length, seed);
}

const chartBackground = document.querySelector('#myChart');

function flashChart() {
    chartBackground.animate(
        [
            { background: '#cfeeff', offset: 0 },
            { background: '#cfeeff', offset: 0.1 },
            { background: 'transparent', offset: 1 },
        ],
        { duration: 1000, easing: 'ease-out' }
    );
}

function bounceChart() {
    chartBackground.animate([{ transform: 'scale(1.01)', offset: 0.15 }, { transform: 'scale(1)' }], { duration: 777 });
}

function update() {
    seed = Math.floor(random() * 1000);
    chart.updateDelta({ data: getGeneratedData() });
    flashChart();
    // bounceChart();
}
