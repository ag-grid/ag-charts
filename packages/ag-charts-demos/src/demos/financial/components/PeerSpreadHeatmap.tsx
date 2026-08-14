import { useEffect, useMemo, useRef } from 'react';

import {
    type AgCartesianChartOptions,
    type AgChartInstance,
    type AgColorScale,
    type AgHeatmapSeriesOptions,
} from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { THEME } from '../chartTheme';
import { type Instrument, type PeerHeatmapCell, type PeerPerformanceFeed, sectorPeers } from '../data';
import { diffWindow } from '../windowTransaction';

// Spread colour ramp, tight → wide: cool for a tight spread, warming to orange and then
// yellow as peers diverge. Warmth and lightness both rise with the value, so magnitude
// does not rest on hue alone.
//
// `mix` is the weight of `ref` (the card background) blended onto the palette token, so
// the higher the mix the closer a stop sits to the surface. Every stop keeps a share of
// it — the top of the ramp included — which is what makes the grid read as a tinted
// field rather than as blocks of saturated colour. Anchoring to a theme param rather
// than a literal means the whole ramp follows the card colour.
const SPREAD_COLOR_SCALE: AgColorScale = {
    domain: [0, 0.4],
    fills: [
        {
            color: { ref: 'chartBackgroundColor', mix: 0.62, ontoColor: 'var(--fin-chart-palette-0)' },
            name: '(Tight) 0',
        },
        { color: { ref: 'chartBackgroundColor', mix: 0.45, ontoColor: 'var(--fin-chart-palette-6)' }, name: '0.2' },
        {
            color: { ref: 'chartBackgroundColor', mix: 0.28, ontoColor: 'var(--fin-chart-palette-2)' },
            name: '0.4 (Wide)',
        },
    ],
};

const fmtSpread = (value: number) => `${value.toFixed(2)}%`;

// Module-scope so the series (and its tooltip renderer) keep a stable identity across
// renders; a fresh function identity per tick would force the chart's full slow-path
// options processing instead of the data-only fast path.
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
    stroke: 'var(--fin-panel-2)',
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
    /** Trailing window in minutes; shared across charts. The feed picks a bucket width
     *  from it so the column count stays legible as the window grows. */
    windowMinutes: number;
}

export function PeerSpreadHeatmap({ instrument, peerFeed, peerTick, windowMinutes }: PeerSpreadHeatmapProps) {
    const chartRef = useRef<AgChartInstance>(null);
    const peers = useMemo(() => sectorPeers(instrument.ticker), [instrument.ticker]);
    const data = useMemo(
        () => peerFeed.rollingSpread(peers, windowMinutes),
        // peerTick is the recompute signal: the feed mutates in place.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [peerFeed, peers, windowMinutes, peerTick]
    );
    // The cells currently rendered, diffed against each new window for the transaction.
    const windowRef = useRef<PeerHeatmapCell[]>([]);
    // Tracks the window size so a resize can be told apart from a streaming tick.
    const windowMinutesRef = useRef(windowMinutes);

    const options = useMemo<AgCartesianChartOptions>(() => {
        windowRef.current = data;
        return {
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
        // Seeded once; later buckets stream in via applyTransaction below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const baseline = windowRef.current;
        windowRef.current = data;
        // A resize swaps most buckets at once; incremental transactions would leave the category
        // axis domain stale, so replace the data to rebuild it. Ticks stay incremental below.
        if (windowMinutes !== windowMinutesRef.current) {
            windowMinutesRef.current = windowMinutes;
            // eslint-disable-next-line no-console
            chartRef.current?.updateDelta({ data }).catch((e) => console.error(e));
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
            chartRef.current?.applyTransaction(transaction).catch((e) => console.error(e));
        }
    }, [data, windowMinutes]);

    return (
        <div className="fin-detail-card">
            <div className="fin-detail-card-title">Price spread across peers</div>
            <div className="fin-detail-chart">
                <AgCharts ref={chartRef} options={options} style={{ height: '100%', width: '100%' }} />
            </div>
        </div>
    );
}
