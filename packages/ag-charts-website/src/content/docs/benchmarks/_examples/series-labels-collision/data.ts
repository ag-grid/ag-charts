const scatterPoints = 800;
const barCount = 200;

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
 * Clustered points, so a large share of labels genuinely compete for space: a uniform scatter
 * places nearly every label at its first candidate and never exercises the fallback cascade.
 */
export function getScatterData() {
    const random = seedRandom();
    const clusters = 40;
    return Array.from({ length: scatterPoints }, (_, i) => {
        const cluster = i % clusters;
        const cx = 10 + (cluster % 8) * 12;
        const cy = 10 + Math.floor(cluster / 8) * 18;
        return {
            x: cx + (random() * 2 - 1) * 6,
            y: cy + (random() * 2 - 1) * 9,
            size: 4 + random() * 10,
            name: `Point ${i}`,
        };
    });
}

/** Short bars alongside tall ones, so inside placements fail often enough to cascade outside. */
export function getBarData() {
    const random = seedRandom(4242);
    return Array.from({ length: barCount }, (_, i) => ({
        category: `Category ${i}`,
        value: random() < 0.35 ? random() * 8 : 20 + random() * 180,
    }));
}
