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
    if (!feedsRef.current || !peerFeedRef.current || !trendingFeedRef.current || !mostActiveFeedRef.current) {
        const now = Date.now();
        feedsRef.current = new Map(ALL_INSTRUMENTS.map((inst) => [inst.ticker, new MarketFeed(inst, now)]));
        peerFeedRef.current = new PeerPerformanceFeed(now);
        trendingFeedRef.current = new MoverFeed(TRENDING_ROWS);
        mostActiveFeedRef.current = new MoverFeed(MOST_ACTIVE_ROWS);
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

    // Keep the visible bars and gauges in sync when the trader switches instruments.
    useEffect(() => {
        setBars(feedsRef.current!.get(ticker)!.snapshot());
        setMetrics(feedsRef.current!.get(ticker)!.metrics());
    }, [ticker]);

    useEffect(() => {
        if (!running) return;
        const id = window.setInterval(() => {
            // Advance every instrument so the watchlist stays live and a ticker
            // switch shows a live series, but only re-render bars for the one on screen.
            const feeds = feedsRef.current!;
            let latest: Bar[] = [];
            feeds.forEach((feed) => {
                const next = feed.tick();
                if (feed.instrument.ticker === ticker) latest = next;
            });
            peerFeedRef.current!.tick();
            setBars(latest);
            setQuotes(readQuotes(feeds));
            setMetrics(feeds.get(ticker)!.metrics());
            setTrending(trendingFeedRef.current!.tick());
            setMostActive(mostActiveFeedRef.current!.tick());
            setPeerTick((prev) => prev + 1);
        }, speedMs);
        return () => window.clearInterval(id);
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
