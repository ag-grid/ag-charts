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

export interface DataPoint {
    date: Date;
    price: number;
}

export function getDatasetA(): DataPoint[] {
    const random = seedRandom(11111);
    const startDate = new Date('2024-01-01');
    const data: DataPoint[] = [];

    for (let i = 0; i < 60; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        data.push({
            date,
            price: 100 + Math.sin(i / 5) * 20 + random() * 10,
        });
    }

    return data;
}

export function getDatasetB(): DataPoint[] {
    const random = seedRandom(22222);
    const startDate = new Date('2024-03-01');
    const data: DataPoint[] = [];

    for (let i = 0; i < 45; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        data.push({
            date,
            price: 150 + Math.cos(i / 4) * 30 + random() * 15,
        });
    }

    return data;
}
