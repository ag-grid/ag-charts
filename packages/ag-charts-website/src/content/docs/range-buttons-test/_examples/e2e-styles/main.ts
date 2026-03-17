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
        buttons: [
            { label: 'Teenagers', value: [15, 19] },
            { label: 'Young Adults', value: [20, 29] },
            { label: 'Middle Aged', value: [30, 65] },
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

const chart = AgCharts.create(options);

function testThemeTop() {
    options.theme = {
        params: {
            buttonBorder: false,
            chromeBackgroundColor: 'blue',
            chromeFontWeight: 800,
            buttonTextColor: 'white',
        },
        overrides: {
            common: {
                ranges: {
                    cornerRadius: 20,
                    gap: 10,
                    fill: 'pink',
                    textColor: 'red',
                },
            },
        },
    };
    chart.update(options as any);
}

function testThemeChild() {
    options.theme = {
        params: {
            chromeBackgroundColor: 'green',
            chromeFontWeight: 800,
            buttonTextColor: 'black',
        },
        overrides: {
            common: {
                ranges: {
                    fill: 'pink',
                    textColor: 'red',
                    button: {
                        fill: 'green',
                        stroke: 'aqua',
                        strokeWidth: 4,
                        textColor: 'white',
                    },
                },
            },
        },
    };
    chart.update(options as any);
}
