import { CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { ConeFunnelSeriesModule } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, ConeFunnelSeriesModule, NumberAxisModule]);
const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'cone-funnel',
            stageKey: 'group',
            valueKey: 'value',
            stageLabel: {
                placement: 'after',
            },
            fillOpacity: 0.2,
            strokeWidth: 1,
            lineDash: [5],
            label: {
                formatter: ({ value, datum }) => (datum.group === 'INITIAL CONTACT' ? '' : value.toLocaleString()),
                spacing: 20,
            },
        },
    ],
};

AgCharts.create(options);
