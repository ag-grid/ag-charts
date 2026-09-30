import { Component, computed, inject, signal } from '@angular/core';

import { FinancialChart } from './components/financial-chart';
import { MostActive } from './components/most-active';
import { PeerPerformanceChart } from './components/peer-performance-chart';
import { PeerSpreadHeatmap } from './components/peer-spread-heatmap';
import { ProfileGauges } from './components/profile-gauges';
import { TickerBadge } from './components/ticker-cell';
import { Toolbar } from './components/toolbar';
import { Trending } from './components/trending';
import { Watchlist } from './components/watchlist';
import { fmtPrice } from './format';
import { StreamingMarket } from './streaming-market';
import { FinButton, Select, ToggleGroup } from './ui';

// Stream speeds — a fast desk wants to dial the cadence up or down.
const SPEED_OPTIONS = [
    { value: '1000', label: '1×' },
    { value: '500', label: '2×' },
    { value: '250', label: '4×' },
];

// Shared default visible range (minutes), driven by the title-bar range buttons: zoom state for the
// financial chart, a data window for PeerPerformance and the peer heatmap (one bucket per minute).
const SHARED_WINDOW_MINUTES = 120;

// Range-button choices for the shared time window, in trailing minutes.
const RANGE_OPTIONS = [
    { value: '30', label: '30m' },
    { value: '60', label: '1H' },
    { value: '120', label: '2H' },
    { value: '240', label: '4H' },
];

/**
 * The React `FinancialApp`: its root `.fin-container` is this component's host. The
 * `useStreamingMarket` hook is the `StreamingMarket` service, provided here so it lives as long as
 * the app does.
 */
@Component({
    selector: 'div[finFinancialApp]',
    imports: [
        FinancialChart,
        MostActive,
        PeerPerformanceChart,
        PeerSpreadHeatmap,
        ProfileGauges,
        TickerBadge,
        Toolbar,
        Trending,
        Watchlist,
        FinButton,
        Select,
        ToggleGroup,
    ],
    providers: [StreamingMarket],
    host: { class: 'fin-container' },
    template: `
        <div finToolbar></div>

        <div class="fin-body" [attr.data-drawer-open]="drawerOpen()">
            <div class="fin-sidebar fin-sidebar-left">
                <div
                    finWatchlist
                    [rowData]="market.quotes()"
                    [activeTicker]="market.ticker()"
                    (select)="openInstrument($event)"
                ></div>
                <div
                    finTrending
                    [rowData]="market.trending()"
                    [activeTicker]="market.ticker()"
                    (select)="openInstrument($event)"
                ></div>
                <div
                    finMostActive
                    [rowData]="market.mostActive()"
                    [activeTicker]="market.ticker()"
                    (select)="openInstrument($event)"
                ></div>
            </div>
            <div class="fin-drawer-overlay" (click)="drawerOpen.set(false)"></div>

            <div class="fin-main">
                <div class="fin-title-bar">
                    <div class="fin-title-left">
                        <button
                            finBtn
                            class="fin-drawer-toggle"
                            aria-label="Open watchlist"
                            (click)="drawerOpen.set(true)"
                            >☰</button
                        >
                        <div class="fin-quote">
                            <span finTickerBadge [ticker]="market.instrument().ticker"></span>
                            <span class="fin-quote-symbol">{{ market.instrument().name }}</span>
                            <span class="fin-quote-price">{{ last() ? fmtPrice(last()!.close) : '—' }}</span>
                            <span [class]="change() >= 0 ? 'fin-up' : 'fin-down'"
                                >{{ change() >= 0 ? '▲' : '▼' }} {{ fmtPrice(abs(change())) }} ({{
                                    changePct().toFixed(2)
                                }}%)</span
                            >
                        </div>
                    </div>
                    <div class="fin-title-controls">
                        <div
                            finToggleGroup
                            ariaLabel="Time range"
                            [value]="String(rangeMinutes())"
                            (valueChange)="rangeMinutes.set(Number($event))"
                            [options]="rangeOptions"
                        ></div>
                        <label
                            finSelect
                            label="Speed"
                            ariaLabel="Stream speed"
                            [value]="String(market.speedMs())"
                            (valueChange)="market.speedMs.set(Number($event))"
                            [options]="speedOptions"
                        ></label>
                        <button finBtn (click)="market.toggleRunning()">{{
                            market.running() ? '❚❚ Pause' : '▶ Live'
                        }}</button>
                    </div>
                </div>
                <div class="fin-detail-card fin-chart-card">
                    <div
                        finFinancialChart
                        [bars]="market.bars()"
                        [rangeMinutes]="rangeMinutes()"
                        [ticker]="market.ticker()"
                        (retainFrom)="market.setRetainFrom($event)"
                    ></div>
                </div>

                <div finProfileGauges [metrics]="market.metrics()"></div>

                <div class="fin-detail-charts">
                    <!-- React keys the two peer charts on the ticker; a keyed @for over that one ticker remounts both when it changes. -->
                    @for (ticker of tickerKey(); track ticker) {
                        <div
                            finPeerPerformanceChart
                            [instrument]="market.instrument()"
                            [peerFeed]="market.peerFeed"
                            [peerTick]="market.peerTick()"
                            [windowMinutes]="rangeMinutes()"
                        ></div>
                        <div
                            finPeerSpreadHeatmap
                            [instrument]="market.instrument()"
                            [peerFeed]="market.peerFeed"
                            [peerTick]="market.peerTick()"
                            [windowMinutes]="rangeMinutes()"
                        ></div>
                    }
                </div>
            </div>
        </div>
    `,
})
export class FinancialApp {
    protected readonly market = inject(StreamingMarket);

    // Shared trailing range (minutes) driven by the title-bar range buttons.
    protected readonly rangeMinutes = signal(SHARED_WINDOW_MINUTES);
    // Off-canvas watchlist drawer; only reachable on narrow viewports.
    protected readonly drawerOpen = signal(false);

    protected readonly rangeOptions = RANGE_OPTIONS;
    protected readonly speedOptions = SPEED_OPTIONS;

    protected readonly tickerKey = computed(() => [this.market.ticker()]);
    protected readonly last = computed(() => {
        const bars = this.market.bars();
        return bars[bars.length - 1];
    });
    protected readonly first = computed(() => this.market.bars()[0]);
    protected readonly change = computed(() => {
        const last = this.last();
        const first = this.first();
        return last && first ? last.close - first.open : 0;
    });
    protected readonly changePct = computed(() => {
        const first = this.first();
        return this.last() && first ? (this.change() / first.open) * 100 : 0;
    });

    protected readonly fmtPrice = fmtPrice;
    protected readonly abs = Math.abs;
    protected readonly String = String;
    protected readonly Number = Number;

    // Selecting an instrument on a phone should reveal the chart it opened.
    protected openInstrument(next: string): void {
        this.market.selectTicker(next);
        this.drawerOpen.set(false);
    }
}
