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
for (let year = 2012; year <= 2022; year++) {
    years.push(year);
}

const sportStars = [
    'Usain Bolt',
    'Serena Williams',
    'Michael Phelps',
    'Simone Biles',
    'Lionel Messi',
    'Roger Federer',
    'Katie Ledecky',
    'Cristiano Ronaldo',
    'Naomi Osaka',
    'LeBron James',
    'Max Verstappen',
];

export function getData(): any[] {
    const random = seedRandom(67890);
    return years.map((year, idx) => ({
        year,
        sportStar: sportStars[idx],
        value: Math.round(random() * 1000),
    }));
}
