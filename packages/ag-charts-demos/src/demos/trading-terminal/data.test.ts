import { describe, expect, it } from 'vitest';

import { BAR_INTERVAL_MS, INSTRUMENTS, MAX_BARS, MAX_RETAINED_BARS, MarketFeed } from './data';

const NOW = Date.UTC(2024, 0, 1, 12, 0, 0);

const feed = () => new MarketFeed(INSTRUMENTS[0], NOW);
const latestTime = (bars: { time: number }[]) => bars[bars.length - 1].time;

describe('MarketFeed retention', () => {
    it('caps at the baseline window when nothing is on screen', () => {
        const market = feed();
        for (let i = 0; i < MAX_BARS * 2; i++) {
            market.tick();
        }
        expect(market.snapshot()).toHaveLength(MAX_BARS);
    });

    it('keeps every bar newer than the displayed range', () => {
        const market = feed();
        // A viewer zoomed into the oldest bar on screen, which then stays put for 1000 ticks.
        const retainFrom = market.snapshot()[0].time;
        for (let i = 0; i < 1000; i++) {
            market.tick(retainFrom);
        }
        const bars = market.snapshot();
        expect(bars[0].time).toBeGreaterThanOrEqual(retainFrom);
        expect(bars[0].time).toBeLessThan(retainFrom + BAR_INTERVAL_MS);
        expect(bars.length).toBeGreaterThan(MAX_BARS);
    });

    it('never retains less than the baseline for a range near the live edge', () => {
        const market = feed();
        for (let i = 0; i < MAX_BARS; i++) {
            market.tick();
        }
        // A viewer zoomed into the last 10 minutes: newer than the baseline floor, so the floor wins.
        const recent = latestTime(market.snapshot()) - 10 * BAR_INTERVAL_MS;
        for (let i = 0; i < 100; i++) {
            market.tick(recent);
        }
        expect(market.snapshot()).toHaveLength(MAX_BARS);
    });

    it('evicts down to the baseline once the displayed range moves on', () => {
        const market = feed();
        const pinned = market.snapshot()[0].time;
        for (let i = 0; i < 1000; i++) {
            market.tick(pinned);
        }
        market.tick();
        expect(market.snapshot()).toHaveLength(MAX_BARS);
    });

    it('bounds a displayed range that is never released', () => {
        const market = feed();
        const pinned = market.snapshot()[0].time;
        for (let i = 0; i < MAX_RETAINED_BARS + 500; i++) {
            market.tick(pinned);
        }
        expect(market.snapshot()).toHaveLength(MAX_RETAINED_BARS);
    });

    it('leaves bars on one minute intervals however it is ticked', () => {
        const market = feed();
        const retainFrom = market.snapshot()[0].time;
        for (let i = 0; i < 600; i++) {
            market.tick(i % 2 === 0 ? retainFrom : undefined);
        }
        const bars = market.snapshot();
        for (let i = 1; i < bars.length; i++) {
            expect(bars[i].time - bars[i - 1].time).toBe(BAR_INTERVAL_MS);
        }
    });
});

describe('MarketFeed.catchUp', () => {
    it('lands on the same time grid as a feed that ticked every step', () => {
        const live = feed();
        const lazy = feed();
        for (let i = 0; i < 50; i++) {
            live.tick();
        }
        lazy.catchUp(50);
        expect(latestTime(lazy.snapshot())).toBe(latestTime(live.snapshot()));
    });

    it('stays on the time grid without simulating every skipped step', () => {
        const live = feed();
        const lazy = feed();
        const ticks = MAX_BARS * 10;
        for (let i = 0; i < ticks; i++) {
            live.tick();
        }
        lazy.catchUp(ticks);
        const bars = lazy.snapshot();
        expect(latestTime(bars)).toBe(latestTime(live.snapshot()));
        expect(bars).toHaveLength(MAX_BARS);
        for (let i = 1; i < bars.length; i++) {
            expect(bars[i].time - bars[i - 1].time).toBe(BAR_INTERVAL_MS);
        }
    });

    it('is a no-op for a feed that is already current', () => {
        const market = feed();
        const before = market.snapshot();
        market.catchUp(0);
        expect(market.snapshot()).toEqual(before);
    });
});
