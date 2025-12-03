import {
    AgCharts,
    AgPolarChartOptions,
    AngleCategoryAxisModule,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    RadarAreaSeriesModule,
    RadiusNumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AngleCategoryAxisModule,
    AnimationModule,
    CrosshairModule,
    LegendModule,
    RadarAreaSeriesModule,
    RadiusNumberAxisModule,
    ContextMenuModule,
]);
const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'radar-area',
            angleKey: 'department',
            radiusKey: 'quality',
            radiusName: 'Quality',
        },
    ],
    axes: {
        angle: {
            type: 'angle-category',
            shape: 'circle',
        },
        radius: {
            type: 'radius-number',
            shape: 'circle',
            reverse: true,
        },
    },
};

const chart = AgCharts.create(options);

function toggleAxisReverse() {
    const radiusNumberAxisOptions = options.axes!.y!;
    radiusNumberAxisOptions.reverse = !radiusNumberAxisOptions.reverse;
    chart.update(options);
}
