const startPrice = 100;
const maxDailyPriceChange = 5;
const days = 1000000;

// Same random walk as axes-1M-number mapped into bigint space, so y-value type is the only
// difference. Scaled and offset so every value stays beyond Number.MAX_SAFE_INTEGER.
const priceBase = 10_000_000_000_000_000_000_000n;
const priceScale = 1_000_000_000_000n;

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
    let currentPrice = startPrice;
    const random = seedRandom();
    return Array.from({ length: days }, (_, index) => {
        const price = priceBase + BigInt(Math.round(currentPrice * 1_000_000)) * priceScale;
        currentPrice += (random() * 2 - 1) * maxDailyPriceChange;

        return { index, price };
    }).reverse();
}
