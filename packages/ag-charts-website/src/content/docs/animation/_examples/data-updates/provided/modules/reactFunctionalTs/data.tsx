const NUM_DATA_POINTS = 30;
let _seed = 1234;

// Create a set of data with predicatable "randomness"
export function getData(
    start = [100, 100, 100, 100],
    variance = 2,
    offset = 0,
    length = NUM_DATA_POINTS,
    seed = _seed
) {
    // Vary the datum by a random proportion of the variance +ve or -ve
    const vary = (n: number) => Math.max(0, n + variance * random() * 2 - variance);

    _seed = seed;
    const data: Array<{ year: number; one: number; two: number; three: number; four: number; five: number }> = [
        {
            year: new Date().getFullYear() - NUM_DATA_POINTS,
            one: start[0],
            two: start[1],
            three: start[2],
            four: start[3],
            five: start[4],
        },
    ];
    for (let i = 1; i < NUM_DATA_POINTS + offset; i++) {
        data.push({
            year: new Date().getFullYear() - NUM_DATA_POINTS + i,
            one: vary(data[i - 1].one),
            two: vary(data[i - 1].two),
            three: vary(data[i - 1].three),
            four: vary(data[i - 1].four),
            five: vary(data[i - 1].five),
        });
    }
    return data.slice(offset - (length - NUM_DATA_POINTS));
}

export function random() {
    _seed = (_seed * 16807) % 2147483647;
    return (_seed - 1) / 2147483646;
}
