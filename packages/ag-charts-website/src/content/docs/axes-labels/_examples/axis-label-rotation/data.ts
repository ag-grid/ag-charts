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
    const realSeed = seed ^ 0xdeadbeef;
    return sfc32(0x9e3779b9, 0x243f6a88, 0xb7e15162, realSeed);
}

const years: number[] = [];
for (let year = 2005; year <= 2022; year++) {
    years.push(year);
}

const countries = [
    'Ireland',
    'Spain',
    'United Kingdom',
    'France',
    'Germany',
    'Luxembourg',
    'Sweden',
    'Norway',
    'Italy',
    'Greece',
    'Iceland',
    'Portugal',
    'Malta',
    'Brazil',
    'Argentina',
    'Colombia',
    'Peru',
    'Venezuela',
    'Uruguay',
    'Belgium',
];
countries.sort();

export function getData(): any[] {
    const random = seedRandom(54321);
    return years.map((year, idx) => ({
        year,
        country: countries[idx],
        value: Math.round(random() * 1000),
    }));
}
