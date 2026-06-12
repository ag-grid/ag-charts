// @ag-skip-fws
import { AgCartesianChartOptions, AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const options: AgCartesianChartOptions<{ population: number; city: string }, unknown> = {
    container: document.getElementById('myChart'),
    title: { text: 'Test accessibility screen-reader announcements' },
    data: [
        { population: 9.1, city: 'London' },
        { population: 8.1, city: 'New York' },
        { population: 9.9, city: 'Tokyo' },
        { population: 4, city: 'Dubai' },
    ],
    dataIdKey: 'city',
    series: [
        {
            id: 'myBarSeries',
            type: 'bar',
            xKey: 'city',
            yKey: 'population',
            highlight: { enabled: false },
        },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
    legend: {
        enabled: false,
    },
    selection: {
        enabled: true,
        enableClick: true,
        enableDrag: false,
        clickMode: 'single',
    },
    listeners: {
        selectionChange: (event) => {
            events.push(event);
        },
    },
};

const chart = AgCharts.create(options);
let events: unknown[] = [];

function initChartSelection(): void {
    chart.setSelection([{ seriesId: 'myBarSeries', itemId: 'New York' }]);
}

function getChartSelection() {
    return Array.from(chart.getSelection());
}

function popEvents(): unknown[] {
    const result = events;
    events = [];
    return result;
}

// For e2e testing:
(window as any).agE2E = { initChartSelection, getChartSelection, popEvents };
