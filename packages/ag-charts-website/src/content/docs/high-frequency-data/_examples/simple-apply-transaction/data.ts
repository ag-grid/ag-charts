const INITIAL_POINTS = 50000;

export interface DataPoint {
    time: number;
    value: number;
}

export function getData(): DataPoint[] {
    const data: DataPoint[] = [];
    const startTime = Date.now();

    for (let i = 0; i < INITIAL_POINTS; i++) {
        data.push({
            time: startTime + i * 100,
            value: Math.sin(i / 1000) * 30 + 50 + random() * 10,
        });
    }

    return data;
}

let seed = 12345;
function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}
