const points = 1000000;

// Base value just beyond Number.MAX_SAFE_INTEGER (2^53 - 1 = 9_007_199_254_740_991).
// Every y value is a bigint and stays outside the safe-integer range.
const yBase = 9_007_199_254_740_993n;
const maxDelta = 5_000_000_000_000_000_000n; // wei-scale jitter

function sfc32(a: number, b: number, c: number, d: number) {
    return function () {
        a >>>= 0;
        b >>>= 0;
        c >>>= 0;
        d >>>= 0;
        let t = (a + b) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        d = (d + 1) | 0;
        t = (t + d) | 0;
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
    };
}

function seedRandom(seed = 1337): () => number {
    const realSeed = seed ^ 0xdeadbeef; // 32-bit seed with optional XOR value
    // Pad seed with Phi, Pi and E.
    // https://en.wikipedia.org/wiki/Nothing-up-my-sleeve_number
    return sfc32(0x9e3779b9, 0x243f6a88, 0xb7e15162, realSeed);
}

export function getData() {
    const random = seedRandom();
    return Array.from({ length: points }, (_, i) => {
        // Scale a [0, 1) float into a bigint delta without losing magnitude.
        const delta = (BigInt(Math.floor(random() * 1_000_000)) * maxDelta) / 1_000_000n;
        const y = yBase + delta;
        return { x: i, y };
    });
}
