/** mulberry32: a reproducible sequence in [0, 1) per seed, so a failing generated case can be replayed. */
export function seededRandom(seed: number) {
    return () => {
        seed = Math.trunc(seed + 0x6d2b79f5) % 2 ** 32;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
