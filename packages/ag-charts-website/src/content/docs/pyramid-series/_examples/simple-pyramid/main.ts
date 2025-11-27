import { LegendModule, ModuleRegistry } from 'ag-charts-community';
import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    PyramidSeriesModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    LegendModule,
    PyramidSeriesModule,
    ContextMenuModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Revenue Open by Sales Stage',
    },
    series: [
        {
            type: 'pyramid',
            stageKey: 'group',
            valueKey: 'value',
        },
    ],
};

AgCharts.create(options);
