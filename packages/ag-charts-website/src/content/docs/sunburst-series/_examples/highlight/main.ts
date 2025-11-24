import { CategoryAxisModule, LegendModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';
import { SunburstSeriesModule } from 'ag-charts-enterprise';

import { energyMix } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CategoryAxisModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    SunburstSeriesModule,
    ZoomModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: energyMix,
    title: {
        text: 'Sunburst Highlight States',
    },
    subtitle: {
        text: 'Branch-sensitive styling',
    },
    series: [
        {
            type: 'sunburst',
            labelKey: 'name',
            sizeKey: 'value',
            highlight: {
                highlightedItem: { stroke: 'green' },
                highlightedBranch: { strokeWidth: 2 },
                unhighlightedItem: { opacity: 0.5 },
                unhighlightedBranch: { opacity: 0.1 },
            },
        },
    ],
};

AgCharts.create(options);
