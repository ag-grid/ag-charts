import type { AgAxisCrossLineListeners, AgCartesianChartOptions, AgCrossLineClickEvent } from 'ag-charts-community';
import {
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    CrossLinesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, CrossLinesModule, NumberAxisModule]);

// For e2e testing: every listener pushes a serialisable record here, drained by `popEvents()`.
const events: object[] = [];
function record(level: 'crossLine' | 'axis', event: AgCrossLineClickEvent) {
    const { event: _nativeEvent, context: _context, ...params } = event;
    events.push({ level, ...params });
}

const axisListeners: AgAxisCrossLineListeners = {
    crossLineClick: (event) => record('axis', event),
};

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { quarter: 'Q1', value: 2 },
        { quarter: 'Q2', value: 4 },
        { quarter: 'Q3', value: 6 },
        { quarter: 'Q4', value: 8 },
    ],
    series: [{ type: 'bar', xKey: 'quarter', yKey: 'value' }],
    legend: { enabled: false },
    axes: {
        x: {
            type: 'category',
            crossLines: [
                {
                    id: 'band',
                    type: 'range',
                    range: ['Q2', 'Q3'],
                    label: { text: 'Peak Season' },
                    listeners: { click: (event) => record('crossLine', event) },
                },
            ],
            listeners: axisListeners,
        },
        y: {
            type: 'number',
            min: 0,
            max: 10,
            crossLines: [
                {
                    id: 'threshold',
                    type: 'line',
                    value: 5,
                    listeners: { click: (event) => record('crossLine', event) },
                },
                // No listener at any level, so it is not keyboard-focusable.
                { id: 'target', type: 'line', value: 9 },
            ],
        },
    },
    listeners: {
        click: () => events.push({ level: 'chart', type: 'click' }),
    },
};

AgCharts.create(options);

(window as any).agE2E = { popEvents: () => events.splice(0) };
