import {
    AgCartesianChartOptions,
    AgCharts,
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);

const seriesHighlight = {
    highlightedSeries: { size: 10 },
    unhighlightedSeries: { size: 4 },
};

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Sales by Month',
    },
    data: getData(),
    theme: {
        overrides: {
            line: {
                series: {
                    highlight: {
                        highlightedItem: { size: 14 },
                        unhighlightedItem: { size: 4 },
                    },
                },
            },
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'subscriptions',
            yName: 'Subscriptions',
            marker: { enabled: true, size: 7 },
            highlight: seriesHighlight,
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'services',
            yName: 'Services',
            marker: { enabled: true, size: 7 },
            highlight: seriesHighlight,
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'products',
            yName: 'Products',
            marker: { enabled: true, size: 7 },
            highlight: seriesHighlight,
        },
    ],
};

AgCharts.create(options);
