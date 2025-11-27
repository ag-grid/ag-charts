import { CategoryAxisModule, LegendModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    ConeFunnelSeriesModule,
    ContextMenuModule,
    CrosshairModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CategoryAxisModule,
    ConeFunnelSeriesModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
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
            type: 'cone-funnel',
            stageKey: 'group',
            valueKey: 'value',
            fills: ['#5090DC', '#FFA03A', '#459D55'],
        },
    ],
};

AgCharts.create(options);
