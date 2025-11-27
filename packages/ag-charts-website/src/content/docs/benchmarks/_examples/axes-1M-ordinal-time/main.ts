/* @ag-options-extract */
import { LegendModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import {
    AgCartesianChartOptions,
    AgCharts,
    AgOrdinalTimeAxisOptions,
    ContextMenuModule,
    NavigatorModule,
    OrdinalTimeAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    LegendModule,
    LineSeriesModule,
    NavigatorModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    ZoomModule,
    ContextMenuModule,
]);

(window as any).agChartsDebug = 'scene:stats:verbose';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    animation: { enabled: false },
    zoom: {
        enabled: true,
        anchorPointX: 'pointer',
        anchorPointY: 'pointer',
        minVisibleItems: 0,
    },
    navigator: {
        enabled: true,
    },
    series: [
        {
            type: 'line',
            xKey: 'timestamp',
            yKey: 'price',
            marker: { enabled: false },
        },
    ],
    axes: {
        x: { type: 'ordinal-time', parentLevel: { enabled: false } },
    },
};
/* @ag-options-end */

const start = performance.now();
const chart = AgCharts.create(options);

chart.waitForUpdate().then(() => {
    console.log('Total update time: ', performance.now() - start);
});

function setParentLevel(enabled: boolean) {
    (options.axes!.y! as AgOrdinalTimeAxisOptions).parentLevel = { enabled };
    chart.update(options);
}
