// @ag-skip-fws
import type { AgCartesianChartOptions } from 'ag-charts-community';
import {
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    CrossLinesModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, CrossLinesModule, LegendModule, NumberAxisModule]);

let listenersEnabled = true;
const events: string[] = [];

function listeners(name: string) {
    return listenersEnabled ? { click: () => events.push(name) } : undefined;
}

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Number of Cars Sold', listeners: listeners('title') },
    subtitle: { text: 'Monthly sales (no listener)' },
    footnote: { text: 'Source: Internal sales data', listeners: listeners('footnote') },
    data: [
        { month: 'March', units: 25 },
        { month: 'April', units: 27 },
        { month: 'May', units: 42 },
        { month: 'June', units: 38 },
    ],
    series: [{ type: 'bar', xKey: 'month', yKey: 'units', yName: 'Units' }],
    axes: {
        x: {
            type: 'category',
            crossLines: [
                {
                    id: 'promotion',
                    type: 'range',
                    range: ['April', 'May'],
                    label: { text: 'Promotion' },
                    listeners: listeners('promotion'),
                },
            ],
        },
        y: {
            type: 'number',
            crossLines: [
                { id: 'floor', type: 'line', value: 20, label: { text: 'Floor (no listener)' } },
                {
                    id: 'target',
                    type: 'line',
                    value: 35,
                    label: { text: 'Target' },
                    listeners: listeners('target'),
                },
            ],
        },
    },
    legend: { enabled: true },
};

const chart = AgCharts.create(options);

function toggleListeners() {
    listenersEnabled = !listenersEnabled;
    options.title = { ...options.title, listeners: listeners('title') };
    options.footnote = { ...options.footnote, listeners: listeners('footnote') };
    for (const axis of [options.axes?.x, options.axes?.y]) {
        if (!axis?.crossLines) continue;
        axis.crossLines = axis.crossLines.map((crossLine) =>
            crossLine.id === 'promotion' || crossLine.id === 'target'
                ? { ...crossLine, listeners: listeners(crossLine.id) }
                : crossLine
        );
    }
    chart.update(options);
    const button = document.getElementById('toggleListeners');
    if (button) button.textContent = `Listeners: ${listenersEnabled ? 'on' : 'off'}`;
}

// For e2e testing:
(window as any).agE2E = { popEvents: () => events.splice(0) };
