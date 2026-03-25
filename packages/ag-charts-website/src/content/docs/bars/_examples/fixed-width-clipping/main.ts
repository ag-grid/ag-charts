import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    ScrollbarModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    BarSeriesModule,
    LegendModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    ScrollbarModule,
]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    scrollbar: { enabled: true },
    data: [
        { quarter: new Date(2026, 0, 1), iphone: 40, mac: 16, ipad: 14, wearables: 12 },
        { quarter: new Date(2026, 3, 1), iphone: 24, mac: 20, ipad: 14, wearables: 12 },
        { quarter: new Date(2026, 6, 1), iphone: 12, mac: 20, ipad: 18, wearables: 14 },
        { quarter: new Date(2026, 9, 1), iphone: 18, mac: 24, ipad: 14, wearables: 14 },
    ],
    series: [
        { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 150 },
        // { type: 'bar', xKey: 'quarter', yKey: 'mac' },
        // { type: 'bar', xKey: 'quarter', yKey: 'ipad' },
        // { type: 'bar', xKey: 'quarter', yKey: 'wearables' },
    ],
    axes: {
        x: { paddingInner: 0, paddingOuter: 0, groupPaddingInner: 0 },
    },
};

const chart = AgCharts.create(options);

function toggleFixedWidth() {
    for (const series of options.series ?? []) {
        if (!('width' in series)) continue;
        series.width =
            series.width == null ? Number(document.getElementById('fixedWidthSliderValue')!.innerHTML) : undefined;
    }
    chart.update(options);
}

function updateFixedWidth(event: any) {
    const value = Number(event.target?.value);
    for (const series of options.series ?? []) {
        if (!('width' in series)) continue;
        series.width = value;
    }
    chart.update(options);
    document.getElementById('fixedWidthSliderValue')!.innerHTML = String(value);
}
