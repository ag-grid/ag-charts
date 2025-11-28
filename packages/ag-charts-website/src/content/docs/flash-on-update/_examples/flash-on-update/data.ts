export interface DataType {
    year: string;
    one: number;
    two: number;
    three: number;
    four: number;
    five: number;
}

// Create a set of data with predicatable "randomness"
export function getData(
    start: readonly [number, number, number, number, number],
    variance: number,
    length: number,
    random: () => number
): DataType[] {
    // Vary the datum by a random proportion of the variance +ve or -ve
    const vary = (n) => Math.max(0, n + variance * random() * 2 - variance);

    const startYear = 2025;
    const data: DataType[] = [
        {
            year: `${startYear}`,
            one: vary(start[0]),
            two: vary(start[1]),
            three: vary(start[2]),
            four: vary(start[3]),
            five: vary(start[4]),
        },
    ];
    for (let i = 1; i < length; i++) {
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
