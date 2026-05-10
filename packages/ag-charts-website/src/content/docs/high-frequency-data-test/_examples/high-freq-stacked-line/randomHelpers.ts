// Shared random-data helpers for non-public test/benchmark examples. Public
// docs examples use ./seededRandom directly to keep their import surface
// minimal — see _shared/seededRandom.ts.
import { createSeededRandom, random as defaultRandom } from './seededRandom';

export { createSeededRandom, defaultRandom as random };

// Random integer in [0, n).
export function randomIndex(n: number, rng: () => number = defaultRandom): number {
    return Math.floor(rng() * n);
}

// Random float in [min, max).
export function randomRange(min: number, max: number, rng: () => number = defaultRandom): number {
    return min + rng() * (max - min);
}

// Symmetric signed jitter in (-magnitude / 2, +magnitude / 2).
export function jitter(magnitude: number, rng: () => number = defaultRandom): number {
    return (rng() - 0.5) * magnitude;
}

// Standard-normal draw via Box-Muller.
export function randomNormal(rng: () => number = defaultRandom): number {
    const u1 = rng();
    const u2 = rng();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
