import {
    type AgCartesianChartOptions,
    type AgChartInstance,
    AgCharts,
    type AgLineSeriesOptions,
} from 'ag-charts-community';

import { THEME } from '../chartTheme';
import { type Instrument, type PeerPerformanceFeed, type PerfRow, sectorPeers } from '../data';
import { type View, h } from '../dom';
import { diffWindow } from '../windowTransaction';

// Module-scope keeps these identities stable; a fresh function per tick would force the
// chart's full options processing instead of the data-only fast path.
const PEER_TOOLTIP_RENDERER: NonNullable<NonNullable<AgLineSeriesOptions['tooltip']>['renderer']> = ({
    datum,
    yKey,
}) => ({
    data: [
        {
            label: yKey,
            value: `${datum[yKey].toFixed(1)}%`,
        },
    ],
});

const Y_LABEL_FORMATTER = ({ value }: { value: number }) => {
    if (value === 0) return '0%\nS&P 500';
    return `${value > 0 ? '+' : ''}${value.toFixed(0)}%`;
};

interface PeerPerformanceChartProps {
    instrument: Instrument;
    peerFeed: PeerPerformanceFeed;
    /** Bumped every stream tick so the live window recomputes. */
    peerTick: number;
    /** Trailing window in points (one point per bar interval, 1 min); shared across charts. */
    windowMinutes: number;
}

export interface PeerPerformanceChart extends View {
    update(props: Pick<PeerPerformanceChartProps, 'peerTick' | 'windowMinutes'>): void;
}

function createOptions(container: HTMLElement, data: PerfRow[], peers: string[], instrument: Instrument) {
    const series: AgLineSeriesOptions[] = peers.map((ticker) => ({
        type: 'line',
        xKey: 'date',
        yKey: ticker,
        yName: ticker,
        // Emphasise the selected company against its peers via stroke width only.
        strokeWidth: ticker === instrument.ticker ? 3 : 1,
        strokeOpacity: ticker === instrument.ticker ? 1 : 0.5,
        marker: { enabled: false },
        tooltip: { renderer: PEER_TOOLTIP_RENDERER },
    }));
    return {
        container,
        theme: THEME,
        data,
        // A point's rebased value is fixed once computed, so ticks only add/remove whole points.
        dataIdKey: 'id',
        series,
        axes: {
            x: {
                type: 'ordinal-time',
                label: { format: '%H:%M' },
                line: { enabled: false },
                gridLine: { enabled: true },
                interval: {
                    placement: 'on',
                },
            },
            y: {
                type: 'number',
                position: 'right',
                label: {
                    formatter: Y_LABEL_FORMATTER,
                },
                crossLines: [
                    {
                        type: 'line',
                        value: 0,
                        stroke: 'var(--fin-muted)',
                        strokeOpacity: 1,
                        strokeWidth: 1,
                    },
                ],
            },
        },
        tooltip: {
            mode: 'shared',
            position: {
                anchorTo: 'pointer',
                placement: ['top'],
                yOffset: -80,
            },
        },
        legend: { enabled: true, position: 'bottom', spacing: 12, maxHeight: 24 },
        animation: { enabled: false },
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
export function createPeerPerformanceChart({
    instrument,
    peerFeed,
    peerTick,
    windowMinutes,
}: PeerPerformanceChartProps): PeerPerformanceChart {
    const container = h('div', { style: 'height: 100%; width: 100%;' });
    const el = h(
        'div',
        { class: 'fin-detail-card' },
        h('div', { class: 'fin-detail-card-title' }, 'Peer performance vs S&P 500'),
        h('div', { class: 'fin-detail-chart' }, container)
    );

    const peers = sectorPeers(instrument.ticker);
    let chart: AgChartInstance | undefined;
    // The rows currently rendered, diffed against each new window for the transaction.
    let rendered: PerfRow[] = peerFeed.relativePerformance(peers, windowMinutes);
    let lastPeerTick = peerTick;
    let lastWindowMinutes = windowMinutes;

    return {
        el,
        mount() {
            // Seeded once; later windows stream in via applyTransaction below.
            chart = AgCharts.create(createOptions(container, rendered, peers, instrument));
        },
        update(next) {
            // The React memo: the window recomputes only when a tick lands or the range changes.
            if (next.peerTick === lastPeerTick && next.windowMinutes === lastWindowMinutes) return;
            lastPeerTick = next.peerTick;
            const data = peerFeed.relativePerformance(peers, next.windowMinutes);
            const baseline = rendered;
            rendered = data;
            // A resize swaps most of the window at once; incremental transactions would leave the
            // ordinal-time axis domain stale, so replace the data to rebuild it. Ticks stay incremental below.
            if (next.windowMinutes !== lastWindowMinutes) {
                lastWindowMinutes = next.windowMinutes;
                // eslint-disable-next-line no-console
                chart?.updateDelta({ data }).catch((e) => console.error(e));
                return;
            }
            const transactions = diffWindow(baseline, data, (row) => row.id);
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
