import { Injectable, computed, effect, signal } from '@angular/core';

import {
    ALL_INSTRUMENTS,
    type Bar,
    type GaugeMetrics,
    INSTRUMENTS,
    MOST_ACTIVE_STOCKS,
    MarketFeed,
    MoverFeed,
    PeerPerformanceFeed,
    TRENDING_STOCKS,
} from './data';
import { DETERMINISTIC, startTime } from './deterministic';
import { type MoverRow, type Quote } from './types';

// Fixed display order (values stream in place): trending by move size, active by volume.
const TRENDING_ROWS = [...TRENDING_STOCKS].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
const MOST_ACTIVE_ROWS = [...MOST_ACTIVE_STOCKS].sort((a, b) => b.volume - a.volume);

// The watchlist quotes always read these feeds, so they advance every tick; the
// remaining mover feeds only matter once selected and are caught up lazily then.
const WATCHLIST_TICKERS = new Set(INSTRUMENTS.map((inst) => inst.ticker));

/** The on-screen instrument and the data read from its feed, which must always agree. */
interface ActiveInstrument {
    ticker: string;
    bars: Bar[];
    metrics: GaugeMetrics;
}

function readInstrument(feeds: Map<string, MarketFeed>, ticker: string): ActiveInstrument {
    const feed = feeds.get(ticker)!;
    return { ticker, bars: feed.snapshot(), metrics: feed.metrics() };
}

function readQuotes(feeds: Map<string, MarketFeed>): Quote[] {
    return INSTRUMENTS.map((inst) => {
        const feed = feeds.get(inst.ticker)!;
        return {
            ticker: inst.ticker,
            name: inst.name,
            ...feed.quote(),
            history: feed.closeHistory(),
            baseline: feed.sessionOpen,
        };
    });
}

/**
 * Manages one live feed per instrument and exposes the active bars + all quotes. The React
 * `useStreamingMarket` hook as a service: FinancialApp provides it, so it lives exactly as long as
 * the app does, and the hook's state and setters are signals.
 */
@Injectable()
export class StreamingMarket {
    private readonly now = startTime();
    private readonly feeds = new Map(ALL_INSTRUMENTS.map((inst) => [inst.ticker, new MarketFeed(inst, this.now)]));
    readonly peerFeed = new PeerPerformanceFeed(this.now);
    private readonly trendingFeed = new MoverFeed(TRENDING_ROWS);
    private readonly mostActiveFeed = new MoverFeed(MOST_ACTIVE_ROWS);
    // Tick counts per feed, so a lazily-ticked mover feed can be caught up when selected.
    private tickCount = 0;
    private readonly feedTicks = new Map(ALL_INSTRUMENTS.map((inst) => [inst.ticker, 0]));
    // Ticks advance the model synchronously but flush state through one animation frame, so the
    // signals never outpace paint.
    private flush = 0;
    // The oldest bar the chart still displays; the selected feed keeps everything newer.
    private retainFrom?: number;

    private readonly active = signal<ActiveInstrument>(readInstrument(this.feeds, INSTRUMENTS[0].ticker));
    /** The selected ticker, its bars and its gauge metrics, always read from the same snapshot. */
    readonly ticker = computed(() => this.active().ticker);
    readonly bars = computed(() => this.active().bars);
    readonly metrics = computed(() => this.active().metrics);
    readonly instrument = computed(() => ALL_INSTRUMENTS.find((inst) => inst.ticker === this.ticker())!);
    // Deterministic mode starts paused, so the frozen seed history is what renders; Live still streams.
    readonly running = signal(!DETERMINISTIC);
    readonly speedMs = signal(500);
    readonly quotes = signal<Quote[]>(readQuotes(this.feeds));
    readonly trending = signal<MoverRow[]>(this.trendingFeed.snapshot());
    readonly mostActive = signal<MoverRow[]>(this.mostActiveFeed.snapshot());
    // Bumped on every tick so consumers of the (mutable) peer feed recompute.
    readonly peerTick = signal(0);

    constructor() {
        effect((onCleanup) => {
            if (!this.running()) return;
            const id = window.setInterval(() => this.tick(), this.speedMs());
            onCleanup(() => {
                window.clearInterval(id);
                this.cancelFlush();
            });
        });
    }

    setRetainFrom(time?: number): void {
        this.retainFrom = time;
    }

    toggleRunning(): void {
        this.running.update((prev) => !prev);
    }

    // Select an instrument, catching a lazily-ticked mover feed up to the current time first so its
    // series looks live rather than frozen at the moment it was seeded.
    selectTicker(next: string): void {
        this.feeds.get(next)!.catchUp(this.tickCount - this.feedTicks.get(next)!);
        this.feedTicks.set(next, this.tickCount);
        // The outgoing chart's floor cannot apply to a feed that never retained those bars.
        this.retainFrom = undefined;
        this.active.set(readInstrument(this.feeds, next));
    }

    private tick(): void {
        // Only the watchlist feeds and the on-screen instrument; the rest are caught up on select.
        const { feeds, feedTicks } = this;
        const count = ++this.tickCount;
        const selected = this.ticker();
        const advance = (feedTicker: string) => {
            // Only the on-screen feed has a display floor; the rest keep the baseline window.
            feeds.get(feedTicker)!.tick(feedTicker === selected ? this.retainFrom : undefined);
            feedTicks.set(feedTicker, count);
        };
        WATCHLIST_TICKERS.forEach(advance);
        if (!WATCHLIST_TICKERS.has(selected)) advance(selected);
        this.peerFeed.tick();
        const trendingRows = this.trendingFeed.tick();
        const mostActiveRows = this.mostActiveFeed.tick();

        // Replace any pending flush so only the most recent state reaches the signals. The selection
        // is re-read in the frame: a select between tick and flush must not be reverted.
        this.cancelFlush();
        this.flush = requestAnimationFrame(() => {
            this.flush = 0;
            this.active.set(readInstrument(feeds, this.ticker()));
            this.quotes.set(readQuotes(feeds));
            this.trending.set(trendingRows);
            this.mostActive.set(mostActiveRows);
            this.peerTick.update((prev) => prev + 1);
        });
    }

    private cancelFlush(): void {
        if (this.flush) cancelAnimationFrame(this.flush);
        this.flush = 0;
    }
}
