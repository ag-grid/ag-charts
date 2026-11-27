import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    SunburstSeriesModule,
} from 'ag-charts-enterprise';

import { data } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    LegendModule,
    SunburstSeriesModule,
    ContextMenuModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    theme: 'ag-accessible',
    data,
    series: [
        {
            type: 'sunburst',
            labelKey: 'name',
        },
    ],
    title: {
        text: 'Organisational Chart',
    },
};

AgCharts.create(options);
