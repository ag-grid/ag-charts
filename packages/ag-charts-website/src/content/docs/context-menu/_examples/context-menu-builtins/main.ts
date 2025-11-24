import {
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts, AgContextMenuItemLiteral } from 'ag-charts-enterprise';
import { ContextMenuModule, ZoomModule } from 'ag-charts-enterprise';

import { generateCurrencyData } from './data';

ModuleRegistry.registerModules([
    CategoryAxisModule,
    ContextMenuModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    ZoomModule,
]);
const CUSTOM_ORDER: AgContextMenuItemLiteral[] = [
    'toggle-series-visibility',
    'toggle-other-series',
    'separator',
    'zoom-to-cursor',
    'pan-to-cursor',
    'reset-zoom',
    'separator',
    'download',
];

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Inflation-Adjusted Currency Values (1800–2025)' },
    zoom: { enabled: true },
    contextMenu: {
        items: CUSTOM_ORDER,
    },
    data: generateCurrencyData(),
    series: [
        { type: 'line', xKey: 'year', yKey: 'USD' },
        { type: 'line', xKey: 'year', yKey: 'GBP' },
        { type: 'line', xKey: 'year', yKey: 'JPY' },
    ],
    axes: {
        x: { type: 'category', position: 'bottom', label: { autoRotate: false } },
        y: { type: 'number', position: 'left' },
    },
};

const chart = AgCharts.create(options);

function onCustomOrder() {
    options.contextMenu!.items = CUSTOM_ORDER;
    chart.update(options);
}

function onDefaultOrder() {
    options.contextMenu!.items = ['defaults'];
    chart.update(options);
}
