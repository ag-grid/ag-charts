import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    ContextMenuModule,
    LegendModule,
    ModuleRegistry,
    PyramidSeriesModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([AnimationModule, LegendModule, PyramidSeriesModule, ContextMenuModule]);
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
            fills: ['#5C6BC0', '#3F51B5', '#303F9F', '#1A237E'],
        },
    ],
};

AgCharts.create(options);
