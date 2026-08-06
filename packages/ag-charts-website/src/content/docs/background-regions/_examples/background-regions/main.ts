import { AgCartesianChartOptions, AgChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { BackgroundRegionsModule, ModuleRegistry, NumberAxisModule, ScatterSeriesModule } from 'ag-charts-community';

import { penguinSeries } from './data';

ModuleRegistry.registerModules([LegendModule, NumberAxisModule, ScatterSeriesModule, BackgroundRegionsModule]);

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
            },
            {
                fill: '#ffa03a',
                fillOpacity: 0.2,
                stroke: '#cc6f10',
                strokeWidth: 2,
                xRange: percentileRange(penguinSeries.Chinstrap.map((d) => d.flipperLength)),
                yRange: percentileRange(penguinSeries.Chinstrap.map((d) => d.bodyMass)),
            },
            {
                fill: '#459d55',
                fillOpacity: 0.2,
                stroke: '#1e652e',
                strokeWidth: 2,
                xRange: percentileRange(penguinSeries.Gentoo.map((d) => d.flipperLength)),
                yRange: percentileRange(penguinSeries.Gentoo.map((d) => d.bodyMass)),
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
        },
        {
            type: 'scatter',
            title: 'Chinstrap',
            data: penguinSeries.Chinstrap,
            xKey: 'flipperLength',
            xName: 'Flipper Length',
            yKey: 'bodyMass',
            yName: 'Body Mass',
        },
        {
            type: 'scatter',
            title: 'Gentoo',
            data: penguinSeries.Gentoo,
            xKey: 'flipperLength',
            xName: 'Flipper Length',
            yKey: 'bodyMass',
            yName: 'Body Mass',
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

function updatePercentile(event: any) {
    const value = Number(event.target?.value);

    let index = 0;
    let seriesKeys = Object.keys(penguinSeries);

    for (const backgroundRegion of options.seriesArea!.backgroundRegions ?? []) {
        const series = (penguinSeries as any)[seriesKeys[index] as any];
        backgroundRegion.xRange = percentileRange(
            series.map((d: any) => d.flipperLength),
            value / 100
        );
        backgroundRegion.yRange = percentileRange(
            series.map((d: any) => d.bodyMass),
            value / 100
        );
        index++;
    }

    chart.update(options);

    document.getElementById('percentileSliderInputValue')!.innerHTML = String(value);
}
