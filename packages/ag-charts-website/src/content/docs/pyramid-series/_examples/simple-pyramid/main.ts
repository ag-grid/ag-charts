import { LegendModule, ModuleRegistry } from 'ag-charts-community';
import { AgChartOptions, AgCharts, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';
import { PyramidSeriesModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([AnimationModule, CrosshairModule, LegendModule, PyramidSeriesModule, ZoomModule]);
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
