import { AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';
import type {
    AgAxisCrossLineListeners,
    AgContextMenuItem,
    AgCrossLineClickEvent,
    AgCrossLineDoubleClickEvent,
    AgCrossLineListeners,
    AgPolarAxisShape,
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
            crossLines: [
                { id: 'band', type: 'range', range: ['Q2', 'Q3'], listeners: crossLineListeners },
                { id: 'spoke', type: 'line', value: 'Q1', strokeWidth: 12, listeners: crossLineListeners },
            ],
            listeners: axisListeners,
        },
        radius: {
            type: 'radius-number',
            shape: 'circle',
            label: { enabled: false },
            min: 0,
            max: 10,
            crossLines: [
                { id: 'threshold', type: 'line', value: 5, strokeWidth: 12, listeners: crossLineListeners },
                { id: 'ring', type: 'range', range: [7, 8], listeners: crossLineListeners },
            ],
            listeners: axisListeners,
        },
    },
    listeners: {
        click: () => events.push({ level: 'chart', type: 'click' }),
        crossLineClick: (event) => record('chart', event),
        crossLineDoubleClick: (event) => record('chart', event),
    },
    contextMenu: {
        getItems: (ev) => {
            const always: AgContextMenuItem[] = [];
            const axis: AgContextMenuItem[] = [];
            const crossline: AgContextMenuItem[] = [];
            const caption: AgContextMenuItem[] = [];
            const seriesArea: AgContextMenuItem[] = [];
            const seriesNode: AgContextMenuItem[] = [];
            const legendItem: AgContextMenuItem[] = [];

            for (const el of ev.allShowOnParams) {
                switch (el.showOn) {
                    case 'always':
                        always.push({
                            showOn: 'always',
                            label: 'Say hello',
                            action: () => {
                                console.log('Hello world!');
                            },
                        });
                        break;
                    case 'axis':
                        axis.push({
                            showOn: 'axis',
                            label: `Say hello to ${el.direction}}-axis ${el.axisId}, ${el.value}`,
                            action: () => {
                                console.log(`Hello in axis "${el.axisId}":"`);
                            },
                        });
                        break;
                    case 'cross-line':
                        crossline.push({
                            showOn: 'cross-line',
                            label: `Say hello to ${el.crossLineType} cross line ${el.crossLineId}`,
                            action: ({ value, direction, crossLineType }) => {
                                console.log(`Hello ${direction}-${crossLineType} ${value}!`);
                            },
                        });
                        break;
                    case 'caption':
                        caption.push({
                            showOn: 'caption',
                            label: `Say hello in ${el.captionType} caption: ${el.text}`,
                            action: ({ captionType, text }) => {
                                console.log(`Hello in a ${captionType} caption: "${text}"`);
                            },
                        });
                        break;
                    case 'series-area':
                        seriesArea.push({
                            showOn: 'series-area',
                            label: 'Say hello in the series area',
                            action: () => {
                                console.log('Hello in the series area!');
                            },
                        });
                        break;
                    case 'series-node':
                        const month = el.datum.quarter;
                        const value = el.datum.value;
                        seriesNode.push({
                            showOn: 'series-node',
                            label: `Say hello to ${value} in ${month}`,
                            action: () => {
                                console.log(`Hello ${value} in ${month}!`);
                            },
                        });
                        break;
                    case 'legend-item':
                        legendItem.push({
                            showOn: 'legend-item',
                            label: `Say hello to legend item ${el.itemId}`,
                            action: ({ itemId }) => {
                                console.log(`Hello ${itemId}!`);
                            },
                        });
                        break;
                    default:
                        el;
                }
            }
            return [
                'defaults',
                'separator',
                ...always,
                'separator',
                ...axis,
                'separator',
                ...crossline,
                'separator',
                ...caption,
                'separator',
                ...seriesArea,
                'separator',
                ...seriesNode,
                'separator',
                ...legendItem,
            ];
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
