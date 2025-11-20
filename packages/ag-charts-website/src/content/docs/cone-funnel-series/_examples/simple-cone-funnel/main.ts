import { CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { ConeFunnelSeriesModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, ConeFunnelSeriesModule, NumberAxisModule]);
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
