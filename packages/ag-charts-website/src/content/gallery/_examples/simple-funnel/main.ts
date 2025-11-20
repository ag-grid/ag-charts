import { CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { FunnelSeriesModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, FunnelSeriesModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Conversion Drop Off',
    },
    series: [
        {
            type: 'funnel',
            stageKey: 'group',
            valueKey: 'value',
            spacingRatio: 0.3,
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
    formatter: {
        x: '#{,.0f}',
    },
};

AgCharts.create(options);
