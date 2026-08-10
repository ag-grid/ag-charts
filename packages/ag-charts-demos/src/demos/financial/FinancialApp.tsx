import { useCallback, useState } from 'react';

import { DemoBanner } from './components/DemoBanner';
import { FinancialChart } from './components/FinancialChart';
import { MostActive } from './components/MostActive';
import { PeerPerformanceChart } from './components/PeerPerformanceChart';
import { PeerSpreadHeatmap } from './components/PeerSpreadHeatmap';
import { ProfileGauges } from './components/ProfileGauges';
import { Toolbar } from './components/Toolbar';
import { Trending } from './components/Trending';
import { Watchlist } from './components/Watchlist';
import { fmtPrice } from './format';
import { Button, Select, ToggleGroup } from './ui';
import { useStreamingMarket } from './useStreamingMarket';

// Stream speeds — a fast desk wants to dial the cadence up or down.
const SPEED_OPTIONS = [
    { value: '1000', label: '1×' },
    { value: '500', label: '2×' },
    { value: '250', label: '4×' },
];

// Shared default visible time window (in minutes) that every chart aligns to:
// FinancialChart's trailing window, PeerPerformance's range, and the peer heatmap's
// bucket count (buckets are one minute each). Driven by the title-bar range buttons.
const SHARED_WINDOW_MINUTES = 120;

// Range-button choices for the shared time window, in trailing minutes.
const RANGE_OPTIONS = [
    { value: '30', label: '30m' },
    { value: '60', label: '1H' },
    { value: '120', label: '2H' },
    { value: '240', label: '4H' },
];

export const FinancialApp = () => {
    const {
        instrument,
        bars,
        quotes,
        metrics,
        trending,
        mostActive,
        peerFeed,
        peerTick,
        ticker,
        setTicker,
        running,
        setRunning,
        speedMs,
        setSpeedMs,
    } = useStreamingMarket();

    // Shared trailing window (minutes) driven by the title-bar range buttons.
    const [rangeMinutes, setRangeMinutes] = useState(SHARED_WINDOW_MINUTES);
    // Off-canvas watchlist drawer; only reachable on narrow viewports.
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Selecting an instrument on a phone should reveal the chart it opened.
    const selectTicker = useCallback(
        (next: string) => {
            setTicker(next);
            setDrawerOpen(false);
        },
        [setTicker]
    );

    const last = bars[bars.length - 1];
    const first = bars[0];
    const change = last && first ? last.close - first.open : 0;
    const changePct = last && first ? (change / first.open) * 100 : 0;

    return (
        <div className="fin-container">
            <Toolbar />
            <DemoBanner />

            <div className="fin-body" data-drawer-open={drawerOpen}>
                <div className="fin-sidebar fin-sidebar-left">
                    <Watchlist quotes={quotes} activeTicker={ticker} onSelect={selectTicker} />
                    <Trending rows={trending} activeTicker={ticker} onSelect={selectTicker} />
                    <MostActive rows={mostActive} activeTicker={ticker} onSelect={selectTicker} />
                </div>
                <div className="fin-drawer-overlay" onClick={() => setDrawerOpen(false)} />

                <div className="fin-main">
                    <div className="fin-title-bar">
                        <div className="fin-title-left">
                            <Button
                                className="fin-drawer-toggle"
                                aria-label="Open watchlist"
                                onClick={() => setDrawerOpen(true)}
                            >
                                ☰
                            </Button>
                            <div className="fin-quote">
                                <span className="fin-quote-symbol">{instrument.name}</span>
                                <span className="fin-quote-price">{last ? fmtPrice(last.close) : '—'}</span>
                                <span className={change >= 0 ? 'fin-up' : 'fin-down'}>
                                    {change >= 0 ? '▲' : '▼'} {fmtPrice(Math.abs(change))} ({changePct.toFixed(2)}%)
                                </span>
                            </div>
                        </div>
                        <div className="fin-title-controls">
                            <ToggleGroup
                                ariaLabel="Time range"
                                value={String(rangeMinutes)}
                                onValueChange={(value) => setRangeMinutes(Number(value))}
                                options={RANGE_OPTIONS}
                            />
                            <Select
                                label="Speed"
                                ariaLabel="Stream speed"
                                value={String(speedMs)}
                                onValueChange={(value) => setSpeedMs(Number(value))}
                                options={SPEED_OPTIONS}
                            />
                            <Button onClick={() => setRunning((prev) => !prev)}>
                                {running ? '❚❚ Pause' : '▶ Live'}
                            </Button>
                        </div>
                    </div>
                    <div className="fin-detail-card fin-chart-card">
                        <div className="fin-chart-body">
                            <FinancialChart key={ticker} bars={bars} windowMinutes={rangeMinutes} />
                        </div>
                    </div>

                    <ProfileGauges metrics={metrics} />

                    <div className="fin-detail-charts">
                        <PeerPerformanceChart
                            key={`peer-${ticker}`}
                            instrument={instrument}
                            peerFeed={peerFeed}
                            peerTick={peerTick}
                            windowMinutes={rangeMinutes}
                        />
                        <PeerSpreadHeatmap
                            key={`heatmap-${ticker}`}
                            instrument={instrument}
                            peerFeed={peerFeed}
                            peerTick={peerTick}
                            windowMinutes={rangeMinutes}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
