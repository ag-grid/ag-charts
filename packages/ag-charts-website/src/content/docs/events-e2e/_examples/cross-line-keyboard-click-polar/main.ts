import { AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';
import type {
    AgAxisCrossLineListeners,
    AgCrossLineClickEvent,
    AgCrossLineListeners,
    AgPolarAxisShape,
    AgPolarChartOptions,
} from 'ag-charts-types';

ModuleRegistry.registerModules([AllEnterpriseModule]);

// For e2e testing: every listener pushes a serialisable record here, drained by `popEvents()`.
const events: object[] = [];
function record(level: 'crossLine' | 'axis', event: AgCrossLineClickEvent) {
    const { event: _nativeEvent, context: _context, ...params } = event;
    events.push({ level, ...params });
}

const crossLineListeners: AgCrossLineListeners = {
    click: (event) => record('crossLine', event),
};
const axisListeners: AgAxisCrossLineListeners = {
    crossLineClick: (event) => record('axis', event),
};

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { month: 'Jan', value: 2 },
        { month: 'Feb', value: 5 },
        { month: 'Mar', value: 4 },
        { month: 'Apr', value: 6 },
        { month: 'May', value: 3 },
        { month: 'Jun', value: 8 },
    ],
    series: [{ type: 'radar-line', angleKey: 'month', radiusKey: 'value' }],
    legend: { enabled: false },
    axes: {
        angle: {
            type: 'angle-category',
            shape: 'circle',
            crossLines: [
                {
                    id: 'band',
                    type: 'range',
                    range: ['Mar', 'Apr'],
                    fill: '#43a047',
                    stroke: '#2e7d32',
                    label: { text: 'Peak Season' },
                    listeners: crossLineListeners,
                },
                {
                    id: 'spoke',
                    type: 'line',
                    value: 'Feb',
                    stroke: '#8e24aa',
                    strokeWidth: 2,
                    listeners: crossLineListeners,
                },
            ],
            listeners: axisListeners,
        },
        radius: {
            type: 'radius-number',
            shape: 'circle',
            min: 0,
            max: 10,
            crossLines: [
                {
                    id: 'threshold',
                    type: 'line',
                    value: 5,
                    stroke: '#ffd700',
                    strokeWidth: 2,
                    listeners: crossLineListeners,
                },
                {
                    id: 'ring',
                    type: 'range',
                    range: [7, 8],
                    fill: '#00897b',
                    stroke: '#00695c',
                    listeners: crossLineListeners,
                },
                // No listener at any level, so it is not keyboard-focusable.
                { id: 'target', type: 'line', value: 9, stroke: '#757575' },
            ],
        },
    },
};

const chart = AgCharts.create(options);

function onPopEvents() {
    console.log(events.splice(0));
}

function onUpdate() {
    const angleShape = (document.getElementById('angleShape') as HTMLSelectElement).value as AgPolarAxisShape;
    const radiusShape = (document.getElementById('radiusShape') as HTMLSelectElement).value as AgPolarAxisShape;
    chart.updateDelta({ axes: { angle: { shape: angleShape }, radius: { shape: radiusShape } } });
}

(window as any).agE2E = { popEvents: () => events.splice(0) };
