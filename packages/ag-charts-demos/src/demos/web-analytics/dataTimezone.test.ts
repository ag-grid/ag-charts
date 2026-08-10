import { expect, it } from 'vitest';

import { DATA_END, DATA_START, HISTORY_DAYS, SESSIONS } from './data';

// Runs under a DST-observing zone (see vitest.config.tz.ts). Aggregation buckets by
// local midnight, so history must advance by calendar day: fixed 24h steps drift an
// hour off midnight past a transition and spill sessions into the neighbouring bucket.

const isMidnight = (d: Date) =>
    d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0;

const localDayKey = (ms: number) => {
    const d = new Date(ms);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

it('runs in a zone that actually observes DST', () => {
    const january = new Date(DATA_END.getFullYear(), 0, 1).getTimezoneOffset();
    const july = new Date(DATA_END.getFullYear(), 6, 1).getTimezoneOffset();
    expect(january).not.toBe(july);
});

it('anchors both ends of the window to local midnight', () => {
    expect(isMidnight(DATA_START)).toBe(true);
    expect(isMidnight(DATA_END)).toBe(true);
});

it('places every session inside the window', () => {
    const first = DATA_START.getTime();
    const last = new Date(DATA_END.getFullYear(), DATA_END.getMonth(), DATA_END.getDate() + 1).getTime();
    for (const session of SESSIONS) {
        expect(session.timestamp).toBeGreaterThanOrEqual(first);
        expect(session.timestamp).toBeLessThan(last);
    }
});

it('spreads sessions across exactly HISTORY_DAYS calendar days', () => {
    // The load-bearing assertion: a fixed-24h generator drifts off midnight past a DST
    // transition, so its days straddle two buckets and this count overshoots.
    const days = new Set(SESSIONS.map((s) => localDayKey(s.timestamp)));
    expect(days.size).toBe(HISTORY_DAYS);
});
