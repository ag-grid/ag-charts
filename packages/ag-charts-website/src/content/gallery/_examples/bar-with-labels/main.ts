import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Change in Number of Jobs',
    },
    footnote: {
        text: 'Source: Office for National Statistics',
    },
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'job',
            yKey: 'change',
            label: {
                formatter: (params) => {
                    return (params.value > 0 ? '+' : '') + params.value;
                },
            },
        },
    ],
    axes: {
        x: {
            type: 'number',
            title: {
                enabled: true,
                text: 'Change / Thousands',
            },
        },
    },
};

AgCharts.create(options);
