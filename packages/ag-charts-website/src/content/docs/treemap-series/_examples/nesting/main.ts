import { LegendModule, ModuleRegistry } from 'ag-charts-community';
import { AgChartOptions, AgCharts, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';
import { TreemapSeriesModule } from 'ag-charts-enterprise';

import { data } from './data';

ModuleRegistry.registerModules([AnimationModule, CrosshairModule, LegendModule, TreemapSeriesModule, ZoomModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'treemap',
            labelKey: 'name',
        },
    ],
    title: {
        text: 'Organisational Chart',
    },
};

AgCharts.create(options);
