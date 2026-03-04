export interface DataType {
    year: string;
    one: number;
    two: number;
    three: number;
    four: number;
    five: number;
}

let seed = 1234;
const START = [120, 150, 130, 140, 80] as const;
const VARIANCE = 20;
const LENGTH = 8;

function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}

// Create a set of data with predictable "randomness"
export function getRandomizedData(): DataType[] {
    // Vary the datum by a random proportion of the variance +ve or -ve
    const vary = (n: number) => Math.max(0, n + VARIANCE * random() * 2 - VARIANCE);

    const startYear = 2025;
    const data: DataType[] = [
        {
            year: `${startYear}`,
            one: vary(START[0]),
            two: vary(START[1]),
            three: vary(START[2]),
            four: vary(START[3]),
            five: vary(START[4]),
        },
    ];
    for (let i = 1; i < LENGTH; i++) {
        data.push({
            year: `${startYear + i}`,
            one: vary(data[i - 1].one),
            two: vary(data[i - 1].two),
            three: vary(data[i - 1].three),
            four: vary(data[i - 1].four),
            five: vary(data[i - 1].five),
        });
    }
    return data;
}
