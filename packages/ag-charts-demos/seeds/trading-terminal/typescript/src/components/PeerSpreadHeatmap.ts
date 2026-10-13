import {
    type AgCartesianChartOptions,
    type AgChartInstance,
    AgCharts,
    type AgColorScale,
    type AgHeatmapSeriesOptions,
} from 'ag-charts-community';

import { THEME } from '../chartTheme';
import { type Instrument, type PeerHeatmapCell, type PeerPerformanceFeed, sectorPeers } from '../data';
import { type View, h } from '../dom';
import { diffWindow } from '../windowTransaction';

// Spread colour ramp, tight → wide: near-background for a tight spread, ramping
// up the chart palette as peers diverge. Mixed via $ref onto the palette tokens.
const SPREAD_COLOR_SCALE: AgColorScale = {
    domain: [0, 0.4],
    fills: [
        {
            color: { ref: 'chartBackgroundColor', mix: 0.4, ontoColor: 'var(--fin-chart-palette-0)' },
            name: '(Tight) 0',
        },
        { color: { ref: 'chartBackgroundColor', mix: 0.2, ontoColor: 'var(--fin-chart-palette-6)' }, name: '0.2' },
        { color: 'var(--fin-chart-palette-2)', name: '0.4 (Wide)' },
    ],
};

const fmtSpread = (value: number) => `${value.toFixed(2)}%`;

// Module-scope so the series identity is stable — a fresh identity per tick would force the
// chart's slow-path options processing instead of the data-only fast path.
const HEATMAP_SERIES: AgHeatmapSeriesOptions = {
    type: 'heatmap',
    xKey: 'time',
    xName: 'Time',
    yKey: 'peer',
    yName: 'Peer',
    colorKey: 'value',
    colorName: 'Spread',
    colorScale: SPREAD_COLOR_SCALE,
    label: { enabled: false },
    stroke: 'var(--fin-panel)',
    strokeWidth: 0.5,
    tooltip: {
        renderer: ({ datum }: { datum: PeerHeatmapCell }) => ({
            heading: datum.time,
            data: [
                { label: 'Ticker', value: datum.peer },
                { label: 'Spread', value: fmtSpread(datum.value) },
            ],
        }),
    },
};

interface PeerSpreadHeatmapProps {
    instrument: Instrument;
    peerFeed: PeerPerformanceFeed;
    /** Bumped every stream tick so the live buckets recompute. */
    peerTick: number;
    /** Trailing window in one-minute buckets; shared across charts. */
    windowMinutes: number;
}

export interface PeerSpreadHeatmap extends View {
    update(props: Pick<PeerSpreadHeatmapProps, 'peerTick' | 'windowMinutes'>): void;
}

function createOptions(container: HTMLElement, data: PeerHeatmapCell[]) {
    return {
        container,
        theme: THEME,
        data,
        // The leftmost and trailing buckets recompute each tick, so matching on the composite
        // cell id lets those arrive as `update`s while a rolled bucket adds/removes cells.
        dataIdKey: 'key',
        series: [HEATMAP_SERIES],
        axes: {
            x: {
                type: 'category',
                position: 'bottom',
                line: { enabled: false },
                label: { autoRotate: false },
            },
            y: { type: 'category', position: 'left', line: { enabled: false } },
        },
        gradientLegend: {
            enabled: true,
            position: 'bottom',
            gradient: { thickness: 4, preferredLength: 400 },
            scale: { padding: 4 },
            spacing: 12,
        },
        padding: {
            top: 8,
            right: 2,
            bottom: 2,
            left: 2,
        },
    } as AgCartesianChartOptions;
}

/**
 * Created afresh for each instrument (the React component is keyed on the ticker), so the peers
 * are fixed for the life of the instance.
 */
export function createPeerSpreadHeatmap({
    instrument,
    peerFeed,
    peerTick,
    windowMinutes,
}: PeerSpreadHeatmapProps): PeerSpreadHeatmap {
    const container = h('div', { style: 'height: 100%; width: 100%;' });
    const el = h(
        'div',
        { class: 'fin-detail-card' },
        h('div', { class: 'fin-detail-card-title' }, 'Price spread across peers'),
        h('div', { class: 'fin-detail-chart' }, container)
    );

    const peers = sectorPeers(instrument.ticker);
    let chart: AgChartInstance | undefined;
    // The cells currently rendered, diffed against each new window for the transaction.
    let rendered: PeerHeatmapCell[] = peerFeed.rollingSpread(peers, windowMinutes);
    let lastPeerTick = peerTick;
    let lastWindowMinutes = windowMinutes;

    return {
        el,
        mount() {
            // Seeded once; later buckets stream in via applyTransaction below.
            chart = AgCharts.create(createOptions(container, rendered));
        },
        update(next) {
            // The React memo: the buckets recompute only when a tick lands or the range changes.
            if (next.peerTick === lastPeerTick && next.windowMinutes === lastWindowMinutes) return;
            lastPeerTick = next.peerTick;
            const data = peerFeed.rollingSpread(peers, next.windowMinutes);
            const baseline = rendered;
            rendered = data;
            // A resize swaps most buckets at once; incremental transactions would leave the category
            // axis domain stale, so replace the data to rebuild it. Ticks stay incremental below.
            if (next.windowMinutes !== lastWindowMinutes) {
                lastWindowMinutes = next.windowMinutes;
                // eslint-disable-next-line no-console
                chart?.updateDelta({ data }).catch((e) => console.error(e));
                return;
            }
            const transactions = diffWindow(
                baseline,
                data,
                (cell) => cell.key,
                (a, b) => a.value === b.value
            );
            for (const transaction of transactions) {
                // eslint-disable-next-line no-console
                chart?.applyTransaction(transaction).catch((e) => console.error(e));
            }
        },
        destroy() {
            chart?.destroy();
            chart = undefined;
        },
    };
}
