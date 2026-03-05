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
    title: {
        text: 'Time With Others On A Saturday',
    },
    subtitle: {
        text: 'Average hours spent per day socialising on the weekend',
    },
    footnote: {
        text: 'Source: American Time Use Survey 2022',
        fontStyle: 'italic',
    },
    ranges: {
        buttons: [
            { label: 'Teenagers', value: [15, 19] },
            { label: 'Young Adults', value: [20, 29] },
            { label: 'Middle Aged', value: [30, 65] },
            { label: 'Retired', value: (_start, end) => [66, end] },
            { label: 'All Ages', value: undefined },
        ],
    },
    zoom: {
        enabled: true,
    },
    series: [
        {
            type: 'line',
            xKey: 'age',
            xName: 'Age',
            yKey: 'timeSpentAlone',
            yName: 'Alone',
        },
        {
            type: 'line',
            xKey: 'age',
            xName: 'Age',
            yKey: 'timeSpentWithFriends',
            yName: 'With Friends',
        },
        {
            type: 'line',
            xKey: 'age',
            xName: 'Age',
            yKey: 'timeSpentWithChildren',
            yName: 'With Children',
        },
        {
            type: 'line',
            xKey: 'age',
            xName: 'Age',
            yKey: 'timeSpentWithFamily',
            yName: 'With Family',
        },
        {
            type: 'line',
            xKey: 'age',
            xName: 'Age',
            yKey: 'timeSpentWithPartner',
            yName: 'With Partner',
        },
        {
            type: 'line',
            xKey: 'age',
            xName: 'Age',
            yKey: 'timeSpentWithCoworkers',
            yName: 'With Coworkers',
        },
    ],
    axes: {
        x: {
            type: 'category',
            title: {
                text: 'Age (years)',
            },
            label: {
                minSpacing: 30,
            },
        },
        y: {
            type: 'number',
            title: {
                text: 'Time Spent (hours)',
            },
        },
    },
};

AgCharts.create(options);
