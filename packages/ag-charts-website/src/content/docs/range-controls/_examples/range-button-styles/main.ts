import {
    AgChartOptions,
    AgCharts,
    CategoryAxisModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    RangesModule,
} from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LineSeriesModule, NumberAxisModule, RangesModule]);

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    ranges: {
        cornerRadius: 20,
        gap: 15,
        button: {
            fill: '#ff7faa',
            stroke: '#934962',
            strokeWidth: 4,
            fontWeight: 800,
            textColor: 'white',
            padding: { top: 10, right: 20, bottom: 10, left: 20 },
        },
        buttons: [
            { label: 'Teenagers', value: [15, 19] },
            { label: 'Young Adults', value: [20, 29] },
            { label: 'Middle Aged', value: [30, 65], enabled: false },
            { label: 'Retired', value: (_start, end) => [66, end] },
            { label: 'All Ages', value: undefined },
        ],
    },
    series: [
        { type: 'line', xKey: 'age', xName: 'Age', yKey: 'timeSpentAlone', yName: 'Alone' },
        { type: 'line', xKey: 'age', xName: 'Age', yKey: 'timeSpentWithFriends', yName: 'With Friends' },
        { type: 'line', xKey: 'age', xName: 'Age', yKey: 'timeSpentWithChildren', yName: 'With Children' },
        { type: 'line', xKey: 'age', xName: 'Age', yKey: 'timeSpentWithFamily', yName: 'With Family' },
        { type: 'line', xKey: 'age', xName: 'Age', yKey: 'timeSpentWithPartner', yName: 'With Partner' },
        { type: 'line', xKey: 'age', xName: 'Age', yKey: 'timeSpentWithCoworkers', yName: 'With Coworkers' },
    ],
    axes: {
        x: { type: 'category', title: { text: 'Age (years)' }, label: { minSpacing: 30 } },
        y: { type: 'number', title: { text: 'Time Spent (hours)' } },
    },
};

AgCharts.create(options);
