import { useCallback, useMemo, useState } from 'react';

import { DemoBanner } from './components/DemoBanner';
import { FinancialChart } from './components/FinancialChart';
import { MostActive } from './components/MostActive';
import { PeerPerformanceChart } from './components/PeerPerformanceChart';
import { PeerSpreadHeatmap } from './components/PeerSpreadHeatmap';
import { ProfileGauges } from './components/ProfileGauges';
import { SavedMarkets } from './components/SavedMarkets';
import { TickerBadge } from './components/TickerCell';
import { Toolbar } from './components/Toolbar';
import { Trending } from './components/Trending';
import { Watchlist } from './components/Watchlist';
import { fmtPrice } from './format';
import { Button, Select, ToggleGroup } from './ui';
import { useStreamingMarket } from './useStreamingMarket';

// Stream speeds — a fast desk wants to dial the cadence up or down. 1× is one bar per
// second; the slower step exists because a streaming board is easier to read when the
// prices are not redrawing faster than the eye can settle on them.
const SPEED_OPTIONS = [
    { value: '2000', label: '0.5×' },
    { value: '1000', label: '1×' },
    { value: '500', label: '2×' },
    { value: '250', label: '4×' },
];

// Shared default visible time window (in minutes) that every chart aligns to:
// FinancialChart's trailing window, PeerPerformance's range, and the peer heatmap's
// bucket span. Driven by the title-bar range buttons. 240 == the 4H button.
const SHARED_WINDOW_MINUTES = 240;

// Range-button choices for the shared time window, in trailing minutes.
const RANGE_OPTIONS = [
    { value: '30', label: '30m' },
    { value: '60', label: '1H' },
    { value: '120', label: '2H' },
    { value: '240', label: '4H' },
];

function BookmarkIcon() {
    return (
        <svg
            className="fin-saved-cta-icon"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            focusable="false"
        >
            <path d="M4 2h8v12L8 11.1 4 14V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
    );
}

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
        selectTicker: selectInstrument,
        running,
        setRunning,
        speedMs,
        setSpeedMs,
    } = useStreamingMarket();

    // Shared trailing window (minutes) driven by the title-bar range buttons.
    const [rangeMinutes, setRangeMinutes] = useState(SHARED_WINDOW_MINUTES);
    // Off-canvas watchlist drawer; only reachable on narrow viewports.
    const [drawerOpen, setDrawerOpen] = useState(false);
    // When open, the saved-markets table takes the place of the gauges and peer charts.
    // The candlestick chart above it is unaffected.
    const [savedOpen, setSavedOpen] = useState(false);

    // Selecting an instrument on a phone should reveal the chart it opened.
    const selectTicker = useCallback(
        (next: string) => {
            selectInstrument(next);
            setDrawerOpen(false);
        },
        [selectInstrument]
    );

    // Everything the desk has saved: the watchlist plus both market-overview boards.
    const savedSources = useMemo(() => [...quotes, ...trending, ...mostActive], [quotes, trending, mostActive]);

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
                    <button
                        type="button"
                        className="fin-saved-cta"
                        data-active={savedOpen}
                        aria-pressed={savedOpen}
                        onClick={() => setSavedOpen((prev) => !prev)}
                    >
                        <BookmarkIcon />
                        <span className="fin-saved-cta-text">Saved markets</span>
                        <span className="fin-saved-cta-count">{savedSources.length}</span>
                    </button>

                    <Watchlist quotes={quotes} activeTicker={ticker} onSelect={selectTicker} />
                    <Trending rows={trending} activeTicker={ticker} onSelect={selectTicker} />
                    <MostActive rows={mostActive} activeTicker={ticker} onSelect={selectTicker} />
                </div>
                <div className="fin-drawer-overlay" onClick={() => setDrawerOpen(false)} />

                <div className="fin-main">
                    {/* The quote header and its controls sit inside the chart card, so the
                        instrument, its range and its chart read as one component. */}
                    <div className="fin-detail-card fin-chart-card">
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
                                    <TickerBadge ticker={instrument.ticker} />
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
                        <div className="fin-chart-body">
                            {/* No `key` on the ticker: the chart replaces its data in place, so
                                selecting an instrument keeps the same chart instance rather than
                                tearing it down and rebuilding it. */}
                            <FinancialChart bars={bars} windowMinutes={rangeMinutes} ticker={ticker} />
                        </div>
                    </div>

                    {savedOpen ? (
                        <SavedMarkets sources={savedSources} activeTicker={ticker} onSelect={selectTicker} />
                    ) : (
                        <>
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
