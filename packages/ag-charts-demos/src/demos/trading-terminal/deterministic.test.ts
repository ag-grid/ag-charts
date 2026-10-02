import { afterEach, describe, expect, it, vi } from 'vitest';

// Deterministic mode is read once at import time, so each case loads the modules afresh.
async function loadData(deterministic: boolean) {
    vi.resetModules();
    if (deterministic) vi.stubEnv('VITE_DEMO_DETERMINISTIC', '1');
    const [data, mode] = await Promise.all([import('./data'), import('./deterministic')]);
    return { ...data, ...mode };
}

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('deterministic mode', () => {
    it('is off by default and reads the live clock', async () => {
        const { DETERMINISTIC, startTime, INSTRUMENTS, MarketFeed } = await loadData(false);
        expect(DETERMINISTIC).toBe(false);
        expect(Math.abs(startTime() - Date.now())).toBeLessThan(1_000);
        const now = startTime();
        const [a, b] = [new MarketFeed(INSTRUMENTS[0], now), new MarketFeed(INSTRUMENTS[0], now)];
        expect(a.snapshot()).not.toEqual(b.snapshot());
    });

    it('freezes the start time and seeds every feed by its own label', async () => {
        const { DETERMINISTIC, DETERMINISTIC_START_TIME, startTime, INSTRUMENTS, MarketFeed, PeerPerformanceFeed } =
            await loadData(true);
        expect(DETERMINISTIC).toBe(true);
        expect(startTime()).toBe(DETERMINISTIC_START_TIME);

        // Construction order must not matter: the same instrument yields the same bars either way round.
        const now = startTime();
        const first = new MarketFeed(INSTRUMENTS[1], now);
        new PeerPerformanceFeed(now).tick();
        const second = new MarketFeed(INSTRUMENTS[1], now);
        expect(second.snapshot()).toEqual(first.snapshot());
        expect(first.snapshot()).not.toEqual(new MarketFeed(INSTRUMENTS[0], now).snapshot());

        // Streaming stays reproducible too, one bar per tick.
        first.tick();
        second.tick();
        expect(second.snapshot()).toEqual(first.snapshot());
        expect(second.metrics()).toEqual(first.metrics());
    });
});
