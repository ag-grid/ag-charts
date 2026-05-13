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
            highlight: { enabled: false },
        },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
    listeners: {
        selectionChange: (event) => {
            console.log('selectionChange', {
                source: event.source,
                added: event.added.map((item) => ({ seriesId: item.seriesId, itemId: item.itemId })),
                removed: event.removed.map((item) => ({ seriesId: item.seriesId, itemId: item.itemId })),
            });
        },
    },
};

const chart = AgCharts.create(options);

function logSelection() {
    console.log('selection', Array.from(chart.getSelection()));
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
