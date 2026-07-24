import { useEffect, useRef, useState } from 'react';

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
    // Total ticks streamed, and the tick count each feed has been advanced to, so a
    // lazily-ticked mover feed can be caught up to "now" when it is selected.
    const tickCountRef = useRef(0);
    const feedTickRef = useRef<Map<string, number>>();
    // Pending coalesced state flush; interval ticks advance the model synchronously
    // but push their state through a single animation frame so setters never outpace paint.
    const flushRef = useRef(0);
    if (!feedsRef.current || !peerFeedRef.current || !trendingFeedRef.current || !mostActiveFeedRef.current) {
        const now = Date.now();
        feedsRef.current = new Map(ALL_INSTRUMENTS.map((inst) => [inst.ticker, new MarketFeed(inst, now)]));
        peerFeedRef.current = new PeerPerformanceFeed(now);
        trendingFeedRef.current = new MoverFeed(TRENDING_ROWS);
        mostActiveFeedRef.current = new MoverFeed(MOST_ACTIVE_ROWS);
        feedTickRef.current = new Map(ALL_INSTRUMENTS.map((inst) => [inst.ticker, 0]));
    }

    const [ticker, setTicker] = useState(INSTRUMENTS[0].ticker);
    const [running, setRunning] = useState(true);
    const [speedMs, setSpeedMs] = useState(500);
    const [bars, setBars] = useState<Bar[]>(() => feedsRef.current!.get(ticker)!.snapshot());
    const [quotes, setQuotes] = useState<Quote[]>(() => readQuotes(feedsRef.current!));
    const [metrics, setMetrics] = useState<GaugeMetrics>(() => feedsRef.current!.get(ticker)!.metrics());
    const [trending, setTrending] = useState<MoverRow[]>(() => trendingFeedRef.current!.snapshot());
    const [mostActive, setMostActive] = useState<MoverRow[]>(() => mostActiveFeedRef.current!.snapshot());
    // Bumped on every tick so consumers of the (mutable) peer feed recompute.
    const [peerTick, setPeerTick] = useState(0);

    // Keep the visible bars and gauges in sync when the trader switches instruments,
    // catching a lazily-ticked mover feed up to the current time first so its series
    // looks live rather than frozen at the moment it was seeded.
    useEffect(() => {
        const feed = feedsRef.current!.get(ticker)!;
        const feedTicks = feedTickRef.current!;
        for (let behind = tickCountRef.current - feedTicks.get(ticker)!; behind > 0; behind--) feed.tick();
        feedTicks.set(ticker, tickCountRef.current);
        setBars(feed.snapshot());
        setMetrics(feed.metrics());
    }, [ticker]);

    useEffect(() => {
        if (!running) return;
        const id = window.setInterval(() => {
            // Advance only the watchlist feeds plus the on-screen instrument; the other
            // mover feeds are consumed only when selected and are caught up lazily then.
            const feeds = feedsRef.current!;
            const feedTicks = feedTickRef.current!;
            const count = ++tickCountRef.current;
            let latest: Bar[] = [];
            const advance = (feedTicker: string) => {
                const next = feeds.get(feedTicker)!.tick();
                feedTicks.set(feedTicker, count);
                if (feedTicker === ticker) latest = next;
            };
            WATCHLIST_TICKERS.forEach(advance);
            if (!WATCHLIST_TICKERS.has(ticker)) advance(ticker);
            peerFeedRef.current!.tick();
            const trendingRows = trendingFeedRef.current!.tick();
            const mostActiveRows = mostActiveFeedRef.current!.tick();

            // Coalesce into one frame: if a flush is already pending, replace it so
            // only the most recent state reaches React.
            if (flushRef.current) cancelAnimationFrame(flushRef.current);
            flushRef.current = requestAnimationFrame(() => {
                flushRef.current = 0;
                setBars(latest);
                setQuotes(readQuotes(feeds));
                setMetrics(feeds.get(ticker)!.metrics());
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
    }, [running, speedMs, ticker]);

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
        setTicker,
        running,
        setRunning,
        speedMs,
        setSpeedMs,
    };
}
