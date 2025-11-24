import { CategoryAxisModule, LegendModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { SunburstSeriesModule } from 'ag-charts-enterprise';

import { data } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, NumberAxisModule, SunburstSeriesModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
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
