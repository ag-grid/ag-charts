// @ag-skip-fws
import { AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';
import type { AgCartesianChartOptions } from 'ag-charts-types';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { year: '2020', publicTransit: 120, privateCar: 180, cycle: 60, other: 30 },
        { year: '2021', publicTransit: 140, privateCar: 170, cycle: 75, other: 40 },
        { year: '2022', publicTransit: 160, privateCar: 165, cycle: 90, other: 45 },
        { year: '2023', publicTransit: 175, privateCar: 155, cycle: 110, other: 50 },
        { year: '2024', publicTransit: 190, privateCar: 150, cycle: 130, other: 55 },
    ],
    title: {
        text: 'Transportation Usage Over Time',
    },
    subtitle: {
        text: 'Click a bar to save active (highlight/tooltip) state',
    },
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'publicTransit',
            yName: 'Public Transit',
        },
        { type: 'bar', xKey: 'year', yKey: 'privateCar', yName: 'Private Car' },
        { type: 'bar', xKey: 'year', yKey: 'cycle', yName: 'Cycle' },
        { type: 'bar', xKey: 'year', yKey: 'other', yName: 'Other' },
    ],
    listeners: {
        activeChange: (ev) => {
            events.push(ev);
        },
    },
    axes: {
        y: {
            type: 'number',
            title: { text: 'Usage (millions of trips)' },
        },
    },
};

let events: unknown[] = [];
const chart = AgCharts.create(options);
const version = chart.getState().version;

export function restoreStateValidThawed() {
    chart.setState({
        version,
        active: {
            frozen: false,
            activeItem: {
                type: 'series-node',
                seriesId: 'BarSeries-2',
                itemId: 0,
            },
        },
    });
}

export function restoreStateInvalidThawed() {
    chart.setState({
        version,
        active: {
            frozen: false,
            activeItem: {
                type: 'series-node',
                seriesId: 'BarSeries-2',
                itemId: 999,
            },
        },
    });
}

export function restoreStateValidFrozen() {
    chart.setState({
        version,
        active: {
            frozen: true,
            activeItem: {
                type: 'series-node',
                seriesId: 'BarSeries-2',
                itemId: 0,
            },
        },
    });
}

export function restoreStateInvalidFrozen() {
    chart.setState({
        version,
        active: {
            frozen: true,
            activeItem: {
                type: 'series-node',
                seriesId: 'BarSeries-2',
                itemId: 999,
            },
        },
    });
}

function popEvents(): unknown[] {
    const result = events;
    events = [];
    return result;
}

// For e2e testing:
(window as any).agE2E = { chart, popEvents };
