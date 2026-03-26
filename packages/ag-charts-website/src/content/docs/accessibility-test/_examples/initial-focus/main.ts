// @ag-skip-fws
import {
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';
import { AgChartInstance, type AgInitialFocus } from 'ag-charts-types';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    ZoomModule,
]);
const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: `Renewable sources used to generate electricity for transport fuels`,
    },
    data: getData(),
    animation: { enabled: false },
    series: [
        { type: 'bar', xKey: 'year', yKey: 'Onshore wind', yName: 'Onshore Wind' },
        { type: 'bar', xKey: 'year', yKey: 'Offshore wind', yName: 'Offshore Wind' },
        { type: 'bar', xKey: 'year', yKey: 'Landfill gas', yName: 'Landfill Gas' },
        { type: 'bar', xKey: 'year', yKey: 'Solar photovoltaics', yName: 'Solar Photovoltaics' },
        { type: 'bar', xKey: 'year', yKey: 'Small scale Hydro', yName: 'Small Scale Hydro' },
        { type: 'bar', xKey: 'year', yKey: 'Large scale Hydro', yName: 'Large Scale Hydro' },
    ],
    listeners: {
        seriesNodeClick: (e) => {
            console.log(e.type, e.seriesId, e.datum[e.xKey!], e.datum[e.yKey!]);
        },
    },
    zoom: {
        enabled: true,
    },
    initialState: {
        zoom: {
            ratioX: {
                start: 0.2,
                end: 0.8,
            },
        },
    },
};

let chart: AgChartInstance = AgCharts.create(options);

export function onInitialFocusChange(initialFocus: '' | AgInitialFocus) {
    if (initialFocus !== '') {
        chart.destroy();
        chart = AgCharts.create({
            ...options,
            keyboard: { initialFocus },
        });
    }
}
