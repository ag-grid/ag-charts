import {
    AgCartesianChartOptions,
    AgCharts,
    AgScrollbarVisibility,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    ScrollbarModule,
    UnitTimeAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([LineSeriesModule, NumberAxisModule, ScrollbarModule, UnitTimeAxisModule, ZoomModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Museum Visitors',
    },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'Tate Modern',
            stroke: '#c16068',
            marker: { enabled: false },
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'Tate Britain',
            stroke: '#a2bf8a',
            marker: { enabled: false },
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            interval: { maxSpacing: 200 },
        },
        y: {
            type: 'number',
            label: {
                formatter: (params) => params.value / 1000 + 'k',
            },
        },
    },
    zoom: {
        enabled: true,
    },
    scrollbar: {
        enabled: true,
        visible: 'always',
    },
};

const chart = AgCharts.create(options);

function setVisibility(value: AgScrollbarVisibility) {
    options.scrollbar!.visible = value;
    chart.update(options);
}
