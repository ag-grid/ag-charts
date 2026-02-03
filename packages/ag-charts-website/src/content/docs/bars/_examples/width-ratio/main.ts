import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    LogAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, LogAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: "Chemical Composition of the Earth's Crust",
    },
    series: [
        {
            type: 'bar',
            xKey: 'chemical',
            yKey: 'oceanic',
            yName: 'Oceanic',
        },
        {
            type: 'bar',
            xKey: 'chemical',
            yKey: 'continental',
            yName: 'Continental',
            grouped: false,
            widthRatio: 0.4,
        },
    ],
    axes: {
        y: {
            type: 'log',
            label: {
                formatter: (params) => `${params.value}%`,
            },
        },
    },
};

const chart = AgCharts.create(options);

function updateWidthRatio(event: any) {
    const value = Number(event.target?.value);
    for (const series of options.series ?? []) {
        if (!('widthRatio' in series)) continue;
        series.widthRatio = value;
    }
    chart.update(options);
    document.getElementById('widthRatioSliderValue')!.innerHTML = String(value);
}
