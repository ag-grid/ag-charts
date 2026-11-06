import {
    AgBoxPlotCrosshairSnapValue,
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
        },
    },
};

const chart = AgCharts.create(options);

function setSnapTo(values: AgBoxPlotCrosshairSnapValue[]) {
    series.crosshairSnapTo = values;
    chart.update(options);
}

function snapToMedian() {
    setSnapTo(['median']);
}

function snapToQuartiles() {
    setSnapTo(['q1', 'q3']);
}

function snapToNone() {
    setSnapTo([]);
}
