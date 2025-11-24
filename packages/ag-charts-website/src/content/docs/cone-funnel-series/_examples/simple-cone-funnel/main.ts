import { CategoryAxisModule, LegendModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';
import { ConeFunnelSeriesModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CategoryAxisModule,
    ConeFunnelSeriesModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    ZoomModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Conversion Drop Off',
    },
    series: [
        {
            type: 'cone-funnel',
            stageKey: 'group',
            valueKey: 'value',
        },
    ],
};

AgCharts.create(options);
