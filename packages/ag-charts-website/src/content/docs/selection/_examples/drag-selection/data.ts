const NUM_DATA_POINTS = 800;

export type DataType = { year: number; low: number; high: number };

export function getData(): DataType[] {
    const data: DataType[] = [];

    for (let i = 0; i < NUM_DATA_POINTS; i++) {
        const base = i === 0 ? random() * 100 : (data[i - 1].low + data[i - 1].high) / 2 + random() * 10 - 5;

        const range = random() * 20 + 5; // controls spread size

        data.push({
            year: new Date().getFullYear() - NUM_DATA_POINTS + i,
            low: base - range / 2,
            high: base + range / 2,
        });
    }

    return data;
}

let seed = 1234;
function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}
