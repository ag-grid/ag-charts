export interface DataType {
    year: string;
    one: number;
    two: number;
    three: number;
    four: number;
    five: number;
}

let seed = NaN;
const START = [120, 150, 130, 140, 80] as const;
const VARIANCE = 20;
const LENGTH = 8;

function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}

// Create a set of data with predicatable "randomness"
export function getRandomizedData(): DataType[] {
    // Reset:
    seed = 1234;

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

// Update 1-3 elements in the input `data`
export function randomizeSomeElements(data: DataType[]): DataType[] {
    const vary = (n: number) => Math.max(0, n + VARIANCE * random() * 2 - VARIANCE);

    // How many elements to update?
    const countToRandomize = Math.floor(random() * 3) + 1;

    // Pick random unique indices
    const indices = new Set<number>();
    while (indices.size < countToRandomize) {
        indices.add(Math.floor(random() * data.length));
    }

    // Apply random variation to the selected elements
    const result = data.map((item) => ({ ...item }));
    for (const idx of Array.from(indices)) {
        const item = result[idx];
        result[idx] = {
            ...item,
            one: vary(item.one),
            two: vary(item.two),
            three: vary(item.three),
            four: vary(item.four),
            five: vary(item.five),
        };
    }

    return result;
}

// Append a new randomized datum
export function appendRandomizedElement(data: DataType[]): DataType[] {
    if (data.length === 0) return data;

    const vary = (n: number) => Math.max(0, n + VARIANCE * random() * 2 - VARIANCE);

    const last = data[data.length - 1];
    const nextYear = String(Number(last.year) + 1);

    const newItem: DataType = {
        year: nextYear,
        one: vary(last.one),
        two: vary(last.two),
        three: vary(last.three),
        four: vary(last.four),
        five: vary(last.five),
    };

    return [...data, newItem];
}
