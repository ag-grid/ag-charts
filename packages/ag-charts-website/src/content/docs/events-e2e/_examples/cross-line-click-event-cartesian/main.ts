import type {
    AgAxisCrossLineListeners,
    AgCartesianChartOptions,
    AgCrossLineClickEvent,
    AgCrossLineDoubleClickEvent,
    AgCrossLineListeners,
} from 'ag-charts-community';
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
function record(level: 'crossLine' | 'axis' | 'chart', event: AgCrossLineClickEvent | AgCrossLineDoubleClickEvent) {
    const { event: _nativeEvent, context: _context, ...params } = event;
    events.push({ level, ...params });
}

const crossLineListeners: AgCrossLineListeners = {
    click: (event) => record('crossLine', event),
    doubleClick: (event) => record('crossLine', event),
};
const axisListeners: AgAxisCrossLineListeners = {
    crossLineClick: (event) => record('axis', event),
    crossLineDoubleClick: (event) => record('axis', event),
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
            crossLines: [{ id: 'band', type: 'range', range: ['Q2', 'Q3'], listeners: crossLineListeners }],
            listeners: axisListeners,
        },
        y: {
            type: 'number',
            min: 0,
            max: 10,
            crossLines: [{ id: 'threshold', type: 'line', value: 5, strokeWidth: 12, listeners: crossLineListeners }],
            listeners: axisListeners,
        },
    },
    listeners: {
        click: () => events.push({ level: 'chart', type: 'click' }),
        crossLineClick: (event) => record('chart', event),
        crossLineDoubleClick: (event) => record('chart', event),
    },
};

AgCharts.create(options);

(window as any).agE2E = { popEvents: () => events.splice(0) };
