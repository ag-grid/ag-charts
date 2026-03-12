import {
    AgCartesianChartOptions,
    AgCharts,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    ScrollbarModule,
    ZoomModule,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([LegendModule, LineSeriesModule, NumberAxisModule, ScrollbarModule, ZoomModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { x: -5, y: 5 },
        { x: 0, y: 3 },
        { x: 5, y: -5 },
    ],
    scrollbar: {
        enabled: true,
        enableAxisScrolling: true,
        enableSeriesAreaScrolling: true,
        horizontal: { visible: 'always' },
        vertical: { visible: 'always' },
    },
    zoom: {
        enabled: true,
        enableScrolling: false,
        enableAxisDragging: true,
        enableAxisScrolling: false,
        autoScaling: { enabled: false },
        axes: 'xy',
        minVisibleItems: 0,
    },
    tooltip: { range: 'exact' },
    axes: {
        x: {
            type: 'number',
            crossAt: {
                value: 0,
            },
        },
        y: {
            type: 'number',
            crossAt: {
                value: 0,
            },
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'x',
            yKey: 'y',
            yName: 'Function plot',
            strokeWidth: 3,
            marker: { size: 20 },
        },
    ],
};

AgCharts.create(options);
