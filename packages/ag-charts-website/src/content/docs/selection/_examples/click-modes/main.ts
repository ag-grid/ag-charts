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
    subtitle: { text: "clickMode: 'single', clickAwayToClear: true" },
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
            highlight: { enabled: false },
        },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
};

const chart = AgCharts.create(options);

function updateSubtitle() {
    options.subtitle = {
        text: `clickMode: '${options.selection!.clickMode}', clickAwayToClear: ${options.selection!.enableClickAwayToClear}`,
    };
    chart.update(options);
}

function setClickMode(value: AgSelectionClickMode) {
    options.selection = { ...options.selection, clickMode: value };
    updateSubtitle();
}

function setClickAway(value: boolean) {
    options.selection = { ...options.selection, enableClickAwayToClear: value };
    updateSubtitle();
}
