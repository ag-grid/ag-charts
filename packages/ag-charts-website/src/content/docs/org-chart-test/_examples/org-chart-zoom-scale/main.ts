// @ag-skip-fws
import {
    AgCharts,
    AgStandaloneChartOptions,
    ModuleRegistry,
    OrganizationSeriesModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { generateOrg } from './data';

ModuleRegistry.registerModules([OrganizationSeriesModule, ZoomModule]);

type Scale = 100 | 1_000 | 10_000 | 100_000;

const SCALES: Scale[] = [100, 1_000, 10_000, 100_000];
const SCALE_LABELS: Record<Scale, string> = { 100: '100', 1000: '1K', 10000: '10K', 100000: '100K' };

let activeScale: Scale = 100;

const options: AgStandaloneChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Organisation Scale Stress Test' },
    subtitle: { text: '100 nodes — zoom: wheel / pinch; pan: drag' },
    data: generateOrg(100),
    series: [
        {
            type: 'organization',
            idKey: 'id',
            parentIdKey: 'parentId',
        },
    ],
};

const chart = AgCharts.create(options);

/** inScope */
function setActiveButton(scale: Scale): void {
    SCALES.forEach((s) => {
        const btn = document.getElementById(`scale-btn-${s}`);
        if (btn) {
            btn.classList.toggle('active', s === scale);
        }
    });
}

/** inScope */
function updateStatus(text: string): void {
    const el = document.getElementById('scale-status');
    if (el) el.textContent = text;
}

/** inScope */
async function loadScale(scale: Scale): Promise<void> {
    if (scale === activeScale) return;
    if (
        scale >= 100_000 &&
        !confirm(`Loading ${SCALE_LABELS[scale]} nodes may take several seconds and use significant memory. Continue?`)
    ) {
        return;
    }

    activeScale = scale;
    setActiveButton(scale);
    updateStatus(`Generating ${SCALE_LABELS[scale]} nodes…`);

    // Yield to the browser so the status text is painted before generation starts.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    const data = generateOrg(scale);

    // Reset zoom to fit the new dataset, then update options.
    const state = chart.getState();
    await chart.setState({
        ...state,
        zoom: { ratioX: { start: 0, end: 1 }, ratioY: { start: 0, end: 1 } },
    });

    await chart.updateDelta({
        subtitle: { text: `${SCALE_LABELS[scale]} nodes — zoom: wheel / pinch; pan: drag` },
        data,
    });

    updateStatus(`${SCALE_LABELS[scale]} nodes loaded`);
}

function onScale100(): void {
    void loadScale(100);
}

function onScale1K(): void {
    void loadScale(1_000);
}

function onScale10K(): void {
    void loadScale(10_000);
}

function onScale100K(): void {
    void loadScale(100_000);
}

// Initialise the active button state on page load.
setActiveButton(activeScale);
updateStatus('100 nodes loaded');
