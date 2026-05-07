import {
    AgCartesianChartOptions,
    AgCharts,
    AgSelectionItemIds,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    SelectionModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule, SelectionModule]);

let savedSelection: AgSelectionItemIds[] = [];

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Click bars, then use the buttons above' },
    selection: {
        enabled: true,
        enableDrag: true,
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'revenue',
            yName: 'Revenue ($m)',
        },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
};

const chart = AgCharts.create(options);

function logSelection() {
    console.log(Array.from(chart.getSelection()));
}

function saveSelection() {
    savedSelection = Array.from(chart.getSelection()).map(({ seriesId, itemId }) => ({ seriesId, itemId }));
    console.log('saved', savedSelection.length, 'item(s)');
}

function restoreSelection() {
    chart.setSelection(savedSelection);
}

function clearSelection() {
    chart.clearSelection();
}
