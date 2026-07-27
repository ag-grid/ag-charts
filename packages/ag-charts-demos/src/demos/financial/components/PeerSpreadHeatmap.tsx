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
    /** Trailing window in one-minute buckets; shared across charts. */
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
        const transactions = diffWindow(
            windowRef.current,
            data,
            (cell) => cell.key,
            (a, b) => a.value === b.value
        );
        windowRef.current = data;
        for (const transaction of transactions) {
            // eslint-disable-next-line no-console
            chartRef.current?.applyTransaction(transaction).catch((e) => console.error(e));
        }
    }, [data]);

    return (
        <div className="fin-detail-card">
            <div className="fin-detail-card-title">Price spread across peers</div>
            <div className="fin-detail-chart">
                <AgCharts ref={chartRef} options={options} style={{ height: '100%', width: '100%' }} />
            </div>
        </div>
    );
}
