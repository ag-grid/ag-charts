const startPrice = 100;
const startPrice2 = 50;
const maxDailyPriceChange = 5;
const maxRangeDelta = 1;

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

export function getData(days: number) {
    let currentPrice = startPrice;
    const random = seedRandom();
    return Array.from({ length: days }, (_, i) => {
        // Note time is reversed
        const close = currentPrice;
        const open = close + (random() * 2 - 1) * maxDailyPriceChange;
        currentPrice = open;

        const high = Math.max(open, close) + random() * maxRangeDelta;
        const low = Math.min(open, close) - random() * maxRangeDelta;

        const timestamp = new Date(2024, 0, 1, -i);

        return { timestamp, open, close, high, low };
    }).reverse();
}

export function getStackedData(days: number) {
    const random = seedRandom();
    let series1 = startPrice;
    let series2 = startPrice2;
    return Array.from({ length: days / 2 }, (_, i) => {
        // Note time is reversed
        series1 += (random() * 2 - 1) * maxDailyPriceChange;
        series2 += (random() * 2 - 1) * maxDailyPriceChange;

        const timestamp = new Date(2024, 0, 1, -i);

        return { timestamp, series1, series2 };
    }).reverse();
}

export function getBubbleData(days: number) {
    const random = seedRandom();
    return Array.from({ length: days }, () => {
        let x = random();
        let y = random();
        x *= random();
        y *= random();
        const size = random();

        return { x, y, size };
    });
}
