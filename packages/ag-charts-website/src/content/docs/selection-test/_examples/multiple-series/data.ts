const NUM_DATA_POINTS = 800;

export type DataType = {
    year: number;
    a_low: number;
    a_high: number;
    b_low: number;
    b_high: number;
    c_low: number;
    c_high: number;
    d_low: number;
    d_high: number;
};

export function getData(): DataType[] {
    const data: DataType[] = [];

    let base = random() * 100;

    for (let i = 0; i < NUM_DATA_POINTS; i++) {
        base = base + random() * 10 - 5;

        const year = new Date().getFullYear() - NUM_DATA_POINTS + i;

        const [a_low, a_high] = makeSeries(base, 8);
        const [b_low, b_high] = makeSeries(base, 12);
        const [c_low, c_high] = makeSeries(base, 16);
        const [d_low, d_high] = makeSeries(base, 20);

        data.push({
            year,
            a_low,
            a_high,
            b_low,
            b_high,
            c_low,
            c_high,
            d_low,
            d_high,
        });
    }

    return data;
}

function makeSeries(base: number, spread: number): [number, number] {
    const mid = base + random() * 6 - 3;
    const range = spread * (0.5 + random());
    return [mid - range / 2, mid + range / 2];
}

let seed = 1234;
function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}
