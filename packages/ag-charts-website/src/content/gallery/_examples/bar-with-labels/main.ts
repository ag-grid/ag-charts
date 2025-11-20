import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import {
    BarSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';

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
        y: {
            type: 'category',
            position: 'left',
        },
        x: {
            type: 'number',
            position: 'bottom',
            title: {
                enabled: true,
                text: 'Change / Thousands',
            },
        },
    },
};

AgCharts.create(options);
