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
