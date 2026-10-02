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
    data,
    series: [
        {
            type: 'sunburst',
            labelKey: 'name',
            shadow: {
                enabled: true,
                color: 'rgba(0, 0, 0, 0.4)',
                xOffset: 3,
                yOffset: 3,
                blur: 6,
            },
        },
    ],
    title: {
        text: 'Organisational Chart',
    },
};

AgCharts.create(options);
