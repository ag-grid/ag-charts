import {
    AgAxisContextMenuActionEvent,
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
]);
const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Q3 Production',
    },
    subtitle: {
        text: 'Total clothing manufactured from July to September',
    },
    footnote: {
        text: 'Note: This data excludes products made with manufacturing defects.',
    },
    contextMenu: {
        items: [
            'defaults',
            'separator',
            {
                showOn: 'always',
                label: 'Say hello',
                action: () => {
                    console.log('Hello world!');
                },
            },
            'separator',
            {
                showOn: 'axis',
                label: 'Say hello to an axis',
                action: (ev: AgAxisContextMenuActionEvent) => {
                    console.log(`Hello in axis "${ev.axisId}":"`, ev);
                },
            },
            'separator',
            {
                showOn: 'caption',
                label: 'Say hello in a caption',
                action: ({ captionType, text }) => {
                    console.log(`Hello in a ${captionType} caption: "${text}"`);
                },
            },
            'separator',
            {
                showOn: 'series-area',
                label: 'Say hello in the series area',
                action: () => {
                    console.log('Hello in the series area!');
                },
            },
            'separator',
            {
                showOn: 'series-node',
                label: 'Say hello to a node',
                action: ({ datum, yKey }) => {
                    console.log(`Hello ${yKey} in ${datum.month}!`);
                },
            },
            'separator',
            {
                showOn: 'legend-item',
                label: 'Say hello to a legend item',
                action: ({ itemId }) => {
                    console.log(`Hello ${itemId}!`);
                },
            },
        ],
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'sweaters',
            yName: 'Sweaters Made',
        },
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'hats',
            yName: 'Hats Made',
        },
    ],
};

AgCharts.create(options);
