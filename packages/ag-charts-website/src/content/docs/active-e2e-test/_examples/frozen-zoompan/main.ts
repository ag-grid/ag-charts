// @ag-skip-fws
import { AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';
import type { AgActiveChangeEvent, AgCartesianChartOptions } from 'ag-charts-types';

import type { DataType } from './data';
import { getData } from './data';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const options: AgCartesianChartOptions<DataType, unknown> = {
    theme: {
        overrides: {
            area: {
                series: {
                    highlight: {
                        highlightedItem: {
                            stroke: 'lime',
                            strokeWidth: 7,
                        },
                    },
                },
            },
        },
    },
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'area',
            xKey: 'month',
            yKey: 'sales',
            yName: 'Sales',
            id: 'sales-series',
            marker: { enabled: true },
        },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number', title: { text: 'Sales ($k)' } },
    },
    navigator: {
        enabled: true,
    },
    zoom: {
        enabled: true,
        autoScaling: {
            enabled: false,
        },
        buttons: {
            enabled: false,
        },
    },
    listeners: {
        activeChange: function (event: AgActiveChangeEvent<DataType, unknown>) {
            events.push(event);
            const el = document.getElementById('zoom-status');
            if (event.activeItem) {
                el.textContent = 'Active: itemId=' + event.activeItem.itemId + ' | frozen=' + (event.frozen || false);
            } else {
                el.textContent = 'No active datum | frozen=' + (event.frozen || false);
            }
        },
    },
};

const chart = AgCharts.create(options);
const version = chart.getState().version;
let events: unknown[] = [];

export function freezeApril() {
    // April is at index 3 (0-based) in the data array
    var state = chart.getState();
    chart.setState({
        version: state.version,
        active: {
            frozen: true,
            activeItem: { type: 'series-node', seriesId: 'sales-series', itemId: 3 },
        },
    });
    document.getElementById('zoom-status').textContent =
        'FROZEN on April (itemId=3). Use navigator to pan/zoom away from April, then zoom back.';
    document.getElementById('zoom-status').style.background = '#fffbe6';
}

export function unfreeze() {
    chart.setState({ version, active: { frozen: false } });
    document.getElementById('zoom-status').style.background = '';
}

export function resetZoom() {
    chart.updateDelta({ initialState: { zoom: undefined } });
}

function popEvents(): unknown[] {
    const result = events;
    events = [];
    return result;
}

// For e2e testing:
(window as any).agE2E = { chart, popEvents };
