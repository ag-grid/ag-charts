// Park-Miller LCG. Drop-in replacement for Math.random() in examples that
// need deterministic output for visual smoke testing.
export function createSeededRandom(seed = 42): () => number {
    let state = seed;
    return () => {
        state = (state * 16807) % 2147483647;
        return (state - 1) / 2147483646;
    };
}

export const random = createSeededRandom();
