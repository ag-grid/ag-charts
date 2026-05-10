// Shared random-data helpers for non-public test/benchmark examples.
// Self-contained on purpose: the vanilla example generator strips ESM
// imports, so re-exporting from ./seededRandom would leave references
// undefined. The LCG is inlined here to keep this file standalone, and
// public docs examples use ./seededRandom directly.

export function createSeededRandom(seed = 42): () => number {
    let state = seed;
    return () => {
        state = (state * 16807) % 2147483647;
        return (state - 1) / 2147483646;
    };
}

export const random = createSeededRandom();

export function randomIndex(n: number, rng: () => number = random): number {
    return Math.floor(rng() * n);
}

export function randomRange(min: number, max: number, rng: () => number = random): number {
    return min + rng() * (max - min);
}

export function jitter(magnitude: number, rng: () => number = random): number {
    return (rng() - 0.5) * magnitude;
}

export function randomNormal(rng: () => number = random): number {
    const u1 = rng();
    const u2 = rng();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
