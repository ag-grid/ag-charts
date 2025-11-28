import {
    AgChartOptions,
    AgCharts,
    LegendModule, ModuleRegistry,
    AnimationModule,
    ContextMenuModule,
    PyramidSeriesModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
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
