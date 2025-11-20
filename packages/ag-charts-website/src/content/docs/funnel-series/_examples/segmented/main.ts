import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { CategoryAxisModule, NumberAxisModule, ModuleRegistry } from 'ag-charts-community';
import { FunnelSeriesModule } from 'ag-charts-enterprise';

import { getData } from './data';


ModuleRegistry.registerModules([CategoryAxisModule, FunnelSeriesModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Revenue Open by Sales Stage',
    },
    series: [
        {
            type: 'funnel',
            stageKey: 'group',
            valueKey: 'value',
            dropOff: {
                enabled: false,
            },
        },
    ],
};

AgCharts.create(options);
