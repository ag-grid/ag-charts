import {
    AgCartesianChartOptions,
    AgCharts,
    AgSelectionClickMode,
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
    title: { text: 'Quarterly Revenue' },
    selection: {
        enabled: true,
        clickMode: 'single',
        enableClickAwayToClear: true,
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

function setClickMode(value: AgSelectionClickMode) {
    options.selection = { ...options.selection, clickMode: value };
    chart.update(options);
}

function setClickAway(value: boolean) {
    options.selection = { ...options.selection, enableClickAwayToClear: value };
    chart.update(options);
}
