import {
    AgCartesianChartOptions,
    AgChartLegendPlacement,
    AgCharts,
    AgStatusBarInactiveMode,
    AgStatusBarOptions,
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    StatusBarModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule, StatusBarModule]);

const statusBar: AgStatusBarOptions = {
    enabled: true,
    position: { placement: 'top', floating: false },
    border: { enabled: true },
    cornerRadius: 4,
    padding: 6,
};

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Average Monthly Temperatures' },
    series: [
        { type: 'line', xKey: 'month', yKey: 'london', yName: 'London' },
        { type: 'line', xKey: 'month', yKey: 'paris', yName: 'Paris' },
        { type: 'line', xKey: 'month', yKey: 'rome', yName: 'Rome' },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number', title: { text: 'Average Temperature' } },
    },
    formatter: {
        y: ({ value }) => `${value}°C`,
    },
    statusBar,
};

const chart = AgCharts.create(options);

let placement: AgChartLegendPlacement = 'top';
let floating = false;

function updatePlacement(value: AgChartLegendPlacement) {
    placement = value;
    statusBar.position = { placement, floating };
    chart.update(options);
}

function toggleFloating() {
    floating = !floating;
    statusBar.position = { placement, floating };
    chart.update(options);
}

function updateInactive(value: AgStatusBarInactiveMode) {
    statusBar.inactive = value;
    chart.update(options);
}
