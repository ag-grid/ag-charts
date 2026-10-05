// Port of useStreamingMarket.ts: the same feeds, tick loop and animation-frame flush, exposed as a
// store that notifies subscribers once per state change instead of re-rendering a component.
import {
    ALL_INSTRUMENTS,
    type Bar,
    type GaugeMetrics,
    INSTRUMENTS,
    type Instrument,
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

/** What the React hook returns, minus the setters: read after every notification. */
export interface MarketState {
    instrument: Instrument;
    ticker: string;
    bars: Bar[];
    metrics: GaugeMetrics;
    quotes: Quote[];
    trending: MoverRow[];
    mostActive: MoverRow[];
    /** Bumped on every tick so consumers of the (mutable) peer feed recompute. */
    peerTick: number;
    running: boolean;
    speedMs: number;
}

export interface StreamingMarket {
    readonly peerFeed: PeerPerformanceFeed;
    getState(): MarketState;
    /** Called once after each state change; a tick's flush is one change. Returns the unsubscribe. */
    subscribe(listener: () => void): () => void;
    selectTicker(next: string): void;
    setRetainFrom(time?: number): void;
    setRunning(running: boolean): void;
    setSpeedMs(speedMs: number): void;
}

/** Manages one live feed per instrument and exposes the active bars + all quotes. */
export function createStreamingMarket(): StreamingMarket {
    const now = startTime();
    const feeds = new Map(ALL_INSTRUMENTS.map((inst) => [inst.ticker, new MarketFeed(inst, now)]));
    const peerFeed = new PeerPerformanceFeed(now);
    const trendingFeed = new MoverFeed(TRENDING_ROWS);
    const mostActiveFeed = new MoverFeed(MOST_ACTIVE_ROWS);
    // Tick counts per feed, so a lazily-ticked mover feed can be caught up when selected.
    let tickCount = 0;
    const feedTicks = new Map(ALL_INSTRUMENTS.map((inst) => [inst.ticker, 0]));
    // Ticks advance the model synchronously but flush state through one animation frame, so
    // subscribers never outpace paint.
    let flushId = 0;
    let intervalId = 0;
    // The oldest bar the chart still displays; the selected feed keeps everything newer.
    let retainFrom: number | undefined;

    let active = readInstrument(feeds, INSTRUMENTS[0].ticker);
    // Deterministic mode starts paused, so the frozen seed history is what renders; Live still streams.
    let running = !DETERMINISTIC;
    let speedMs = 500;
    let quotes = readQuotes(feeds);
    let trending = trendingFeed.snapshot();
    let mostActive = mostActiveFeed.snapshot();
    let peerTick = 0;

    const listeners = new Set<() => void>();
    const notify = () => listeners.forEach((listener) => listener());

    const cancelFlush = () => {
        if (flushId) cancelAnimationFrame(flushId);
        flushId = 0;
    };

    // The React effect keyed on [running, speedMs]: (re)start the interval, dropping any pending flush.
    function restartStream() {
        if (intervalId) window.clearInterval(intervalId);
        intervalId = 0;
        cancelFlush();
        if (!running) return;
        intervalId = window.setInterval(() => {
            // Only the watchlist feeds and the on-screen instrument; the rest are caught up on select.
            const count = ++tickCount;
            const selected = active.ticker;
            const advance = (feedTicker: string) => {
                // Only the on-screen feed has a display floor; the rest keep the baseline window.
                feeds.get(feedTicker)!.tick(feedTicker === selected ? retainFrom : undefined);
                feedTicks.set(feedTicker, count);
            };
            WATCHLIST_TICKERS.forEach(advance);
            if (!WATCHLIST_TICKERS.has(selected)) advance(selected);
            peerFeed.tick();
            const trendingRows = trendingFeed.tick();
            const mostActiveRows = mostActiveFeed.tick();

            // Replace any pending flush so only the most recent state reaches the subscribers.
            cancelFlush();
            flushId = requestAnimationFrame(() => {
                flushId = 0;
                active = readInstrument(feeds, active.ticker);
                quotes = readQuotes(feeds);
                trending = trendingRows;
                mostActive = mostActiveRows;
                peerTick += 1;
                notify();
            });
        }, speedMs);
    }
    restartStream();

    return {
        peerFeed,
        getState: () => ({
            instrument: ALL_INSTRUMENTS.find((inst) => inst.ticker === active.ticker)!,
            ticker: active.ticker,
            bars: active.bars,
            metrics: active.metrics,
            quotes,
            trending,
            mostActive,
            peerTick,
            running,
            speedMs,
        }),
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        // Select an instrument, catching a lazily-ticked mover feed up to the current time first so its
        // series looks live rather than frozen at the moment it was seeded.
        selectTicker(next) {
            feeds.get(next)!.catchUp(tickCount - feedTicks.get(next)!);
            feedTicks.set(next, tickCount);
            // The outgoing chart's floor cannot apply to a feed that never retained those bars.
            retainFrom = undefined;
            active = readInstrument(feeds, next);
            notify();
        },
        setRetainFrom(time) {
            retainFrom = time;
        },
        setRunning(next) {
            if (next === running) return;
            running = next;
            restartStream();
            notify();
        },
        setSpeedMs(next) {
            if (next === speedMs) return;
            speedMs = next;
            restartStream();
            notify();
        },
    };
}
