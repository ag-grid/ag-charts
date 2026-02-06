import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    theme: 'ag-default',
    title: {
        text: 'Total Visitors to Museums and Galleries',
    },
    footnote: {
        text: 'Source: Department for Digital, Culture, Media & Sport',
    },
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'visitors',
            width: 30,
        },
    ],
    axes: {
        x: {
            type: 'category',
            title: {
                text: 'Year',
            },
        },
        y: {
            type: 'number',
            title: {
                text: 'Total Visitors (Millions)',
            },
        },
    },
    formatter: {
        y(params) {
            const value = params.value as number;
            const millions = value / 1_000_000;
            const accuracy = ['series-label', 'axis-label'].includes(params.source) ? 0 : 1;
            return `${millions.toFixed(accuracy)}M`;
        },
    },
};

AgCharts.create(options);
