const startPrice = 100;
const maxDailyPriceChange = 5;
const days = 1000000;

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
    return Array.from({ length: days }, (_, i) => {
        const price = currentPrice;
        currentPrice += (random() * 2 - 1) * maxDailyPriceChange;

        const timestamp = new Date(2024, 0, 1, -i);

        return { timestamp, price };
    }).reverse();
}
