function sfc32(a: number, b: number, c: number, d: number) {
    return function () {
        a >>>= 0;
        b >>>= 0;
        c >>>= 0;
        d >>>= 0;
        let t = Math.trunc(a + b);
        a = b ^ (b >>> 9);
        b = Math.trunc(c + (c << 3));
        c = (c << 21) | (c >>> 11);
        d = Math.trunc(d + 1);
        t = Math.trunc(t + d);
        c = Math.trunc(c + t);
        return (t >>> 0) / 4294967296;
    };
}

export function seedRandom(seed = 1337): () => number {
    const realSeed = seed ^ 0xdeadbeef; // 32-bit seed with optional XOR value
    // Pad seed with Phi, Pi and E.
    // https://en.wikipedia.org/wiki/Nothing-up-my-sleeve_number
    return sfc32(0x9e3779b9, 0x243f6a88, 0xb7e15162, realSeed);
}

/**
 * A Park-Miller minimal standard LCG (multiplier 16807, modulus 2^31 - 1). It yields a different sequence from
 * {@link seedRandom}, so it is kept separate for the tests whose data was generated with it.
 */
export function seedLcgRandom(seed = 1337): () => number {
    return function random() {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };
}
