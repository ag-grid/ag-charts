import {
    AgCartesianChartOptions,
    AgCharts,
    AgRangesPosition,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NavigatorModule,
    NumberAxisModule,
    RangesModule,
    UnitTimeAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    ContextMenuModule,
    LegendModule,
    LineSeriesModule,
    NavigatorModule,
    NumberAxisModule,
    UnitTimeAxisModule,
    RangesModule,
    ZoomModule,
]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(800),
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'price',
            marker: {
                enabled: false,
            },
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            parentLevel: {
                enabled: true,
            },
        },
    },
    ranges: {
        position: 'bottom-left',
    },
    zoom: {
        enabled: true,
    },
    navigator: {
        enabled: true,
    },
};

const chart = AgCharts.create(options);

function changePosition(position: AgRangesPosition) {
    options.ranges!.position = position;
    chart.update(options as any);
}
