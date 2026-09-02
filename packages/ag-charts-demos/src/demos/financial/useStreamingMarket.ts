import { useCallback, useEffect, useRef, useState } from 'react';

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

/** Manages one live feed per instrument and exposes the active bars + all quotes. */
export function useStreamingMarket() {
    const feedsRef = useRef<Map<string, MarketFeed>>();
    const peerFeedRef = useRef<PeerPerformanceFeed>();
    const trendingFeedRef = useRef<MoverFeed>();
    const mostActiveFeedRef = useRef<MoverFeed>();
    // Tick counts per feed, so a lazily-ticked mover feed can be caught up when selected.
    const tickCountRef = useRef(0);
    const feedTickRef = useRef<Map<string, number>>();
    // Ticks advance the model synchronously but flush state through one animation frame, so setters
    // never outpace paint.
    const flushRef = useRef(0);
    // The oldest bar the chart still displays; the selected feed keeps everything newer.
    const retainFromRef = useRef<number>();
    if (!feedsRef.current || !peerFeedRef.current || !trendingFeedRef.current || !mostActiveFeedRef.current) {
        const now = Date.now();
        feedsRef.current = new Map(ALL_INSTRUMENTS.map((inst) => [inst.ticker, new MarketFeed(inst, now)]));
        peerFeedRef.current = new PeerPerformanceFeed(now);
        trendingFeedRef.current = new MoverFeed(TRENDING_ROWS);
        mostActiveFeedRef.current = new MoverFeed(MOST_ACTIVE_ROWS);
        feedTickRef.current = new Map(ALL_INSTRUMENTS.map((inst) => [inst.ticker, 0]));
    }

    const [active, setActive] = useState<ActiveInstrument>(() =>
        readInstrument(feedsRef.current!, INSTRUMENTS[0].ticker)
    );
    const { ticker, bars, metrics } = active;
    // The selection, readable synchronously: a frame queued by the outgoing interval lands before React runs
    // the cancelling effect, and a captured `ticker` would make that frame revert the selection.
    const tickerRef = useRef(ticker);
    const [running, setRunning] = useState(true);
    const [speedMs, setSpeedMs] = useState(500);
    const [quotes, setQuotes] = useState<Quote[]>(() => readQuotes(feedsRef.current!));
    const [trending, setTrending] = useState<MoverRow[]>(() => trendingFeedRef.current!.snapshot());
    const [mostActive, setMostActive] = useState<MoverRow[]>(() => mostActiveFeedRef.current!.snapshot());
    // Bumped on every tick so consumers of the (mutable) peer feed recompute.
    const [peerTick, setPeerTick] = useState(0);

    const setRetainFrom = useCallback((time?: number) => {
        retainFromRef.current = time;
    }, []);

    // Select an instrument, catching a lazily-ticked mover feed up to the current time first so its
    // series looks live rather than frozen at the moment it was seeded.
    const selectTicker = useCallback((next: string) => {
        const feeds = feedsRef.current!;
        const feedTicks = feedTickRef.current!;
        feeds.get(next)!.catchUp(tickCountRef.current - feedTicks.get(next)!);
        feedTicks.set(next, tickCountRef.current);
        // The outgoing chart's floor cannot apply to a feed that never retained those bars.
        retainFromRef.current = undefined;
        tickerRef.current = next;
        setActive(readInstrument(feeds, next));
    }, []);

    useEffect(() => {
        if (!running) return;
        const id = window.setInterval(() => {
            // Only the watchlist feeds and the on-screen instrument; the rest are caught up on select.
            const feeds = feedsRef.current!;
            const feedTicks = feedTickRef.current!;
            const count = ++tickCountRef.current;
            const selected = tickerRef.current;
            const advance = (feedTicker: string) => {
                // Only the on-screen feed has a display floor; the rest keep the baseline window.
                feeds.get(feedTicker)!.tick(feedTicker === selected ? retainFromRef.current : undefined);
                feedTicks.set(feedTicker, count);
            };
            WATCHLIST_TICKERS.forEach(advance);
            if (!WATCHLIST_TICKERS.has(selected)) advance(selected);
            peerFeedRef.current!.tick();
            const trendingRows = trendingFeedRef.current!.tick();
            const mostActiveRows = mostActiveFeedRef.current!.tick();

            // Replace any pending flush so only the most recent state reaches React.
            if (flushRef.current) cancelAnimationFrame(flushRef.current);
            flushRef.current = requestAnimationFrame(() => {
                flushRef.current = 0;
                setActive(readInstrument(feeds, tickerRef.current));
                setQuotes(readQuotes(feeds));
                setTrending(trendingRows);
                setMostActive(mostActiveRows);
                setPeerTick((prev) => prev + 1);
            });
        }, speedMs);
        return () => {
            window.clearInterval(id);
            if (flushRef.current) cancelAnimationFrame(flushRef.current);
            flushRef.current = 0;
        };
    }, [running, speedMs]);

    const instrument = ALL_INSTRUMENTS.find((inst) => inst.ticker === ticker)!;
    return {
        instrument,
        bars,
        quotes,
        metrics,
        trending,
        mostActive,
        peerFeed: peerFeedRef.current,
        peerTick,
        ticker,
        selectTicker,
        setRetainFrom,
        running,
        setRunning,
        speedMs,
        setSpeedMs,
    };
}
