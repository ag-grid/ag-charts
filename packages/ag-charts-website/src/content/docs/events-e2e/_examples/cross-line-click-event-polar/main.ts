import { AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';
import type {
    AgAxisCrossLineListeners,
    AgCrossLineClickEvent,
    AgCrossLineDoubleClickEvent,
    AgCrossLineListeners,
    AgPolarChartOptions,
} from 'ag-charts-types';

ModuleRegistry.registerModules([AllEnterpriseModule]);

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

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { quarter: 'Q1', value: 2 },
        { quarter: 'Q2', value: 4 },
        { quarter: 'Q3', value: 6 },
        { quarter: 'Q4', value: 8 },
    ],
    series: [{ type: 'radar-line', angleKey: 'quarter', radiusKey: 'value' }],
    legend: { enabled: false },
    axes: {
        angle: {
            type: 'angle-category',
            shape: 'circle',
            label: { enabled: false },
            crossLines: [{ id: 'band', type: 'range', range: ['Q2', 'Q3'], listeners: crossLineListeners }],
            listeners: axisListeners,
        },
        radius: {
            type: 'radius-number',
            shape: 'circle',
            label: { enabled: false },
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
