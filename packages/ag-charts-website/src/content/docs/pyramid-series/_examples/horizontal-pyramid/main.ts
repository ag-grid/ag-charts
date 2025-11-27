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
    seriesArea: {
        padding: {
            left: 20,
            right: 20,
        },
    },
    series: [
        {
            type: 'pyramid',
            stageKey: 'group',
            valueKey: 'value',
            direction: 'horizontal',
        },
    ],
};

AgCharts.create(options);
