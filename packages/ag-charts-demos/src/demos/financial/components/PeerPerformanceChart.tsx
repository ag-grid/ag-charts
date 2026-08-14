import { useEffect, useMemo, useRef } from 'react';

import { type AgCartesianChartOptions, type AgChartInstance, type AgLineSeriesOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { THEME } from '../chartTheme';
import { type Instrument, type PeerPerformanceFeed, type PerfRow, sectorPeers } from '../data';
import { diffWindow } from '../windowTransaction';

// Module-scope so these option pieces keep stable identities across renders; fresh
// function identities per tick would force the chart's full slow-path options
// processing instead of the data-only fast path.
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

export function PeerPerformanceChart({ instrument, peerFeed, peerTick, windowMinutes }: PeerPerformanceChartProps) {
    const chartRef = useRef<AgChartInstance>(null);
    const peers = useMemo(() => sectorPeers(instrument.ticker), [instrument.ticker]);
    const data = useMemo(
        () => peerFeed.relativePerformance(peers, windowMinutes),
        // peerTick is the recompute signal: the feed mutates in place, so its own
        // reference never changes when a new point streams in.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [peerFeed, peers, windowMinutes, peerTick]
    );
    // The rows currently rendered, diffed against each new window for the transaction.
    const windowRef = useRef<PerfRow[]>([]);
    // Tracks the window size so a resize can be told apart from a streaming tick.
    const windowMinutesRef = useRef(windowMinutes);

    const options = useMemo<AgCartesianChartOptions>(() => {
        windowRef.current = data;
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
                            // The index baseline is a reference mark, so it sits in chrome ink
                            // rather than a series colour.
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
        // Seeded once; later windows stream in via applyTransaction below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const baseline = windowRef.current;
        windowRef.current = data;
        // A resize swaps most of the window at once; incremental transactions would leave the
        // ordinal-time axis domain stale, so replace the data to rebuild it. Ticks stay incremental below.
        if (windowMinutes !== windowMinutesRef.current) {
            windowMinutesRef.current = windowMinutes;
            // eslint-disable-next-line no-console
            chartRef.current?.updateDelta({ data }).catch((e) => console.error(e));
            return;
        }
        const transactions = diffWindow(baseline, data, (row) => row.id);
        for (const transaction of transactions) {
            // eslint-disable-next-line no-console
            chartRef.current?.applyTransaction(transaction).catch((e) => console.error(e));
        }
    }, [data, windowMinutes]);

    return (
        <div className="fin-detail-card">
            <div className="fin-detail-card-title">Peer performance vs S&amp;P 500</div>
            <div className="fin-detail-chart">
                <AgCharts ref={chartRef} options={options} style={{ height: '100%', width: '100%' }} />
            </div>
        </div>
    );
}
