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

let enableClickAwayToClear = true;

function setClickMode(event: Event) {
    const clickMode = (event.target as HTMLInputElement).value as AgSelectionClickMode;
    options.selection = { ...options.selection, clickMode };
    options.subtitle = {
        text: `clickMode: '${options.selection!.clickMode}', clickAwayToClear: ${options.selection!.enableClickAwayToClear}`,
    };
    chart.update(options);
}

function setClickAway() {
    enableClickAwayToClear = !enableClickAwayToClear;
    (document.getElementById('clickAwayToggle') as HTMLButtonElement).setAttribute(
        'aria-pressed',
        String(enableClickAwayToClear)
    );

    options.selection = { ...options.selection, enableClickAwayToClear };
    options.subtitle = {
        text: `clickMode: '${options.selection!.clickMode}', clickAwayToClear: ${options.selection!.enableClickAwayToClear}`,
    };
    chart.update(options);
}
