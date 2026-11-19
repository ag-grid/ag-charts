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
    return sfc32(0x9e3779b9, 0x243f6a88, 0xb7e15162, seed ^ 0xdeadbeef);
}

/**
 * Sectors with a long-tailed spread of values, so some wedges hold their label easily, some only
 * once it is truncated, and the thinnest hold nothing.
 */
export function getSectorData(count: number, seed = 1337) {
    const random = seedRandom(seed);
    return Array.from({ length: count }, (_, i) => ({
        name: `Category ${i + 1} label`,
        value: Math.round(10 + random() ** 3 * 990),
    }));
}
