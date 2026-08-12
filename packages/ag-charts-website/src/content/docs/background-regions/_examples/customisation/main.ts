import {
    AgCartesianChartOptions,
    AgCharts,
    BackgroundRegionsModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    ScatterSeriesModule,
} from 'ag-charts-enterprise';

import { penguinSeries } from './data';

ModuleRegistry.registerModules([BackgroundRegionsModule, LegendModule, NumberAxisModule, ScatterSeriesModule]);

function quantileSorted(sorted: number[], p: number) {
    const i = (sorted.length - 1) * p;
    const lo = Math.floor(i);
    const hi = Math.ceil(i);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

function percentileRange(values: number[], coverage = 0.8) {
    if (!values.length) return { start: NaN, end: NaN };
    const sorted = [...values].sort((a, b) => a - b);
    const tail = (1 - coverage) / 2;
    return { start: quantileSorted(sorted, tail), end: quantileSorted(sorted, 1 - tail) };
}

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Penguin Size',
    },
    seriesArea: {
        backgroundRegions: [
            {
                fill: '#5090dc',
                fillOpacity: 0.2,
                stroke: '#2b5c95',
                strokeWidth: 2,
                xRange: percentileRange(penguinSeries.Adelie.map((d) => d.flipperLength)),
                yRange: percentileRange(penguinSeries.Adelie.map((d) => d.bodyMass)),
                label: {
                    text: 'Adelie',
                    position: 'inside-top',
                    color: '#2b5c95',
                    fontSize: 13,
                    fontWeight: 'bold',
                    fill: '#ffffff',
                    fillOpacity: 0.85,
                    cornerRadius: 4,
                    padding: { top: 4, right: 8, bottom: 4, left: 8 },
                    border: {
                        enabled: true,
                        stroke: '#2b5c95',
                    },
                },
            },
            {
                fill: '#ffa03a',
                fillOpacity: 0.2,
                stroke: '#cc6f10',
                strokeWidth: 2,
                xRange: percentileRange(penguinSeries.Chinstrap.map((d) => d.flipperLength)),
                yRange: percentileRange(penguinSeries.Chinstrap.map((d) => d.bodyMass)),
                label: {
                    text: 'Chinstrap',
                    position: 'inside-top',
                    color: '#cc6f10',
                    fontSize: 13,
                    fontWeight: 'bold',
                    fill: '#ffffff',
                    fillOpacity: 0.85,
                    cornerRadius: 4,
                    padding: { top: 4, right: 8, bottom: 4, left: 8 },
                    border: {
                        enabled: true,
                        stroke: '#cc6f10',
                    },
                },
            },
            {
                fill: '#459d55',
                fillOpacity: 0.2,
                stroke: '#1e652e',
                strokeWidth: 2,
                xRange: percentileRange(penguinSeries.Gentoo.map((d) => d.flipperLength)),
                yRange: percentileRange(penguinSeries.Gentoo.map((d) => d.bodyMass)),
                label: {
                    text: 'Gentoo',
                    position: 'inside-top',
                    color: '#1e652e',
                    fontSize: 13,
                    fontWeight: 'bold',
                    fill: '#ffffff',
                    fillOpacity: 0.85,
                    cornerRadius: 4,
                    padding: { top: 4, right: 8, bottom: 4, left: 8 },
                    border: {
                        enabled: true,
                        stroke: '#1e652e',
                    },
                },
            },
        ],
    },
    series: [
        {
            type: 'scatter',
            title: 'Adelie',
            data: penguinSeries.Adelie,
            xKey: 'flipperLength',
            xName: 'Flipper Length',
            yKey: 'bodyMass',
            yName: 'Body Mass',
            size: 3,
            strokeWidth: 0,
        },
        {
            type: 'scatter',
            title: 'Chinstrap',
            data: penguinSeries.Chinstrap,
            xKey: 'flipperLength',
            xName: 'Flipper Length',
            yKey: 'bodyMass',
            yName: 'Body Mass',
            size: 3,
            strokeWidth: 0,
        },
        {
            type: 'scatter',
            title: 'Gentoo',
            data: penguinSeries.Gentoo,
            xKey: 'flipperLength',
            xName: 'Flipper Length',
            yKey: 'bodyMass',
            yName: 'Body Mass',
            size: 3,
            strokeWidth: 0,
        },
    ],
    axes: {
        x: {
            type: 'number',
            position: 'bottom',
            nice: false,
            title: {
                text: 'Flipper Length (mm)',
            },
            label: {
                formatter: (params) => {
                    return params.value + ' mm';
                },
            },
        },
        y: {
            type: 'number',
            position: 'left',
            nice: false,
            title: {
                text: 'Body Mass (g)',
            },
            label: {
                formatter: (params) => {
                    return params.value + ' g';
                },
            },
        },
    },
};

const chart = AgCharts.create(options);
