// @ag-skip-fws
import { AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';
import type { AgActiveChangeEvent, AgCartesianChartOptions, AgNodeClickEvent } from 'ag-charts-types';

ModuleRegistry.registerModules([AllEnterpriseModule]);

let frozenItemId: string | number | undefined = undefined;

type DatumType = { quarter: string; sales: number };
const options: AgCartesianChartOptions<DatumType> = {
    container: document.getElementById('myChart'),
    title: { text: 'Click-to-Freeze Bar Chart' },
    subtitle: {
        text: 'Click a bar to freeze the highlight. Hover elsewhere — it should not move. Click again to unfreeze.',
    },
    data: [
        { quarter: 'Q1 2024', sales: 450 },
        { quarter: 'Q2 2024', sales: 720 },
        { quarter: 'Q3 2024', sales: 610 },
        { quarter: 'Q4 2024', sales: 890 },
        { quarter: 'Q1 2025', sales: 530 },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'sales',
            yName: 'Sales',
            id: 'sales-series',
            listeners: {
                seriesNodeClick: function (event: AgNodeClickEvent<'seriesNodeClick', DatumType>) {
                    const { seriesId, itemId } = event;
                    let state = chart.getState();
                    let statusEl = document.getElementById('myFreezeStatus');
                    const activeItem = { type: 'series-node', seriesId, itemId };
                    if (state.active && state.active.frozen && itemId === frozenItemId) {
                        // Already frozen — unfreeze
                        chart.setState({ version: state.version, active: { frozen: false, activeItem } });
                        statusEl.textContent = 'Unfrozen. Click a bar to freeze again.';
                        statusEl.style.background = '';
                        frozenItemId = undefined;
                    } else {
                        // Freeze current active item
                        chart.setState({ version: state.version, active: { frozen: true, activeItem } });
                        statusEl.textContent =
                            'FROZEN on item ' +
                            itemId +
                            '. Hover elsewhere — highlight stays fixed. Click bar again to unfreeze.';
                        statusEl.style.background = '#fffbe6';
                        frozenItemId = itemId;
                    }
                },
            },
        },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number', title: { text: 'Sales ($k)' } },
    },
    listeners: {
        activeChange: (ev: AgActiveChangeEvent<unknown, unknown>) => {
            events.push(ev);
        },
    },
};

const chart = AgCharts.create(options);
let events: unknown[] = [];

function popEvents(): unknown[] {
    const result = events;
    events = [];
    return result;
}

export function onPopEvents() {
    const events = popEvents();
    console.log(events);
}

export function unfreezeAll() {
    let state = chart.getState();
    chart.setState({ version: state.version, active: { frozen: false } });
    let statusEl = document.getElementById('myFreezeStatus');
    statusEl.textContent = 'Unfrozen. Click a bar to freeze again.';
    statusEl.style.background = '';
}

window.addEventListener('mousemove', (ev: MouseEvent) => {
    document.getElementById('myPointerPos')!.textContent = `clientX: ${ev.clientX}; clientY: ${ev.clientY}`;
});

// For e2e testing:
(window as any).agE2E = { chart, popEvents };
