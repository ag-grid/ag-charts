import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    SelectionModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule, SelectionModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Selection and Highlight Combined' },
    selection: {
        enabled: true,
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'revenue',
            yName: 'Revenue',
            highlight: {
                highlightedItem: {
                    fillOpacity: 0.8,
                    strokeWidth: 2,
                },
                unhighlightedSeries: {
                    opacity: 0.3,
                },
            },
            selection: {
                selectedItem: {
                    stroke: '#054d27',
                    strokeWidth: 3,
                },
                unselectedItem: {
                    fillOpacity: 0.4,
                },
            },
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'costs',
            yName: 'Costs',
            highlight: {
                highlightedItem: {
                    fillOpacity: 0.8,
                    strokeWidth: 2,
                },
                unhighlightedSeries: {
                    opacity: 0.3,
                },
            },
            selection: {
                selectedItem: {
                    stroke: '#7b1d1d',
                    strokeWidth: 3,
                },
                unselectedItem: {
                    fillOpacity: 0.4,
                },
            },
        },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
};

AgCharts.create(options);
