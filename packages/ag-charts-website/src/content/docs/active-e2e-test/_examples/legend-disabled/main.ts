// @ag-skip-fws
import type { AgActiveChangeEvent, AgCartesianChartOptions } from 'ag-charts-community';
import { AgCharts, AllCommunityModule, ModuleRegistry } from 'ag-charts-community';

type DataType = { year: string; publicTransit: number; privateCar: number; cycle: number; other: number };

const data = [
    { year: '2020', publicTransit: 120, privateCar: 180, cycle: 60, other: 30 },
    { year: '2021', publicTransit: 140, privateCar: 170, cycle: 75, other: 40 },
    { year: '2022', publicTransit: 160, privateCar: 165, cycle: 90, other: 45 },
    { year: '2023', publicTransit: 175, privateCar: 155, cycle: 110, other: 50 },
    { year: '2024', publicTransit: 190, privateCar: 150, cycle: 130, other: 55 },
];

ModuleRegistry.registerModules([AllCommunityModule]);
const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            id: 'publicTransit',
            type: 'bar',
            xKey: 'year',
            yKey: 'publicTransit',
            yName: 'Public Transit',
            fill: '#4fa8e0',
        },
        {
            id: 'privateCar',
            type: 'bar',
            xKey: 'year',
            yKey: 'privateCar',
            yName: 'Private Car',
            fill: '#e87d4a',
        },
        {
            id: 'cycle',
            type: 'bar',
            xKey: 'year',
            yKey: 'cycle',
            yName: 'Cycle',
            fill: '#57b85a',
        },
        {
            id: 'other',
            type: 'bar',
            xKey: 'year',
            yKey: 'other',
            yName: 'Other',
            fill: '#b05fbf',
        },
    ],
    axes: {
        x: {
            type: 'category',
        },
        y: {
            type: 'number',
            title: { text: 'Usage (millions of trips)' },
        },
    },
    legend: {
        // Hide the built-in legend — we're using an external one
        enabled: false,
    },
    listeners: {
        activeChange: (ev: AgActiveChangeEvent<DataType, unknown>) => {
            events.push(ev);
        },
    },
};

const chart = AgCharts.create(options);
const version = chart.getState().version;
let events: unknown[] = [];

// Highlight a series by activating it via setState (legend-type activeItem)
export function activateSeries(seriesId: string) {
    chart.setState({
        version,
        active: {
            activeItem: { type: 'legend', seriesId: seriesId, itemId: seriesId },
        },
    });
}

// Clear the highlight by setting activeItem to undefined
export function deactivateSeries() {
    chart.setState({
        version,
        active: { activeItem: undefined },
    });
}

export function onLegendChange(event: { target: { checked: boolean } }) {
    chart.updateDelta({
        legend: { enabled: event.target.checked },
    });
}

function popEvents(): unknown[] {
    const result = events;
    events = [];
    return result;
}

export function onPopEvents() {
    const events = popEvents();
    console.log(events);
}

window.addEventListener('mousemove', (ev: MouseEvent) => {
    document.getElementById('myPointerPos')!.textContent = `clientX: ${ev.clientX}; clientY: ${ev.clientY}`;
});

// For e2e testing:
(window as any).agE2E = { chart, popEvents };
