// Deterministic mode for the financial demo's synthetic market data.
//
// The parity harness (e2e/parity) renders this demo and each framework port side by side and
// compares the pixels, which only works if both produce identical data on every load. This file is
// the whole contract: a port mirrors these three exports and consumes them from the same places
// its data source does. Nothing else in the demo reads the clock or draws a random number.
//
// The switch is `?deterministic=1` in the page URL, or `VITE_DEMO_DETERMINISTIC=1` at build time.
// Normal loads are unaffected: the clock is live and the random source is `Math.random`.

const isOn = (value: string | null | undefined) => value === '1' || value === 'true';

function readSwitch(): boolean {
    if (isOn(import.meta.env.VITE_DEMO_DETERMINISTIC)) return true;
    if (typeof window === 'undefined') return false;
    return isOn(new URLSearchParams(window.location.search).get('deterministic'));
}

/** True when the demo must produce identical data on every load. */
export const DETERMINISTIC: boolean = readSwitch();

/** The session start in deterministic mode: 2026-07-23 15:30 UTC, so bar times are fixed too. */
export const DETERMINISTIC_START_TIME = Date.UTC(2026, 6, 23, 15, 30);

/** The instant the streamed session starts: the wall clock normally, a fixed epoch in deterministic mode. */
export function startTime(): number {
    return DETERMINISTIC ? DETERMINISTIC_START_TIME : Date.now();
}

/**
 * A source of uniform random numbers in [0, 1) for one consumer of randomness.
 *
 * In deterministic mode the sequence is seeded by `label`, so every consumer draws from its own
 * stream and the result does not depend on the order in which consumers are created or ticked.
 * A port therefore only has to use the same labels, not replicate construction order.
 */
export function randomSource(label: string): () => number {
    return DETERMINISTIC ? seededRandom(label) : Math.random;
}

/** Deterministic PRNG: FNV-1a hashes `seed` into a mulberry32 state. Always seeded, in every mode. */
export function seededRandom(seed: string): () => number {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
        h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
    }
    return () => {
        h += 0x6d2b79f5;
        let t = Math.imul(h ^ (h >>> 15), 1 | h);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
