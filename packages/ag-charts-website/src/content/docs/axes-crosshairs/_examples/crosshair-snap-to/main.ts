import {
    AgBoxPlotSeriesOptions,
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    BoxPlotSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    BoxPlotSeriesModule,
    CategoryAxisModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    ContextMenuModule,
]);

const series: AgBoxPlotSeriesOptions = {
    type: 'box-plot',
    yName: 'Delivery time',
    xKey: 'region',
    minKey: 'min',
    q1Key: 'q1',
    medianKey: 'median',
    q3Key: 'q3',
    maxKey: 'max',
    crosshairSnapTo: ['median'],
};

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Delivery Times by Region',
    },
    data: getData(),
    series: [series],
    axes: {
        x: {
            type: 'category',
        },
        y: {
            type: 'number',
            title: {
                text: 'Hours',
            },
            crosshair: { enabled: true },
        },
    },
};

const chart = AgCharts.create(options);

function snapToMedian() {
    (options.series![0] as AgBoxPlotSeriesOptions).crosshairSnapTo = ['median'];
    chart.update(options);
}

function snapToQuartiles() {
    (options.series![0] as AgBoxPlotSeriesOptions).crosshairSnapTo = ['q1', 'q3'];
    chart.update(options);
}

function snapToNone() {
    (options.series![0] as AgBoxPlotSeriesOptions).crosshairSnapTo = [];
    chart.update(options);
}
