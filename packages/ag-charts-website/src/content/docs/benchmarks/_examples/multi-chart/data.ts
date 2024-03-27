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

export function seedRandom(seed = 1337): () => number {
    const realSeed = seed ^ 0xdeadbeef; // 32-bit seed with optional XOR value
    // Pad seed with Phi, Pi and E.
    // https://en.wikipedia.org/wiki/Nothing-up-my-sleeve_number
    return sfc32(0x9e3779b9, 0x243f6a88, 0xb7e15162, realSeed);
}

export function getData(count: number, chartId: number) {
    const random = seedRandom(75023847123 + chartId);

    let baseValue = random() * 1000;
    let time = +new Date(2011, 0, 1);
    let smallBaseValue = 0;

    function next(idx: number) {
        smallBaseValue = idx % 30 === 0 ? random() * 700 : smallBaseValue + random() * 500 - 250;
        baseValue += random() * 20 - 10;
        return Math.max(0, Math.round(baseValue + smallBaseValue) + 3000);
    }

    const data = [];
    data.length = count;

    let i = 0;
    while (i < count) {
        data[i] = {
            time,
            value: next(i++),
        };
        time += 1000;
    }

    return data;
}
