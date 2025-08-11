function sfc32(a, b, c, d) {
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

function seedRandom(seed = 1337) {
    const realSeed = seed ^ 0xdeadbeef; // 32-bit seed with optional XOR value
    // Pad seed with Phi, Pi and E.
    // https://en.wikipedia.org/wiki/Nothing-up-my-sleeve_number
    return sfc32(0x9e3779b9, 0x243f6a88, 0xb7e15162, realSeed);
}

export function getData() {
    const n = 1e5;
    const data = [];

    const random = seedRandom();
    for (let i = 0; i < n; i++) {
        const theta = random() * 2 * Math.PI;
        const radius = Math.pow(random(), 2) * 1;

        const waveDeviation = (random() - 0.5) * 0.7;
        const waveValue = Math.tan(theta) * waveDeviation;

        const x = 0.5 + (radius + waveValue) * Math.cos(theta);
        const y = 0.5 + (radius + waveValue) * Math.sin(theta);

        if (x < 0 || x > 1 || y < 0 || y > 1) continue;

        data.push({ x, y, size: random() });
    }

    return data;
}
