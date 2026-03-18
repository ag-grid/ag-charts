// @ag-skip-fws
import { AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';
import type { AgActiveChangeEvent, AgCartesianChartOptions } from 'ag-charts-types';

import type { DataType } from './data';
import { getData } from './data';
import { random } from './random';

ModuleRegistry.registerModules([AllEnterpriseModule]);

let currentData = getData();
let isFrozen = false;
let counter = 0;
let events: unknown[] = [];

const options: AgCartesianChartOptions<DataType, unknown> = {
    container: document.getElementById('myChart'),
    title: { text: 'Frozen Highlight Shifts When Data Mutated' },
    subtitle: { text: 'Click a bar to freeze, then prepend/append/remove to see the highlight shift' },
    data: currentData,
    dataIdKey: 'month',
    series: [{ type: 'bar', xKey: 'month', yKey: 'value', yName: 'Value' }],
    axes: {
        x: { type: 'category', crosshair: { enabled: true } },
        y: { type: 'number', crosshair: { enabled: true } },
    },
    listeners: {
        seriesNodeClick: onSeriesNodeClick,
        activeChange: (ev: AgActiveChangeEvent<DataType, unknown>) => {
            events.push(ev);
        },
    },
};

const chart = AgCharts.create(options);

function onSeriesNodeClick() {
    const state = chart.getState();
    state.active = { ...(state.active ?? {}), frozen: true };
    chart.setState(state);
    isFrozen = true;
    updateStatus();
}

export async function unfreeze() {
    const state = chart.getState();
    state.active = { ...(state.active ?? {}), frozen: false };
    await chart.setState(state);
    isFrozen = false;
    updateStatus();
}

function updateData() {
    options.data = [...currentData];
    chart.update(options);
    updateStatus();
}

export function addStart() {
    counter++;
    currentData.unshift({ month: 'New ' + counter, value: Math.round(100 + random() * 100) });
    updateData();
}

export function addEnd() {
    counter++;
    currentData.push({ month: 'New ' + counter, value: Math.round(100 + random() * 100) });
    updateData();
}

export function removeStart() {
    if (currentData.length > 1) {
        currentData.shift();
        updateData();
    }
}

export function removeEnd() {
    if (currentData.length > 1) {
        currentData.pop();
        updateData();
    }
}

function updateStatus() {
    const frozenText = isFrozen ? 'FROZEN' : 'Live';
    document.getElementById('status')!.textContent = frozenText + ' — ' + currentData.length + ' points';
}

function popEvents(): unknown[] {
    const result = events;
    events = [];
    return result;
}

// For e2e testing:
(window as any).agE2E = { chart, popEvents };
