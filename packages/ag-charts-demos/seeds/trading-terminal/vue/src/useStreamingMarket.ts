import { type ComputedRef, type Ref, type ShallowRef, computed, ref, shallowRef, watch } from 'vue';

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

export interface StreamingMarket {
    instrument: ComputedRef<Instrument>;
    bars: ComputedRef<Bar[]>;
    quotes: ShallowRef<Quote[]>;
    metrics: ComputedRef<GaugeMetrics>;
    trending: ShallowRef<MoverRow[]>;
    mostActive: ShallowRef<MoverRow[]>;
    peerFeed: PeerPerformanceFeed;
    /** Bumped on every tick so consumers of the (mutable) peer feed recompute. */
    peerTick: Ref<number>;
    ticker: ComputedRef<string>;
    selectTicker: (next: string) => void;
    setRetainFrom: (time?: number) => void;
    running: Ref<boolean>;
    speedMs: Ref<number>;
}

/** Manages one live feed per instrument and exposes the active bars + all quotes. */
export function useStreamingMarket(): StreamingMarket {
    const now = startTime();
    const feeds = new Map(ALL_INSTRUMENTS.map((inst) => [inst.ticker, new MarketFeed(inst, now)]));
    const peerFeed = new PeerPerformanceFeed(now);
    const trendingFeed = new MoverFeed(TRENDING_ROWS);
    const mostActiveFeed = new MoverFeed(MOST_ACTIVE_ROWS);
    // Tick counts per feed, so a lazily-ticked mover feed can be caught up when selected.
    let tickCount = 0;
    const feedTicks = new Map(ALL_INSTRUMENTS.map((inst) => [inst.ticker, 0]));
    // Ticks advance the model synchronously but flush state through one animation frame, so the
    // refs never outpace paint.
    let flush = 0;
    // The oldest bar the chart still displays; the selected feed keeps everything newer.
    let retainFrom: number | undefined;

    // Shallow refs throughout: the snapshots are plain data handed straight to the charts and
    // grids, and deep reactivity would wrap every bar and row in a proxy.
    const active = shallowRef<ActiveInstrument>(readInstrument(feeds, INSTRUMENTS[0].ticker));
    // Deterministic mode starts paused, so the frozen seed history is what renders; Live still streams.
    const running = ref(!DETERMINISTIC);
    const speedMs = ref(500);
    const quotes = shallowRef<Quote[]>(readQuotes(feeds));
    const trending = shallowRef<MoverRow[]>(trendingFeed.snapshot());
    const mostActive = shallowRef<MoverRow[]>(mostActiveFeed.snapshot());
    const peerTick = ref(0);

    const setRetainFrom = (time?: number) => {
        retainFrom = time;
    };

    // Select an instrument, catching a lazily-ticked mover feed up to the current time first so its
    // series looks live rather than frozen at the moment it was seeded.
    const selectTicker = (next: string) => {
        feeds.get(next)!.catchUp(tickCount - feedTicks.get(next)!);
        feedTicks.set(next, tickCount);
        // The outgoing chart's floor cannot apply to a feed that never retained those bars.
        retainFrom = undefined;
        active.value = readInstrument(feeds, next);
    };

    watch(
        [running, speedMs],
        ([isRunning, interval], _previous, onCleanup) => {
            if (!isRunning) return;
            const id = window.setInterval(() => {
                // Only the watchlist feeds and the on-screen instrument; the rest are caught up on select.
                const count = ++tickCount;
                const selected = active.value.ticker;
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

                // Replace any pending flush so only the most recent state reaches the view.
                if (flush) cancelAnimationFrame(flush);
                flush = requestAnimationFrame(() => {
                    flush = 0;
                    // Re-read the selection: a frame queued by the outgoing interval lands after a
                    // selection made in between, and must not revert it.
                    active.value = readInstrument(feeds, active.value.ticker);
                    quotes.value = readQuotes(feeds);
                    trending.value = trendingRows;
                    mostActive.value = mostActiveRows;
                    peerTick.value++;
                });
            }, interval);
            onCleanup(() => {
                window.clearInterval(id);
                if (flush) cancelAnimationFrame(flush);
                flush = 0;
            });
        },
        { immediate: true }
    );

    return {
        instrument: computed(() => ALL_INSTRUMENTS.find((inst) => inst.ticker === active.value.ticker)!),
        bars: computed(() => active.value.bars),
        quotes,
        metrics: computed(() => active.value.metrics),
        trending,
        mostActive,
        peerFeed,
        peerTick,
        ticker: computed(() => active.value.ticker),
        selectTicker,
        setRetainFrom,
        running,
        speedMs,
    };
}
