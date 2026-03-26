import {
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    ModuleRegistry,
    NumberAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
    ZoomModule,
    ContextMenuModule,
]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    zoom: {
        enabled: true,
        scrollingMode: 'zoom',
    },
    title: {
        text: 'Population by Country (millions)',
    },
    initialState: {
        zoom: {
            ratioY: { start: 0.6 },
        },
    },
    axes: {
        x: {
            type: 'number',
            label: {
                formatter: (params) => `${params.value}M`,
            },
        },
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'country',
            yKey: 'population',
            yName: 'Population (millions)',
        },
    ],
};

const chart = AgCharts.create(options);

function setScrollingMode(mode: 'zoom' | 'pan') {
    options.zoom!.scrollingMode = mode;
    chart.update(options);
}
