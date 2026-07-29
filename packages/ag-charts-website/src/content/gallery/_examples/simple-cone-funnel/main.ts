import {
    AgChartOptions,
    AgCharts,
    CategoryAxisModule,
    ConeFunnelSeriesModule,
    ContextMenuModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

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
            tooltip: {
                renderer: (params: any) => {
                    const value = params.datum[params.valueKey];
                    const percentage = ((value / 10000) * 100).toFixed(1);
                    return {
                        heading: 'Conversion Funnel',
                        title: params.datum[params.stageKey],
                        data: [
                            { label: 'Count', value: value.toLocaleString() },
                            { label: 'Conversion Rate', value: `${percentage}%` },
                        ],
                    };
                },
            },
        },
    ],
};

AgCharts.create(options);
