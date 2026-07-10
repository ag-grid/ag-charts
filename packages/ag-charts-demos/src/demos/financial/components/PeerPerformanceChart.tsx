import { useMemo } from 'react';

import { type AgCartesianChartOptions, type AgLineSeriesOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { THEME } from '../chartTheme';
import { type Instrument, type PeerPerformanceFeed, sectorPeers } from '../data';

interface PeerPerformanceChartProps {
    instrument: Instrument;
    peerFeed: PeerPerformanceFeed;
    /** Bumped every stream tick so the live window recomputes. */
    peerTick: number;
    /** Trailing window in points (one point per bar interval, 1 min); shared across charts. */
    windowMinutes: number;
}

export function PeerPerformanceChart({ instrument, peerFeed, peerTick, windowMinutes }: PeerPerformanceChartProps) {
    const peers = useMemo(() => sectorPeers(instrument.ticker), [instrument.ticker]);
    const data = useMemo(
        () => peerFeed.relativePerformance(peers, windowMinutes),
        // peerTick is the recompute signal: the feed mutates in place, so its own
        // reference never changes when a new point streams in.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [peerFeed, peers, windowMinutes, peerTick]
    );

    const options = useMemo<AgCartesianChartOptions>(() => {
        const series: AgLineSeriesOptions[] = peers.map((ticker) => ({
            type: 'line',
            xKey: 'date',
            yKey: ticker,
            yName: ticker,
            // Emphasise the selected company against its peers via stroke width only.
            strokeWidth: ticker === instrument.ticker ? 3 : 1,
            strokeOpacity: ticker === instrument.ticker ? 1 : 0.5,
            marker: {
                enabled: false,
            },
            tooltip: {
                renderer: function ({ datum, yKey }) {
                    return {
                        data: [
                            {
                                label: yKey,
                                value: `${datum[yKey].toFixed(1)}%`,
                            },
                        ],
                    };
                },
            },
        }));
        return {
            theme: THEME,
            data,
            series,
            axes: {
                x: {
                    type: 'ordinal-time',
                    nice: false,
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
                        formatter: ({ value }) => {
                            if (value === 0) return '0%\nS&P 500';
                            return `${value > 0 ? '+' : ''}${value.toFixed(0)}%`;
                        },
                    },
                    crossLines: [
                        {
                            type: 'line',
                            value: 0,
                            stroke: 'white',
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
        } as AgCartesianChartOptions;
    }, [data, peers, instrument.ticker]);

    return (
        <div className="fin-detail-card">
            <div className="fin-detail-card-title">Peer performance vs S&amp;P 500</div>
            <div className="fin-detail-chart">
                <AgCharts options={options} style={{ height: '100%', width: '100%' }} />
            </div>
        </div>
    );
}
